import type { PongConfig } from "./config";

/**
 * Keep game state as plain data (no Three.js types).
 * This makes gameplay logic easier to test and reason about.
 */

export type Vec2 = Readonly<{ x: number; y: number }>;
export type MutableVec2 = { x: number; y: number };

export type GamePhase = "notStarted" | "playing" | "roundOver" | "gameOver";

export type Score = Readonly<{
  left: number; // AI
  right: number; // Player
}>;

export type PaddleState = Readonly<{
  leftY: number;
  rightY: number;
}>;

export type BallState = Readonly<{
  position: Vec2;
  direction: Vec2; // should be normalized by physics step
  speed: number;
}>;

export type AiState = Readonly<{
  errorOffsetY: number;
  nextErrorChangeInSec: number;
}>;

export type RoundState = Readonly<{
  phase: GamePhase;
  roundOverTimerMs: number; // counts down when roundOver
}>;

export type GameState = Readonly<{
  score: Score;
  paddles: PaddleState;
  ball: BallState;
  ai: AiState;
  round: RoundState;
}>;

export function createInitialGameState(config: PongConfig): GameState {
  return {
    score: { left: 0, right: 0 },
    paddles: { leftY: 0, rightY: 0 },
    ball: createInitialBallState(config),
    ai: createInitialAiState(),
    round: { phase: "notStarted", roundOverTimerMs: 0 },
  };
}

export function createInitialBallState(config: PongConfig): BallState {
  return {
    position: { x: 0, y: 0 },
    direction: { ...config.ball.initialDirection },
    speed: config.ball.initialSpeed,
  };
}

export function createInitialAiState(): AiState {
  return {
    errorOffsetY: 0,
    nextErrorChangeInSec: 0,
  };
}

/**
 * Reset just the round-related things (ball + timers), but keep score.
 * Use this after a point is scored.
 */
export function resetRoundKeepingScore(
  state: GameState,
  config: PongConfig
): GameState {
  return {
    ...state,
    paddles: { ...state.paddles },
    ball: createInitialBallState(config),
    ai: createInitialAiState(),
    round: { phase: "roundOver", roundOverTimerMs: config.scoring.roundResetDelayMs },
  };
}

/**
 * Start a match: scores to 0, paddles center, ball initial.
 */
export function resetMatch(config: PongConfig): GameState {
  const initial = createInitialGameState(config);
  return {
    ...initial,
    round: { phase: "playing", roundOverTimerMs: 0 },
  };
}

/**
 * Utility: clamp paddle Y to field bounds (pure function).
 * (This is state-related helper; physics/step module can also reuse it.)
 */
export function clampPaddleYToField(
  desiredY: number,
  config: PongConfig
): number {
  const halfField = config.field.height / 2;
  const halfPaddle = config.paddle.height / 2;
  const maxY = halfField - halfPaddle;
  if (desiredY > maxY) return maxY;
  if (desiredY < -maxY) return -maxY;
  return desiredY;
}
