import type { Rank } from "./types";

/**
 * Central configuration for Steal the Old Man's Bundle.
 * Ambiguous handwritten rules live here so they can be rebalanced without
 * touching the rest of the engine.
 */
export const STEAL_BUNDLE_RULES = {
  initialTableCards: 5,
  startingHandSize: 5,
  matchByRank: true,
  allowBundleStealing: true,
  /** Rank sequence for "A to the letter K" place-down ordering guidance. */
  rankOrder: [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ] as const satisfies readonly Rank[],
  /** Delay before AI acts after a human move (brief beat to read the table). */
  aiThinkMs: 520,
  /** Extra delay after AI commits a move before the next actor. */
  aiResolveMs: 280,
  /** Faster timing when several AI players act in a row. */
  aiChainThinkMs: 160,
  aiChainResolveMs: 120,
  /**
   * How often the computer “notices” a legal steal (0–1).
   * Below 1 so it sometimes overlooks an exposed bundle like a person would.
   */
  aiStealNoticeRate: 0.72,
  /**
   * How often the computer takes a table match when one exists (0–1).
   * Lower than steals — casual players miss rank matches more often.
   */
  aiMatchNoticeRate: 0.55,
  minPlayers: 2,
  maxPlayers: 3,
} as const;

export type StealBundleRules = typeof STEAL_BUNDLE_RULES;

export function rankIndex(rank: Rank, rules: StealBundleRules = STEAL_BUNDLE_RULES): number {
  return rules.rankOrder.indexOf(rank);
}

export function ranksMatch(
  a: Rank,
  b: Rank,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): boolean {
  if (!rules.matchByRank) return a === b;
  return a === b;
}

/** Isolated steal predicate — change freely without rewriting play loop. */
export function canStealBundle(
  playedRank: Rank,
  targetBundleMatchRank: Rank | null,
  targetBundleSize: number,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): boolean {
  if (!rules.allowBundleStealing) return false;
  if (targetBundleSize <= 0 || targetBundleMatchRank == null) return false;
  return ranksMatch(playedRank, targetBundleMatchRank, rules);
}
