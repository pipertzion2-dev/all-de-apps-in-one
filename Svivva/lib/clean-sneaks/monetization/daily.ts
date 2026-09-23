import { DAILY_REWARD_CONFIG } from "./config";
import { makeClaimId, claimBaseReward, buildRewardedOffer } from "./rewards";
import type { RewardLine, RewardedOffer } from "./types";
import { readWallet, utcDayKey, writeWallet } from "./wallet";

export function previewDailyReward(now = Date.now()): {
  available: boolean;
  dayIndex: number;
  lines: RewardLine[];
  streakAfter: number;
  reason?: string;
} {
  const wallet = readWallet();
  const day = utcDayKey(now);
  if (wallet.daily.lastClaimDay === day) {
    return {
      available: false,
      dayIndex: 0,
      lines: [],
      streakAfter: wallet.daily.streak,
      reason: "Already claimed today.",
    };
  }
  const yesterday = utcDayKey(now - 24 * 60 * 60_000);
  const streak =
    wallet.daily.lastClaimDay === yesterday
      ? Math.min(DAILY_REWARD_CONFIG.streakLength, wallet.daily.streak + 1)
      : 1;
  const dayIndex = (streak - 1) % DAILY_REWARD_CONFIG.streakLength;
  const credits = DAILY_REWARD_CONFIG.creditsByDay[dayIndex] ?? 50;
  const lines: RewardLine[] = [{ kind: "credits", amount: credits }];
  if (dayIndex === DAILY_REWARD_CONFIG.streakLength - 1) {
    lines.push({ kind: "laces", amount: DAILY_REWARD_CONFIG.lacesOnFinale });
    lines.push({ kind: "cosmetic", itemId: DAILY_REWARD_CONFIG.finaleCosmeticId });
  }
  return { available: true, dayIndex, lines, streakAfter: streak };
}

export function claimDailyReward(now = Date.now()) {
  const preview = previewDailyReward(now);
  if (!preview.available) {
    return { ok: false as const, reason: preview.reason || "Unavailable." };
  }
  const day = utcDayKey(now);
  const claimId = makeClaimId(["daily", day]);
  const result = claimBaseReward({
    claimId,
    source: "daily",
    lines: preview.lines,
  });
  if (!result.ok) return result;
  if (!result.duplicate) {
    writeWallet({
      ...result.wallet,
      daily: {
        ...result.wallet.daily,
        lastClaimDay: day,
        streak: preview.streakAfter,
      },
    });
    result.wallet = readWallet();
  }
  return result;
}

export function dailyAdBonusOffer(now = Date.now()): RewardedOffer | null {
  const wallet = readWallet();
  const day = utcDayKey(now);
  if (wallet.daily.lastClaimDay !== day) return null;
  if (wallet.daily.adBonusClaimedDay === day) return null;
  return buildRewardedOffer({
    context: "daily_bonus",
    baseCredits: 0,
    walkId: `daily-${day}`,
    now,
  });
}

export function markDailyAdBonusClaimed(now = Date.now()) {
  const wallet = readWallet();
  writeWallet({
    ...wallet,
    daily: { ...wallet.daily, adBonusClaimedDay: utcDayKey(now) },
  });
}
