import { FINISH_DISTANCE } from "./run-engine";

/** Soft guidance score — casino admission uses any finishing score. */
export const BUNDLE_CARD_MIN_SCORE = 800;

export const BUNDLE_CARD_UNLOCK_KEY = "zzai.clean-sneaks.bundleCardUnlocked";
export const BUNDLE_CARD_WINS_KEY = "zzai.clean-sneaks.bundleCardWins";

export type BundleUnlockAttempt = {
  score: number;
  distance: number;
  previousBest: number;
};

export type BundleUnlockResult = {
  unlocked: boolean;
  newlyUnlocked: boolean;
  reason?: string;
};

/**
 * Casino + Steal the Bundle unlock when the player reaches the destination.
 * The walking score becomes casino admission — no high-score gate.
 */
export function evaluateBundleUnlock({ score, distance }: BundleUnlockAttempt): BundleUnlockResult {
  const floored = Math.max(0, Math.floor(score));
  const reachedDestination = distance >= FINISH_DISTANCE;

  if (!reachedDestination) {
    return {
      unlocked: false,
      newlyUnlocked: false,
      reason: `Reach ${FINISH_DISTANCE}m to turn in your score at the casino.`,
    };
  }

  void floored;
  return { unlocked: true, newlyUnlocked: true };
}

export function isBundleCardUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(BUNDLE_CARD_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBundleCardUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUNDLE_CARD_UNLOCK_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function readBundleCardWins(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(window.localStorage.getItem(BUNDLE_CARD_WINS_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function writeBundleCardWin(): number {
  const next = readBundleCardWins() + 1;
  try {
    window.localStorage.setItem(BUNDLE_CARD_WINS_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

/** Progress hint for homepage / HUD — how close the player is to unlocking. */
export function bundleUnlockHint(bestScore: number): string {
  if (isBundleCardUnlocked()) {
    return "Casino unlocked — turn in your score to play Steal the Bundle.";
  }
  void bestScore;
  return `Reach ${FINISH_DISTANCE}m to unlock the casino and Steal the Old Man's Bundle.`;
}
