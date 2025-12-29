import type { GameInputSnapshot } from "../core/types";
import type { PongConfig } from "./config";
import { clampPaddleY, resetRoundKeepingScore, resetMatch, type PongState } from "./state";

export type PongEvent =
  | { type: "sound"; name: "paddle" | "wall" | "score" | "gameOver" | "calibrate" }
  | { type: "message"; text: string; ms?: number };

export type StepResult = Readonly<{ state: PongState; events: PongEvent[] }>;

function len(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function normalize(x: number, y: number): { x: number; y: number } {
  const l = len(x, y) || 1;
  return { x: x / l, y: y / l };
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function stepPong(config: PongConfig, prev: PongState, input: GameInputSnapshot): StepResult {
  const events: PongEvent[] = [];

  // Restart if game over + action
  if (prev.round.phase === "gameOver" && input.restartPressed) {
    events.push({ type: "sound", name: "score" });
    events.push({ type: "message", text: "New match!", ms: 900 });
    return { state: resetMatch(config), events };
  }

  // If not started, auto-start on first input tick (or you can gate it later)
  let state = prev;
  if (state.round.phase === "notStarted") {
    state = resetMatch(config);
    events.push({ type: "message", text: "Play!", ms: 600 });
  }

  // Round over countdown
  if (state.round.phase === "roundOver") {
    const t = state.round.roundOverTimerMs - input.dt * 1000;
    if (t > 0) {
      return { state: { ...state, round: { ...state.round, roundOverTimerMs: t } }, events };
    }
    // resume
    state = { ...state, round: { phase: "playing", roundOverTimerMs: 0 } };
  }

  if (state.round.phase !== "playing") {
    return { state, events };
  }

  // --- Player (right paddle) input ---
  const moveY = input.moveY ?? 0;
  const desiredRightY = state.paddles.rightY + moveY * config.paddle.speed * input.dt;
  const rightY = clampPaddleY(desiredRightY, config);

  // --- AI (left paddle) ---
  let ai = state.ai;
  let nextAiChange = ai.nextErrorChangeInSec - input.dt;
  let errorOffset = ai.errorOffsetY;

  if (nextAiChange <= 0) {
    errorOffset = randBetween(-config.ai.errorOffsetMax, config.ai.errorOffsetMax);
    nextAiChange = randBetween(config.ai.errorChangeInterval.minSec, config.ai.errorChangeInterval.maxSec);
  }

  const targetLeftY = state.ball.pos.y + errorOffset;
  const delta = targetLeftY - state.paddles.leftY;
  const maxStep = config.ai.followSpeed * input.dt;
  const leftY = clampPaddleY(state.paddles.leftY + clamp(delta, -maxStep, maxStep), config);

  // --- Ball physics ---
  let ball = state.ball;

  // ensure direction normalized
  const nd = normalize(ball.dir.x, ball.dir.y);
  let vx = nd.x * ball.speed;
  let vy = nd.y * ball.speed;

  let bx = ball.pos.x + vx * input.dt;
  let by = ball.pos.y + vy * input.dt;

  const halfW = config.field.width / 2;
  const halfH = config.field.height / 2;

  // Wall bounce (top/bottom)
  if (by > halfH) {
    by = halfH;
    vy *= -1;
    events.push({ type: "sound", name: "wall" });
  } else if (by < -halfH) {
    by = -halfH;
    vy *= -1;
    events.push({ type: "sound", name: "wall" });
  }

  // Paddle collision (simple, like legacy)
  const paddleHalfH = config.paddle.height / 2;

  const leftPaddleX = -halfW + config.paddle.xOffsetFromWall;
  const rightPaddleX = halfW - config.paddle.xOffsetFromWall;

  const hitLeft =
    bx < leftPaddleX + 0.05 &&
    bx > leftPaddleX - 0.05 &&
    by < leftY + paddleHalfH &&
    by > leftY - paddleHalfH;

  const hitRight =
    bx > rightPaddleX - 0.05 &&
    bx < rightPaddleX + 0.05 &&
    by < rightY + paddleHalfH &&
    by > rightY - paddleHalfH;

  if (hitLeft) {
    bx = leftPaddleX + 0.06;
    vx = Math.abs(vx);
    // add spin based on offset
    const offset = (by - leftY) / paddleHalfH;
    vy += offset * 0.6;
    events.push({ type: "sound", name: "paddle" });
  } else if (hitRight) {
    bx = rightPaddleX - 0.06;
    vx = -Math.abs(vx);
    const offset = (by - rightY) / paddleHalfH;
    vy += offset * 0.6;
    events.push({ type: "sound", name: "paddle" });
  }

  // Scoring
  if (bx < -halfW - 0.2) {
    // player scores
    const scored = { ...state, paddles: { leftY, rightY } };
    const newState = {
      ...resetRoundKeepingScore(scored, config),
      score: { left: state.score.left, right: state.score.right + 1 },
    };
    events.push({ type: "sound", name: "score" });
    events.push({ type: "message", text: "Player scores!" });

    if (newState.score.right >= config.scoring.winScore) {
      const over = { ...newState, round: { phase: "gameOver", roundOverTimerMs: 0 } };
      events.push({ type: "sound", name: "gameOver" });
      events.push({ type: "message", text: "PLAYER WINS — Press Restart", ms: 5000 });
      return { state: over, events };
    }
    return { state: newState, events };
  }

  if (bx > halfW + 0.2) {
    // AI scores
    const scored = { ...state, paddles: { leftY, rightY } };
    const newState = {
      ...resetRoundKeepingScore(scored, config),
      score: { left: state.score.left + 1, right: state.score.right },
    };
    events.push({ type: "sound", name: "score" });
    events.push({ type: "message", text: "AI scores!" });

    if (newState.score.left >= config.scoring.winScore) {
      const over = { ...newState, round: { phase: "gameOver", roundOverTimerMs: 0 } };
      events.push({ type: "sound", name: "gameOver" });
      events.push({ type: "message", text: "AI WINS — Press Restart", ms: 5000 });
      return { state: over, events };
    }
    return { state: newState, events };
  }

  // Update ball speed cap
  let speed = len(vx, vy);
  speed = Math.min(speed, config.ball.maxSpeed);
  const dir = normalize(vx, vy);

  ball = {
    pos: { x: bx, y: by },
    dir,
    speed,
  };

  return {
    state: {
      ...state,
      paddles: { leftY, rightY },
      ball,
      ai: { errorOffsetY: errorOffset, nextErrorChangeInSec: nextAiChange },
    },
    events,
  };
}
