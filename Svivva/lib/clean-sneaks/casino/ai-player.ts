import { listLegalMoves } from "./card-game-rules";
import { STEAL_BUNDLE_RULES } from "./rules";
import type { CardGameState, PlayMove } from "./types";

/**
 * Computer opponent — prefers steals, then table matches, else a legal drop.
 * Architecture is isolated so a future network player can supply moves instead.
 */
export function chooseAiMove(
  state: CardGameState,
  playerId: string,
  rng: () => number = Math.random,
): PlayMove | null {
  const moves = listLegalMoves(state, playerId, STEAL_BUNDLE_RULES);
  if (moves.length === 0) return null;

  const steals = moves.filter((m) => m.type === "stealBundle");
  if (steals.length > 0) {
    // Prefer stealing the largest opposing bundle.
    const ranked = steals.slice().sort((a, b) => {
      if (a.type !== "stealBundle" || b.type !== "stealBundle") return 0;
      const sizeA = state.players.find((p) => p.id === a.targetPlayerId)?.bundle.length ?? 0;
      const sizeB = state.players.find((p) => p.id === b.targetPlayerId)?.bundle.length ?? 0;
      return sizeB - sizeA;
    });
    return ranked[0]!;
  }

  const matches = moves.filter((m) => m.type === "matchTable");
  if (matches.length > 0) {
    return matches[Math.floor(rng() * matches.length)]!;
  }

  const drops = moves.filter((m) => m.type === "dropToTable");
  if (drops.length > 0) {
    return drops[Math.floor(rng() * drops.length)]!;
  }

  return moves[0] ?? null;
}

export function aiDelayMs(
  chain = false,
  rules: typeof STEAL_BUNDLE_RULES = STEAL_BUNDLE_RULES,
): number {
  return chain ? rules.aiChainThinkMs : rules.aiThinkMs;
}

export function aiResolveDelayMs(
  chain = false,
  rules: typeof STEAL_BUNDLE_RULES = STEAL_BUNDLE_RULES,
): number {
  return chain ? rules.aiChainResolveMs : rules.aiResolveMs;
}
