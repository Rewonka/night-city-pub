import type { GameDefinition, GameId } from "./types";

const registry = new Map<GameId, GameDefinition>();

export function registerGame(def: GameDefinition): void {
  if (registry.has(def.id)) throw new Error(`Game already registered: ${def.id}`);
  registry.set(def.id, def);
}

export function getGame(id: GameId): GameDefinition {
  const g = registry.get(id);
  if (!g) throw new Error(`Unknown game id: ${id}`);
  return g;
}

export function listGames(): GameDefinition[] {
  return Array.from(registry.values());
}
