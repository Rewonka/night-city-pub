import type React from "react";

export type GameId = string;

export type GameInputSnapshot = Readonly<{
  dt: number; // seconds
  isXR: boolean;

  /**
   * Normalized vertical movement input:
   * -1..+1, where +1 means "up".
   * null/undefined = no input.
   */
  moveY?: number | null;

  /**
   * Discrete actions (edge-detected).
   */
  calibratePressed?: boolean;
  restartPressed?: boolean;
}>;

export type GameDefinition = Readonly<{
  id: GameId;
  title: string;
  description?: string;

  /**
   * React scene for the game (R3F/XR hooks live here).
   */
  Scene: React.FC;
}>;
