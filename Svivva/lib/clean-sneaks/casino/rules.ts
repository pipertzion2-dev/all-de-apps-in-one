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
  /** Delay before AI acts so humans can follow the play. */
  aiThinkMs: 900,
  /** Extra delay after AI commits a move for animations. */
  aiResolveMs: 650,
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
