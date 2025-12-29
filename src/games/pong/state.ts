import type { PongConfig } from "./config";

export type Vec2 = Readonly<{ x: number; y: number }>;
export type GamePhase = "notStarted" | "playing" | "roundOver" | "gameOver";

export type PongState = Readonly<{
  score: { left: number; right: number };
  paddles: { leftY: number; rightY: number };
  ball: { pos: Vec2; dir: Vec2; speed: number };
  ai: { errorOffsetY: number; nextErrorChangeInSec: number };
  round: { phase: GamePhase; roundOverTimerMs: number };
}>;

export function createInitialBall(config: PongConfig): PongState["ball"] {
  return {
    pos: { x: 0, y: 0 },
    dir: { ...config.ball.initialDirection },
    speed: config.ball.initialSpeed,
  };
}

export function createInitialState(config: PongConfig): PongState {
  return {
    score: { left: 0, right: 0 },
    paddles: { leftY: 0, rightY: 0 },
    ball: createInitialBall(config),
    ai: { errorOffsetY: 0, nextErrorChangeInSec: 0 },
    round: { phase: "notStarted", roundOverTimerMs: 0 },
  };
}

export function resetMatch(config: PongConfig): PongState {
  const s = createInitialState(config);
  return { ...s, round: { phase: "playing", roundOverTimerMs: 0 } };
}

export function resetRoundKeepingScore(prev: PongState, config: PongConfig): PongState {
  return {
    ...prev,
    ball: createInitialBall(config),
    ai: { errorOffsetY: 0, nextErrorChangeInSec: 0 },
    round: { phase: "roundOver", roundOverTimerMs: config.scoring.roundResetDelayMs },
  };
}

export function clampPaddleY(y: number, config: PongConfig): number {
  const halfField = config.field.height / 2;
  const halfPaddle = config.paddle.height / 2;
  const maxY = halfField - halfPaddle;
  if (y > maxY) return maxY;
  if (y < -maxY) return -maxY;
  return y;
}
