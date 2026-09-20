import { listLegalMoves } from "./card-game-rules";
import { STEAL_BUNDLE_RULES, type StealBundleRules } from "./rules";
import type { CardGameState, PlayMove } from "./types";

function pickRandom<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]!;
}

/**
 * Computer opponent — imperfect on purpose.
 * It often steals / matches when it sees them, but sometimes drops instead so
 * play feels like a person, not a perfect matcher.
 */
export function chooseAiMove(
  state: CardGameState,
  playerId: string,
  rng: () => number = Math.random,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): PlayMove | null {
  const moves = listLegalMoves(state, playerId, rules);
  if (moves.length === 0) return null;

  const steals = moves.filter((m) => m.type === "stealBundle");
  const matches = moves.filter((m) => m.type === "matchTable");
  const drops = moves.filter((m) => m.type === "dropToTable");

  if (steals.length > 0 && rng() < rules.aiStealNoticeRate) {
    // Prefer stealing the largest opposing bundle when it notices.
    const ranked = steals.slice().sort((a, b) => {
      if (a.type !== "stealBundle" || b.type !== "stealBundle") return 0;
      const sizeA = state.players.find((p) => p.id === a.targetPlayerId)?.bundle.length ?? 0;
      const sizeB = state.players.find((p) => p.id === b.targetPlayerId)?.bundle.length ?? 0;
      return sizeB - sizeA;
    });
    return ranked[0]!;
  }

  if (matches.length > 0 && rng() < rules.aiMatchNoticeRate) {
    return pickRandom(matches, rng);
  }

  // Missed (or had no) steal/match — place a card if the rules allow a drop.
  if (drops.length > 0) {
    return pickRandom(drops, rng);
  }

  // Every hand card is locked into a match/steal — must take one.
  if (steals.length > 0) return steals[0]!;
  if (matches.length > 0) return pickRandom(matches, rng);
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
