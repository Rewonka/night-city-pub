// src/config.js
// Central place for tweakable game constants (avoid magic numbers).

export const CONFIG = Object.freeze({
  // World / placement
  GAME_POSITION: { x: 0, y: 1.2, z: -3 },
  GAME_SCALE: 0.8,

  // TV frame
  TV_SIZE: { w: 2.2, h: 1.4, d: 0.12 },
  TV_FRAME_THICKNESS: 0.06,
  TV_GLASS_OPACITY: 0.25,

  // Pong field (inside TV)
  FIELD: {
    width: 2.0,
    height: 1.0,
    z: 0.08,          // in front of TV glass
    wallPadding: 0.02
  },

  // Paddle / ball
  PADDLE: { w: 0.06, h: 0.22, d: 0.06, xInset: 0.92 },
  BALL: { r: 0.035, baseSpeed: 1.35, maxSpeed: 2.65 },

  // Motion
  PADDLE_SPEED_DESKTOP: 1.45,
  AI: { speed: 1.1, reaction: 0.16, deadZone: 0.02 },

  // Scoring
  WIN_SCORE: 5,
  ROUND_PAUSE_SECONDS: 1.2,

  // HUD
  HUD: {
    scorePos: { x: 0, y: 0.62, z: 0.16 },
    msgPos: { x: 0, y: -0.52, z: 0.16 },
    scale: 0.8
  },

  // VR input mapping
  VR: {
    // If the player can't reach, change this scale.
    yScale: 1.2,
    // Controller buttons indices (common mapping on Quest):
    // 0 -> primary (A/X), 1 -> secondary (B/Y)
    buttonCalibrate: 0,
    buttonRestart: 1
  },

  // VFX
  TRAIL: { count: 18, spacing: 0.02, minScale: 0.1 },
});
