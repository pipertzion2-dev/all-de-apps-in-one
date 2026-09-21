import { FINISH_DISTANCE } from "./run-engine";
import { CREDITS_MIN_ANTE } from "./casino/credits";

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

/** Unlock casino entry when the runner reaches the finish. */
export function evaluateBundleUnlock({ distance }: BundleUnlockAttempt): BundleUnlockResult {
  if (distance < FINISH_DISTANCE) {
    return {
      unlocked: false,
      newlyUnlocked: false,
      reason: `Reach ${FINISH_DISTANCE}m to turn in your score at the casino.`,
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

export function bundleUnlockHint(_bestScore: number): string {
  if (isBundleCardUnlocked()) {
    return "Casino unlocked — cash out credits, turn in your ticket, then Steal the Bundle.";
  }
  return `Walk ${FINISH_DISTANCE}m (or cash out with ${CREDITS_MIN_ANTE}+ credits), then turn in your ticket.`;
}
