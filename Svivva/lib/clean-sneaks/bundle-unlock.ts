import { FINISH_DISTANCE } from "./run-engine";

/** Minimum score on a destination run before the card game can unlock. */
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

/** Card game unlocks after a full chase (destination) with a new personal best. */
export function evaluateBundleUnlock({
  score,
  distance,
  previousBest,
}: BundleUnlockAttempt): BundleUnlockResult {
  const floored = Math.max(0, Math.floor(score));
  const reachedDestination = distance >= FINISH_DISTANCE;
  const newHighScore = floored > previousBest;
  const meetsMin = floored >= BUNDLE_CARD_MIN_SCORE;

  if (!reachedDestination) {
    return {
      unlocked: false,
      newlyUnlocked: false,
      reason: `Reach ${FINISH_DISTANCE}m to catch the bundle.`,
    };
  }
  if (!meetsMin) {
    return {
      unlocked: false,
      newlyUnlocked: false,
      reason: `Score ${BUNDLE_CARD_MIN_SCORE}+ on a clean chase to unlock the card game.`,
    };
  }
  if (!newHighScore) {
    return {
      unlocked: false,
      newlyUnlocked: false,
      reason: "Beat your highest score on a destination run to unlock Steal the Bundle.",
    };
  }

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
  if (isBundleCardUnlocked()) return "Steal the Bundle card game unlocked.";
  if (bestScore < BUNDLE_CARD_MIN_SCORE) {
    return `Chase ${FINISH_DISTANCE}m · score ${BUNDLE_CARD_MIN_SCORE}+ · beat your best to unlock the card game.`;
  }
  return `Beat ${bestScore.toLocaleString()} on a ${FINISH_DISTANCE}m run to unlock Steal the Bundle.`;
}
