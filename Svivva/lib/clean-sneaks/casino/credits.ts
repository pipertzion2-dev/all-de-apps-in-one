/** Walking score → casino credits (chips). You only spend what you've earned. */

import { resolveUpgradeEffects } from "./upgrades";

export const CREDITS_MIN_ANTE = 50;
export const CREDITS_ANTE_RATIO = 0.12;
export const CREDITS_WIN_MULTIPLIER = 1.75;

export function scoreToCredits(score: number): number {
  return Math.max(0, Math.floor(score));
}

/** Table buy-in sized to the player's earned stack — never more than they have. */
export function computeAnte(credits: number, unlockedUpgrades: readonly string[] = []): number {
  const fx = resolveUpgradeEffects(unlockedUpgrades);
  if (credits < fx.minAnte) return 0;
  const scaled = Math.floor(credits * fx.anteRatio);
  return Math.min(credits, Math.max(fx.minAnte, scaled));
}

export function canAffordTable(credits: number, unlockedUpgrades: readonly string[] = []): boolean {
  const fx = resolveUpgradeEffects(unlockedUpgrades);
  return computeAnte(credits, unlockedUpgrades) >= fx.minAnte;
}

export function payoutWin(ante: number, unlockedUpgrades: readonly string[] = []): number {
  const fx = resolveUpgradeEffects(unlockedUpgrades);
  return Math.max(0, Math.floor(ante * fx.winMultiplier));
}

export function describeCreditsGate(
  credits: number,
  unlockedUpgrades: readonly string[] = [],
): string {
  const fx = resolveUpgradeEffects(unlockedUpgrades);
  if (credits <= 0) {
    return "Earn walking credits first — keep the kicks clean to stack score.";
  }
  if (!canAffordTable(credits, unlockedUpgrades)) {
    return `Need ${fx.minAnte} credits to sit at Steal the Bundle (you have ${credits}).`;
  }
  const ante = computeAnte(credits, unlockedUpgrades);
  return `${credits.toLocaleString()} credits · table ante ${ante.toLocaleString()}`;
}
