export type PongConfig = Readonly<{
  field: {
    width: number;
    height: number;
  };

  paddle: {
    width: number;
    height: number;
    speed: number; // units/sec
    xOffsetFromWall: number;
  };

  ball: {
    radius: number;
    initialSpeed: number;
    initialDirection: { x: number; y: number };
    speedIncreaseOnHit: number;
    maxSpeed: number;
  };

  scoring: {
    winScore: number;
    roundResetDelayMs: number;
  };

  ai: {
    followSpeed: number; // units/sec
    errorOffsetMax: number;
    errorChangeInterval: { minSec: number; maxSec: number };
  };

  /**
   * Where the whole pong board lives inside the pub.
   * You can tweak these later once you decide the exact location.
   */
  placement: {
    position: [number, number, number];
    rotationY: number; // radians
    scale: number;
  };

  xr: {
    vrYScale: number;
  };

  trail: {
    segments: number;
  };

  hud: {
    messageDefaultDurationMs: number;
  };
}>;

export const DEFAULT_PONG_CONFIG: PongConfig = Object.freeze({
  field: { width: 3.6, height: 2.1 },

  paddle: {
    width: 0.1,
    height: 0.5,
    speed: 2.5,
    xOffsetFromWall: 0.2,
  },

  ball: {
    radius: 0.06,
    initialSpeed: 2.0,
    initialDirection: { x: 1, y: 0.5 },
    speedIncreaseOnHit: 0.0,
    maxSpeed: 10.0,
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

  // Default: player in pubban áll, tábla kb. előtte — később átállítod fix helyre
  placement: {
    position: [0, 1.2, -3],
    rotationY: 0,
    scale: 0.8,
  },

  xr: { vrYScale: 2.0 },

  trail: { segments: 18 },

  hud: { messageDefaultDurationMs: 1400 },
});
