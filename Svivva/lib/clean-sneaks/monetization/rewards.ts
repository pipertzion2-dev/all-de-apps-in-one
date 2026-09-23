/**
 * Idempotent reward helpers + claim id factories.
 * Client is untrusted — pair with /api/clean-sneaks/monetization/claim for server attest.
 */

import { AD_REWARD_CONFIG, OLD_MAN_BUNDLE, PASS_CONFIG } from "./config";
import type { ClaimSource, RewardLine, RewardedOffer, RewardedOfferContext } from "./types";
import {
  canCompleteRewardedAd,
  commitClaim,
  markAdCompletion,
  readWallet,
  writeWallet,
  type ClaimResult,
} from "./wallet";

export function makeClaimId(parts: Array<string | number>): string {
  return parts
    .map((p) =>
      String(p)
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 48),
    )
    .filter(Boolean)
    .join(":")
    .slice(0, 180);
}

export function describeLines(lines: RewardLine[]): string {
  return lines
    .map((l) => {
      if (l.kind === "credits") return `${l.amount ?? 0} Credits`;
      if (l.kind === "laces") return `${l.amount ?? 0} Laces`;
      if (l.kind === "cosmetic") return `Cosmetic: ${l.itemId}`;
      if (l.kind === "boost") return `Boost: ${l.boostId || l.itemId}`;
      if (l.kind === "outfit") return `Outfit: ${l.itemId}`;
      if (l.kind === "badge") return `Badge: ${l.itemId}`;
      if (l.kind === "title") return `Title: ${l.itemId}`;
      if (l.kind === "collectible") return `Collectible: ${l.itemId}`;
      if (l.kind === "bundle_ownership") return `Owns: ${l.itemId}`;
      if (l.kind === "pass_xp") return `+${l.amount ?? 0} Pass XP`;
      return l.kind;
    })
    .join(" · ");
}

function offerToken(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `tok_${(h >>> 0).toString(36)}`;
}

export function buildRewardedOffer(input: {
  context: RewardedOfferContext;
  baseCredits: number;
  walkId?: string;
  now?: number;
}): RewardedOffer | null {
  const now = input.now ?? Date.now();
  const wallet = readWallet();
  const gate = canCompleteRewardedAd(wallet, now);
  if (!gate.ok) return null;

  const base = Math.max(0, Math.floor(input.baseCredits));
  const walkId = input.walkId || `w${now}`;
  const offerId = makeClaimId(["offer", input.context, walkId, utcStamp(now)]);

  if (input.context === "mission_complete") {
    if (
      AD_REWARD_CONFIG.missionOfferEveryNWalks > 1 &&
      wallet.walksCompleted % AD_REWARD_CONFIG.missionOfferEveryNWalks !== 0
    ) {
      return null;
    }
    const bonus = Math.floor(base * AD_REWARD_CONFIG.missionBonusMultiplier);
    const extra = Math.max(0, bonus - base);
    return {
      offerId,
      context: input.context,
      /** Display / acknowledge only — walk credits already cashed into the wallet. */
      baseLines: [{ kind: "credits", amount: base }],
      /** Ad grants the uplift only so the normal reward is never locked. */
      previewLines: [{ kind: "credits", amount: extra }],
      baseLabel: `CLAIM $${base.toLocaleString()}`,
      adLabel: `WATCH AD — CLAIM $${bonus.toLocaleString()}`,
      token: offerToken(offerId),
      expiresAt: now + 10 * 60_000,
    };
  }

  if (input.context === "offline_boost") {
    const boosted = Math.floor(base * AD_REWARD_CONFIG.offlineBoostMultiplier);
    return {
      offerId,
      context: input.context,
      baseLines: [{ kind: "credits", amount: base }],
      previewLines: [{ kind: "credits", amount: boosted }],
      baseLabel: `CLAIM $${base.toLocaleString()}`,
      adLabel: `WATCH AD — BOOST TO $${boosted.toLocaleString()}`,
      token: offerToken(offerId),
      expiresAt: now + 10 * 60_000,
    };
  }

  if (input.context === "daily_bonus") {
    return {
      offerId,
      context: input.context,
      baseLines: [],
      previewLines: [{ kind: "credits", amount: AD_REWARD_CONFIG.dailyBonusCredits }],
      baseLabel: "Already claimed",
      adLabel: `WATCH AD FOR +${AD_REWARD_CONFIG.dailyBonusCredits} CREDITS`,
      token: offerToken(offerId),
      expiresAt: now + 10 * 60_000,
    };
  }

  if (input.context === "bonus_chest") {
    const c = AD_REWARD_CONFIG.bonusChest;
    return {
      offerId,
      context: input.context,
      baseLines: [],
      previewLines: [
        { kind: "credits", amount: c.credits },
        { kind: "laces", amount: c.laces },
      ],
      baseLabel: "Skip",
      adLabel: `WATCH AD — CHEST (${c.credits} Credits + ${c.laces} Laces)`,
      token: offerToken(offerId),
      expiresAt: now + 10 * 60_000,
    };
  }

  if (input.context === "earnings_boost") {
    const b = AD_REWARD_CONFIG.earningsBoostFromAd;
    return {
      offerId,
      context: input.context,
      baseLines: [],
      previewLines: [
        {
          kind: "boost",
          boostId: "street_hustle",
          durationMs: b.durationMs,
          amount: b.multiplier,
        },
      ],
      baseLabel: "No thanks",
      adLabel: `WATCH AD — ${b.multiplier}× EARNINGS (${Math.round(b.durationMs / 60000)}m)`,
      token: offerToken(offerId),
      expiresAt: now + 10 * 60_000,
    };
  }

  // flat_bonus / timer_skip
  const flat = AD_REWARD_CONFIG.flatBonusCredits;
  return {
    offerId,
    context: input.context,
    baseLines: [],
    previewLines: [{ kind: "credits", amount: flat }],
    baseLabel: "Not now",
    adLabel: `WATCH AD — +${flat} CREDITS`,
    token: offerToken(offerId),
    expiresAt: now + 10 * 60_000,
  };
}

function utcStamp(now: number): string {
  return new Date(now).toISOString().slice(0, 13);
}

/** Claim base reward without watching an ad. */
export function claimBaseReward(input: {
  claimId: string;
  source: ClaimSource;
  lines: RewardLine[];
}): ClaimResult {
  return commitClaim({
    claimId: input.claimId,
    source: input.source,
    lines: input.lines,
  });
}

/**
 * Grant ad bonus only after “provider” confirms completion.
 * Web: house/AdSense watch timer acts as completion gate in UI — this still
 * enforces cooldown, daily limit, token match, and idempotent claimId.
 */
export function claimAdBonus(input: {
  offer: RewardedOffer;
  token: string;
  adCompleted: boolean;
}): ClaimResult {
  if (!input.adCompleted) {
    return { ok: false, reason: "Ad was not completed." };
  }
  if (input.token !== input.offer.token) {
    return { ok: false, reason: "Invalid offer token." };
  }
  if (Date.now() > input.offer.expiresAt) {
    return { ok: false, reason: "Offer expired." };
  }
  const wallet = readWallet();
  const gate = canCompleteRewardedAd(wallet);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const claimId = makeClaimId(["ad", input.offer.offerId]);
  const result = commitClaim({
    claimId,
    source:
      input.offer.context === "mission_complete"
        ? "mission_ad_bonus"
        : input.offer.context === "daily_bonus"
          ? "daily_ad_bonus"
          : input.offer.context === "offline_boost"
            ? "offline_ad_boost"
            : "rewarded_ad",
    lines: input.offer.previewLines,
    providerRef: `ad:${input.offer.context}:${input.offer.token}`,
  });
  if (result.ok && !result.duplicate) {
    writeWallet(markAdCompletion(result.wallet));
    result.wallet = readWallet();
  }
  return result;
}

export function oldManBundleRewardLines(): RewardLine[] {
  const c = OLD_MAN_BUNDLE.contents;
  const lines: RewardLine[] = [
    { kind: "bundle_ownership", itemId: OLD_MAN_BUNDLE.id },
    { kind: "credits", amount: c.credits },
    { kind: "laces", amount: c.laces },
    { kind: "credits", amount: c.rewardPackCredits },
    { kind: "outfit", itemId: c.outfitId },
    { kind: "collectible", itemId: c.collectibleId },
    { kind: "badge", itemId: c.badgeId },
    { kind: "title", itemId: c.titleId },
    { kind: "boost", boostId: c.boostId, durationMs: c.boostDurationMs },
  ];
  for (const id of c.cosmeticIds) {
    lines.push({ kind: "cosmetic", itemId: id });
  }
  return lines;
}

export function grantPassXp(amount: number, reason: string): ClaimResult {
  const claimId = makeClaimId(["passxp", reason, Date.now()]);
  return commitClaim({
    claimId,
    source: "pass",
    lines: [{ kind: "pass_xp", amount }],
  });
}

export { PASS_CONFIG };
