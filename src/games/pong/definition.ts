import type { GameDefinition } from "../core/types";
import { PongScene } from "./scene/PongScene";

export const pongDefinition: GameDefinition = {
  id: "pong",
  title: "Cyberpunk Pong",
  description: "Neon Pong board inside Night City Pub",
  Scene: PongScene,
};
