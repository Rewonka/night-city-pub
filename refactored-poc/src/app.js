// src/app.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { CONFIG } from './config.js';
import { createSceneAndRenderer } from './scene.js';
import { createBackgroundGroup, updateBackground } from './background.js';
import { createGameGroup, createTvFrame, createPaddles, createBall, createBallTrail, tickBallTrail } from './objects.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';
import { createDesktopInput } from './input-desktop.js';
import { setupXrControllers } from './xr.js';
import { createGameState, stepGame, resetRound } from './game.js';

export function startApp() {
  const { scene, camera, renderer } = createSceneAndRenderer();

  // Background
  const backgroundGroup = createBackgroundGroup();
  scene.add(backgroundGroup);

  // Game group
  const gameGroup = createGameGroup();
  scene.add(gameGroup);

  const tv = createTvFrame();
  gameGroup.add(tv);

  const { left: leftPaddle, right: rightPaddle } = createPaddles();
  const ball = createBall();
  const trail = createBallTrail();

  gameGroup.add(leftPaddle, rightPaddle, ball, trail);

  // HUD
  const hud = createHud();
  gameGroup.add(hud.scoreSprite, hud.msgSprite);

  // Audio
  const audio = createAudio();
  window.addEventListener('pointerdown', audio.unlock, { passive: true });
  window.addEventListener('keydown', audio.unlock);

  // Inputs
  const desktop = createDesktopInput();
  const xr = setupXrControllers(renderer, scene);

  // Game state
  const state = createGameState();
  hud.setScore(state.aiScore, state.playerScore);

  // view direction (desktop)
  camera.lookAt(new THREE.Vector3(0, 1.25, -3));

  // VR state
  let isVR = false;

  renderer.xr.addEventListener?.('sessionstart', () => { isVR = true; });
  renderer.xr.addEventListener?.('sessionend', () => { isVR = false; });

  const clock = new THREE.Clock();

  function computePlayerY(dt) {
    if (isVR) {
      const c = xr.getRightController();
      if (!c) return state.rightY;

      const worldPos = new THREE.Vector3();
      c.getWorldPosition(worldPos);

      const local = gameGroup.worldToLocal(worldPos.clone());
      const y = local.y * CONFIG.VR.yScale + xr.getVrCenterOffset();
      return y;
    }

    // desktop axis -> integrate
    const axis = desktop.getAxis();
    const next = state.rightY + axis * CONFIG.PADDLE_SPEED_DESKTOP * dt;
    return next;
  }

  function restartGame() {
    state.aiScore = 0;
    state.playerScore = 0;
    state.gameOver = false;
    state.roundOver = false;
    state.roundTimer = 0;
    state.leftY = 0;
    state.rightY = 0;
    resetRound(state);
    hud.setScore(state.aiScore, state.playerScore);
    hud.setMessage('Restart!', 900);
  }

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.033);
    const t = clock.elapsedTime;

    // subtle tv float
    gameGroup.rotation.y = 0.06 * Math.sin(t * 0.6);
    gameGroup.position.y = CONFIG.GAME_POSITION.y + 0.02 * Math.sin(t * 0.9);

    updateBackground(backgroundGroup, t);

    // XR actions (calibrate/restart)
    if (isVR) {
      const actions = xr.getActions(gameGroup);
      if (actions.wantsCalibrate) {
        audio.beep.calibrate();
        hud.setMessage('Calibrated', 900);
      }
      if (actions.wantsRestart && state.gameOver) {
        restartGame();
      }
    }

    // Step game
    const playerY = computePlayerY(dt);

    stepGame(dt, state, {
      playerY,
      onWall: () => audio.beep.wall(),
      onPaddle: () => audio.beep.paddle(),
      onScore: (who, ai, player) => {
        audio.beep.score();
        hud.setScore(ai, player);
        hud.setMessage(who === 'player' ? 'Point: Player!' : 'Point: AI!', 900);
      },
      onGameOver: (ai, player) => {
        audio.beep.gameOver();
        const msg = ai > player ? 'GAME OVER • AI Wins' : 'GAME OVER • Player Wins';
        hud.setMessage(msg + ' • Press B/Y to Restart', 2500);
      }
    });

    // sync meshes from state
    leftPaddle.position.y = state.leftY;
    rightPaddle.position.y = state.rightY;
    ball.position.x = state.ballX;
    ball.position.y = state.ballY;

    // ball pulse
    const pulse = 1 + 0.1 * Math.sin(t * 8);
    ball.scale.setScalar(pulse);

    tickBallTrail(trail, ball);
    hud.tick(dt);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}
