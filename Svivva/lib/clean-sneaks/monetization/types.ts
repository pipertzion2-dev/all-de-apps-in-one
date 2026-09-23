import type { BoostId } from "./config";

export type RewardKind =
  | "credits"
  | "laces"
  | "cosmetic"
  | "outfit"
  | "collectible"
  | "badge"
  | "title"
  | "boost"
  | "pass_xp"
  | "bundle_ownership";

export type RewardLine = {
  kind: RewardKind;
  amount?: number;
  itemId?: string;
  boostId?: BoostId;
  durationMs?: number;
};

export type ClaimSource =
  | "mission"
  | "mission_ad_bonus"
  | "daily"
  | "daily_ad_bonus"
  | "offline"
  | "offline_ad_boost"
  | "rewarded_ad"
  | "purchase"
  | "bundle"
  | "pass"
  | "boost_activation"
  | "starter"
  | "restore";

export type ClaimRecord = {
  claimId: string;
  source: ClaimSource;
  lines: RewardLine[];
  createdAt: number;
  /** Hash / provider receipt when from purchase or ad. */
  providerRef?: string;
};

export type ActiveBoost = {
  boostId: BoostId;
  multiplier: number;
  expiresAt: number;
};

export type PlayerWallet = {
  version: number;
  /** Soft currency — synced with casino session credits. */
  credits: number;
  /** Premium currency. */
  laces: number;
  ownedCosmetics: string[];
  ownedOutfits: string[];
  ownedCollectibles: string[];
  ownedBadges: string[];
  ownedTitles: string[];
  /** Product ids already owned (bundles, pass). */
  ownedProducts: string[];
  activeBoosts: ActiveBoost[];
  /** Idempotent claim ledger (capped). */
  claimedIds: string[];
  daily: {
    lastClaimDay: string | null;
    streak: number;
    adBonusClaimedDay: string | null;
  };
  pass: {
    seasonId: string | null;
    premium: boolean;
    xp: number;
    claimedFreeLevels: number[];
    claimedPremiumLevels: number[];
    expiresAt: number | null;
  };
  ads: {
    /** UTC day key YYYY-MM-DD */
    day: string | null;
    completionsToday: number;
    lastCompletionAt: number | null;
  };
  offline: {
    lastSeenAt: number;
  };
  walksCompleted: number;
  analytics: {
    purchasesCompleted: number;
    purchaseRevenueCents: number;
    adCompletions: number;
    shopOpens: number;
  };
  updatedAt: number;
};

export type RewardedOfferContext =
  | "flat_bonus"
  | "mission_complete"
  | "daily_bonus"
  | "offline_boost"
  | "bonus_chest"
  | "earnings_boost"
  | "timer_skip";

export type RewardedOffer = {
  offerId: string;
  context: RewardedOfferContext;
  /** Exact reward shown before watch. */
  previewLines: RewardLine[];
  /** Base (non-ad) reward the player can always claim. */
  baseLines: RewardLine[];
  baseLabel: string;
  adLabel: string;
  /** Opaque server/client token bound to this offer. */
  token: string;
  expiresAt: number;
};
