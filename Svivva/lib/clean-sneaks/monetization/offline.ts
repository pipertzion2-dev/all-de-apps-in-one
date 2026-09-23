import { OFFLINE_REWARD_CONFIG } from "./config";
import { buildRewardedOffer, claimBaseReward, makeClaimId } from "./rewards";
import type { RewardedOffer } from "./types";
import { activeMultiplier, readWallet, writeWallet } from "./wallet";

export function computeOfflineEarnings(now = Date.now()): {
  eligible: boolean;
  credits: number;
  hours: number;
  awayMs: number;
} {
  const wallet = readWallet();
  const awayMs = Math.max(0, now - (wallet.offline.lastSeenAt || now));
  if (awayMs < OFFLINE_REWARD_CONFIG.minAwayMs) {
    return { eligible: false, credits: 0, hours: 0, awayMs };
  }
  const hours = Math.min(OFFLINE_REWARD_CONFIG.maxHours, awayMs / (60 * 60_000));
  const mul = activeMultiplier(wallet, "offline_grind", now);
  const credits = Math.floor(hours * OFFLINE_REWARD_CONFIG.creditsPerHour * mul);
  return { eligible: credits > 0, credits, hours, awayMs };
}

export function claimOfflineEarnings(now = Date.now()) {
  const calc = computeOfflineEarnings(now);
  if (!calc.eligible) {
    return { ok: false as const, reason: "Nothing waiting on the corner." };
  }
  const hourBucket = Math.floor(now / (60 * 60_000));
  const claimId = makeClaimId(["offline", hourBucket, calc.credits]);
  const result = claimBaseReward({
    claimId,
    source: "offline",
    lines: [{ kind: "credits", amount: calc.credits }],
  });
  if (result.ok && !result.duplicate) {
    writeWallet({ ...result.wallet, offline: { lastSeenAt: now } });
    result.wallet = readWallet();
  }
  return { ...result, calc };
}

export function offlineAdOffer(now = Date.now()): RewardedOffer | null {
  const calc = computeOfflineEarnings(now);
  if (!calc.eligible) return null;
  return buildRewardedOffer({
    context: "offline_boost",
    baseCredits: calc.credits,
    walkId: `offline-${Math.floor(now / 60000)}`,
    now,
  });
}

export function touchLastSeen(now = Date.now()) {
  const wallet = readWallet();
  writeWallet({ ...wallet, offline: { lastSeenAt: now } });
}
