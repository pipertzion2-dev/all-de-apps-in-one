/**
 * Central monetization config for Klean Sneaks & the Old Man's Bundle.
 * Override via NEXT_PUBLIC_KLEAN_* env where noted — never hard-code live economy in UI.
 */

export const MONETIZATION_CONFIG_VERSION = 1;

/** Soft currency = casino Credits (earned from walks). Premium = Laces. */
export const PREMIUM_CURRENCY = {
  id: "laces",
  name: "Laces",
  shortName: "Laces",
  blurb: "Premium lace tokens for exclusive kicks, the Old Man's Bundle, and street-side boosts.",
} as const;

export const SOFT_CURRENCY = {
  id: "credits",
  name: "Credits",
  shortName: "Credits",
  blurb: "Street chips earned on the walk — ante at Steal the Bundle.",
} as const;

/** Rewarded-ad offer multipliers & limits (configurable). */
export const AD_REWARD_CONFIG = {
  /** Cooldown between any rewarded offer completion (ms). */
  globalCooldownMs: 90_000,
  /** Max successful rewarded bonuses per UTC day. */
  dailyLimit: 12,
  /** Mission/job completion: bonus = floor(base * multiplier). */
  missionBonusMultiplier: 1.5,
  /** Show mission ad option at most once every N completed walks. */
  missionOfferEveryNWalks: 1,
  /** Offline earnings ad boost multiplier. */
  offlineBoostMultiplier: 1.5,
  /** Temporary earnings boost from ad (duration ms, multiplier). */
  earningsBoostFromAd: { multiplier: 1.25, durationMs: 15 * 60_000 },
  /** Extra daily reward via ad (credits). */
  dailyBonusCredits: 100,
  /** Extra chest from ad (credits + chance lace). */
  bonusChest: { credits: 150, laces: 1 },
  /** Shorten optional timer by this fraction when ad completes. */
  timerSkipFraction: 1,
  /** Flat bonus credits offer (generic). */
  flatBonusCredits: 75,
} as const;

export const DAILY_REWARD_CONFIG = {
  /** Streak cycle length before reset (days). */
  streakLength: 7,
  /** Soft credits by day index 0..6 */
  creditsByDay: [50, 75, 100, 125, 150, 200, 300] as readonly number[],
  /** Laces on day 7 (index 6) */
  lacesOnFinale: 2,
  /** Optional cosmetic unlock id on day 7 */
  finaleCosmeticId: "graphite" as const,
} as const;

export const OFFLINE_REWARD_CONFIG = {
  /** Credits per full hour away (capped). */
  creditsPerHour: 40,
  /** Max hours that count. */
  maxHours: 8,
  /** Minimum away ms before showing modal. */
  minAwayMs: 5 * 60_000,
} as const;

export const BOOST_CATALOG = [
  {
    id: "street_hustle",
    label: "Street Hustle",
    blurb: "Walk credits earn +25% for 30 minutes.",
    multiplier: 1.25,
    durationMs: 30 * 60_000,
    priceLaces: 5,
    priceCents: null as number | null,
    storeProductId: "klean_boost_street_hustle",
    gameplayAdvantage: true,
  },
  {
    id: "bundle_ante",
    label: "High Roller Aura",
    blurb: "Steal Bundle win payout +20% for 20 minutes. Advantage disclosed.",
    multiplier: 1.2,
    durationMs: 20 * 60_000,
    priceLaces: 8,
    priceCents: null as number | null,
    storeProductId: "klean_boost_bundle_ante",
    gameplayAdvantage: true,
  },
  {
    id: "offline_grind",
    label: "Corner Store Grind",
    blurb: "Offline earnings +50% for the next claim window.",
    multiplier: 1.5,
    durationMs: 60 * 60_000,
    priceLaces: 6,
    priceCents: null as number | null,
    storeProductId: "klean_boost_offline",
    gameplayAdvantage: true,
  },
] as const;

export type BoostId = (typeof BOOST_CATALOG)[number]["id"];

/** Premium lace packs — display prices from store when available; cents are fallback. */
export const LACE_PACKS = [
  {
    id: "laces_small",
    label: "Shoehorn Stash",
    laces: 40,
    priceCents: 99,
    storeProductId: "klean_laces_small",
    kind: "currency" as const,
  },
  {
    id: "laces_medium",
    label: "Laces Medium",
    laces: 120,
    priceCents: 299,
    storeProductId: "klean_laces_medium",
    kind: "currency" as const,
  },
  {
    id: "laces_large",
    label: "Laces Large",
    laces: 350,
    priceCents: 699,
    storeProductId: "klean_laces_large",
    kind: "currency" as const,
  },
  {
    id: "starter_bundle",
    label: "Fresh Fit Starter",
    laces: 60,
    credits: 400,
    cosmeticIds: ["emerald"] as const,
    priceCents: 499,
    storeProductId: "klean_starter_bundle",
    kind: "bundle" as const,
  },
] as const;

/**
 * The Old Man's Bundle — flagship purchasable identity pack.
 * Contents are fully configurable here.
 */
export const OLD_MAN_BUNDLE = {
  id: "old_mans_bundle",
  storeProductId: "klean_old_mans_bundle",
  title: "The Old Man's Bundle",
  subtitle: "Steal his look. Keep your soul. Optional forever.",
  priceCents: 999,
  priceLaces: 80,
  /** Allow buying with Laces OR real money. */
  allowLacePurchase: true,
  allowRealMoney: true,
  contents: {
    credits: 1000,
    laces: 25,
    cosmeticIds: ["midnight", "void"] as const,
    outfitId: "old_man_drip",
    collectibleId: "old_man_matchbook",
    badgeId: "old_man_witness",
    titleId: "Bundle Thief",
    boostId: "street_hustle" as BoostId,
    boostDurationMs: 60 * 60_000,
    rewardPackCredits: 250,
  },
  presentation: {
    tagline: "The Old Man doesn't sell this. You take it — fair and square.",
    accent: "#d4af37",
  },
} as const;

/** Cosmetics — paid/unlockable colorways & profile flair. Pure cosmetics unless disclosed. */
export const COSMETIC_PRODUCTS = [
  {
    id: "amethyst",
    kind: "colorway" as const,
    label: "BALOON8 Amethyst",
    priceLaces: 15,
    priceCents: 199,
    storeProductId: "klean_cosmetic_amethyst",
    gameplayAdvantage: false,
  },
  {
    id: "solar",
    kind: "colorway" as const,
    label: "BALOON8 Solar",
    priceLaces: 20,
    priceCents: 249,
    storeProductId: "klean_cosmetic_solar",
    gameplayAdvantage: false,
  },
  {
    id: "void",
    kind: "colorway" as const,
    label: "BALOON8 Void",
    priceLaces: 25,
    priceCents: 299,
    storeProductId: "klean_cosmetic_void",
    gameplayAdvantage: false,
  },
  {
    id: "old_man_drip",
    kind: "outfit" as const,
    label: "Old Man Drip",
    priceLaces: 40,
    priceCents: null,
    storeProductId: "klean_cosmetic_old_man_drip",
    gameplayAdvantage: false,
  },
  {
    id: "matchbook_fx",
    kind: "effect" as const,
    label: "Matchbook Sparks",
    priceLaces: 12,
    priceCents: null,
    storeProductId: "klean_cosmetic_matchbook_fx",
    gameplayAdvantage: false,
  },
] as const;

export const PASS_CONFIG = {
  id: "street_season_1",
  title: "Street Season Pass",
  subtitle: "Walk the block. Unlock the free track — or lace up Premium.",
  durationMs: 30 * 24 * 60 * 60_000,
  priceCents: 799,
  priceLaces: 60,
  storeProductId: "klean_street_pass_s1",
  xpPerWalkComplete: 40,
  xpPerBundleWin: 25,
  levels: [
    { level: 1, xp: 0, free: { credits: 50 }, premium: { laces: 2 } },
    { level: 2, xp: 40, free: { credits: 75 }, premium: { credits: 150 } },
    { level: 3, xp: 90, free: { credits: 100 }, premium: { cosmeticId: "amethyst" } },
    { level: 4, xp: 150, free: { credits: 125 }, premium: { laces: 5 } },
    { level: 5, xp: 220, free: { credits: 150 }, premium: { boostId: "street_hustle" as BoostId } },
    { level: 6, xp: 300, free: { credits: 200 }, premium: { credits: 400, laces: 8 } },
    {
      level: 7,
      xp: 400,
      free: { credits: 250 },
      premium: { cosmeticId: "solar", badgeId: "season_walker" },
    },
  ],
} as const;

/** Existing credit packs remain under casino; mirrored for shop FEATURED. */
export { CREDIT_PACKS } from "../casino/credit-packs";
