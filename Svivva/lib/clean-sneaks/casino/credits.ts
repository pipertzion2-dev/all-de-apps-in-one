/** Walking score → casino credits (chips). You only spend what you've earned. */

export const CREDITS_MIN_ANTE = 50;
export const CREDITS_ANTE_RATIO = 0.12;
export const CREDITS_WIN_MULTIPLIER = 1.75;

export function scoreToCredits(score: number): number {
  return Math.max(0, Math.floor(score));
}

/** Table buy-in sized to the player's earned stack — never more than they have. */
export function computeAnte(credits: number): number {
  if (credits < CREDITS_MIN_ANTE) return 0;
  const scaled = Math.floor(credits * CREDITS_ANTE_RATIO);
  return Math.min(credits, Math.max(CREDITS_MIN_ANTE, scaled));
}

export function canAffordTable(credits: number): boolean {
  return computeAnte(credits) >= CREDITS_MIN_ANTE;
}

export function payoutWin(ante: number): number {
  return Math.max(0, Math.floor(ante * CREDITS_WIN_MULTIPLIER));
}

export function describeCreditsGate(credits: number): string {
  if (credits <= 0) {
    return "Earn walking credits first — keep the kicks clean to stack score.";
  }
  if (!canAffordTable(credits)) {
    return `Need ${CREDITS_MIN_ANTE} credits to sit at Steal the Bundle (you have ${credits}).`;
  }
  const ante = computeAnte(credits);
  return `${credits.toLocaleString()} credits · table ante ${ante.toLocaleString()}`;
}
