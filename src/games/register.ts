import { registerGame } from "./core/registry";
import { pongDefinition } from "./pong/definition";

export function registerAllGames(): void {
  registerGame(pongDefinition);
}
