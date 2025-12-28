/**
 * Game configuration (single source of truth).
 * Keep all tweakable numbers here to avoid magic values in gameplay code.
 */

export type PongConfig = Readonly<{
  field: {
    width: number;
    height: number;
    wallInset: number; // safety margin used by collisions (optional)
  };

  paddle: {
    width: number;
    height: number;
    speed: number; // units/sec
    xOffsetFromWall: number; // how far paddles are from the side walls (toward center)
    z: number;
  };

  ball: {
    z: number;
    initialSpeed: number; // units/sec
    initialDirection: { x: number; y: number }; // normalized later in physics step
    speedIncreaseOnHit: number; // optional (0 = disabled)
    maxSpeed: number; // safety cap
    radius: number; // for better collision later
  };

  scoring: {
    winScore: number;
    roundResetDelayMs: number;
  };

  ai: {
    followSpeed: number; // units/sec
    errorOffsetMax: number; // max random offset in Y
    errorChangeInterval: { minSec: number; maxSec: number };
  };

  xr: {
    vrYScale: number;
  };

  trail: {
    segments: number;
  };

  hud: {
    scoreLineHeightPx: number;
    messageLineHeightPx: number;
    messageDefaultDurationMs: number;
  };
}>;

/**
 * Default config mirrors the current behavior in your existing PongGame.tsx:
 * - FIELD_WIDTH=3.6, FIELD_HEIGHT=2.1
 * - PADDLE_SPEED=2.5, PADDLE_HEIGHT=0.5
 * - AI follow/error values
 * - VR_Y_SCALE=2.0
 * - WIN_SCORE=5
 * - TRAIL_SEGMENTS=18
 * - ballSpeedRef initial = 2.0, ballVelocityRef initial = (1, 0.5)
 */
export const DEFAULT_PONG_CONFIG: PongConfig = Object.freeze({
  field: {
    width: 3.6,
    height: 2.1,
    wallInset: 0.0,
  },

  paddle: {
    width: 0.1,
    height: 0.5,
    speed: 2.5,
    xOffsetFromWall: 0.2,
    z: 0.06,
  },

  ball: {
    z: 0.07,
    initialSpeed: 2.0,
    initialDirection: { x: 1, y: 0.5 },
    speedIncreaseOnHit: 0.0,
    maxSpeed: 10.0,
    radius: 0.06,
  },

  scoring: {
    winScore: 5,
    roundResetDelayMs: 1200,
  },

  ai: {
    followSpeed: 3.0,
    errorOffsetMax: 0.25,
    errorChangeInterval: { minSec: 0.6, maxSec: 1.4 },
  },

  xr: {
    vrYScale: 2.0,
  },

  trail: {
    segments: 18,
  },

  hud: {
    scoreLineHeightPx: 64,
    messageLineHeightPx: 52,
    messageDefaultDurationMs: 1400,
  },
});
