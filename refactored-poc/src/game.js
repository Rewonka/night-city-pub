// src/game.js
import { CONFIG } from './config.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randomServeDirection() {
  const angle = (Math.random() * 0.6 - 0.3); // small vertical bias
  const dirX = Math.random() < 0.5 ? -1 : 1;
  return { x: dirX, y: Math.sin(angle) };
}

export function createGameState() {
  const serve = randomServeDirection();
  return {
    // paddles y
    leftY: 0,
    rightY: 0,

    // ball
    ballX: 0,
    ballY: 0,
    ballVx: serve.x * CONFIG.BALL.baseSpeed,
    ballVy: serve.y * CONFIG.BALL.baseSpeed,

    // score
    aiScore: 0,
    playerScore: 0,

    // flow
    roundOver: false,
    roundTimer: 0,
    gameOver: false,
  };
}

export function resetRound(state) {
  state.ballX = 0;
  state.ballY = 0;

  const serve = randomServeDirection();
  state.ballVx = serve.x * CONFIG.BALL.baseSpeed;
  state.ballVy = serve.y * CONFIG.BALL.baseSpeed;

  state.roundOver = false;
  state.roundTimer = 0;
}

function reflectBallFromPaddle(state, paddleY, paddleX, isRight) {
  // add spin based on impact position
  const halfPaddle = CONFIG.PADDLE.h / 2;
  const rel = clamp((state.ballY - paddleY) / halfPaddle, -1, 1);

  // ensure ball goes to the opposite side
  const speed = clamp(Math.hypot(state.ballVx, state.ballVy) * 1.05, CONFIG.BALL.baseSpeed, CONFIG.BALL.maxSpeed);
  const dirX = isRight ? -1 : 1;

  state.ballVx = dirX * speed;
  state.ballVy = rel * speed * 0.75;

  // nudge out of paddle to avoid sticky collision
  state.ballX = paddleX + (isRight ? -1 : 1) * (CONFIG.PADDLE.w / 2 + CONFIG.BALL.r + 0.001);
}

function updateAi(dt, state) {
  // simple tracking AI with reaction
  const target = state.ballY;
  const error = target - state.leftY;

  if (Math.abs(error) < CONFIG.AI.deadZone) return;

  const desired = clamp(error / CONFIG.AI.reaction, -1, 1);
  state.leftY += desired * CONFIG.AI.speed * dt;

  const limit = CONFIG.FIELD.height / 2 - CONFIG.PADDLE.h / 2 - CONFIG.FIELD.wallPadding;
  state.leftY = clamp(state.leftY, -limit, limit);
}

function updatePlayer(state, playerY) {
  const limit = CONFIG.FIELD.height / 2 - CONFIG.PADDLE.h / 2 - CONFIG.FIELD.wallPadding;
  state.rightY = clamp(playerY, -limit, limit);
}

export function stepGame(dt, state, inputs) {
  // inputs: { playerY, onWall, onPaddle, onScore, onGameOver }
  if (state.gameOver) return;

  if (state.roundOver) {
    state.roundTimer += dt;
    if (state.roundTimer >= CONFIG.ROUND_PAUSE_SECONDS) resetRound(state);
    return;
  }

  updateAi(dt, state);
  updatePlayer(state, inputs.playerY);

  // move ball
  state.ballX += state.ballVx * dt;
  state.ballY += state.ballVy * dt;

  const top = CONFIG.FIELD.height / 2 - CONFIG.BALL.r;
  const bottom = -top;

  // wall bounce
  if (state.ballY > top) {
    state.ballY = top;
    state.ballVy *= -1;
    inputs.onWall?.();
  } else if (state.ballY < bottom) {
    state.ballY = bottom;
    state.ballVy *= -1;
    inputs.onWall?.();
  }

  const leftX = -CONFIG.PADDLE.xInset;
  const rightX = CONFIG.PADDLE.xInset;

  // paddle collision (simple AABB)
  const withinPaddleY = (pY) => Math.abs(state.ballY - pY) <= (CONFIG.PADDLE.h / 2 + CONFIG.BALL.r);
  const hitLeft = state.ballX < (leftX + CONFIG.PADDLE.w / 2 + CONFIG.BALL.r) &&
                  state.ballX > (leftX - CONFIG.PADDLE.w / 2 - CONFIG.BALL.r) &&
                  state.ballVx < 0 &&
                  withinPaddleY(state.leftY);

  if (hitLeft) {
    reflectBallFromPaddle(state, state.leftY, leftX, false);
    inputs.onPaddle?.();
  }

  const hitRight = state.ballX > (rightX - CONFIG.PADDLE.w / 2 - CONFIG.BALL.r) &&
                   state.ballX < (rightX + CONFIG.PADDLE.w / 2 + CONFIG.BALL.r) &&
                   state.ballVx > 0 &&
                   withinPaddleY(state.rightY);

  if (hitRight) {
    reflectBallFromPaddle(state, state.rightY, rightX, true);
    inputs.onPaddle?.();
  }

  // scoring
  const outLeft = state.ballX < -CONFIG.FIELD.width / 2 - 0.2;
  const outRight = state.ballX > CONFIG.FIELD.width / 2 + 0.2;

  if (outLeft) {
    state.playerScore += 1;
    inputs.onScore?.('player', state.aiScore, state.playerScore);
    return endRoundIfNeeded(state, inputs);
  }
  if (outRight) {
    state.aiScore += 1;
    inputs.onScore?.('ai', state.aiScore, state.playerScore);
    return endRoundIfNeeded(state, inputs);
  }
}

function endRoundIfNeeded(state, inputs) {
  state.roundOver = true;
  state.roundTimer = 0;

  if (state.aiScore >= CONFIG.WIN_SCORE || state.playerScore >= CONFIG.WIN_SCORE) {
    state.gameOver = true;
    inputs.onGameOver?.(state.aiScore, state.playerScore);
  }
}
