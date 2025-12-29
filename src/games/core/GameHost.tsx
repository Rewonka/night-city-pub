import React from "react";
import type { GameDefinition } from "./types";

/**
 * GameHost is intentionally dumb:
 * - selects and mounts the chosen game's Scene
 * - later we can add shared UI/overlays here
 */
export function GameHost(props: { game: GameDefinition }) {
  const Scene = props.game.Scene;
  return <Scene />;
}
