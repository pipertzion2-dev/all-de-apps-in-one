/** Orbit ↔ EasyPeasy model tiers — maps to chat-completion models on easy-peasy.ai/api. */
export type EasyPeasyTierId = "standard" | "balanced" | "premium";

export type EasyPeasyTier = {
  id: EasyPeasyTierId;
  name: string;
  model: string;
  fallbackModels: string[];
  tagline: string;
  /** Minimum EasyPeasy subscription that comfortably supports this tier */
  minEasyPeasyPlan: string;
  planPriceHint: string;
  /** Best for which Orbit jobs */
  orbitUse: string;
};

export const EASYPEASY_TIERS: EasyPeasyTier[] = [
  {
    id: "standard",
    name: "Standard",
    model: "gemini-3-flash",
    fallbackModels: ["gemini-2.0-flash", "deepseek-v3"],
    tagline: "Fast daily autopilot — unlimited on Unlimited 50+ plans",
    minEasyPeasyPlan: "Free tier (1K words) · best on Unlimited 50 ($12/mo)",
    planPriceHint: "Uses standard-model quota",
    orbitUse: "Social snippets, checklist condense, quick research",
  },
  {
    id: "balanced",
    name: "Balanced",
    model: "claude-sonnet-4-6",
    fallbackModels: ["gpt-5-mini", "gemini-3-flash", "deepseek-v3"],
    tagline: "Strong marketing copy without burning premium word caps",
    minEasyPeasyPlan: "Starter ($8/mo) or Unlimited 50 ($12/mo)",
    planPriceHint: "Counts toward Sonnet / GPT-5 word pool",
    orbitUse: "Blog posts, outreach pitches, comparison pages",
  },
  {
    id: "premium",
    name: "Premium",
    model: "gpt-5",
    fallbackModels: ["claude-opus-4-6", "gpt-5.4-pro", "claude-sonnet-4-6", "gemini-3-flash"],
    tagline: "Highest polish for long-form SEO and launch packs",
    minEasyPeasyPlan: "Starter+ · API on Unlimited ($16.50/mo)",
    planPriceHint: "Uses premium Opus / GPT-5 word allowance",
    orbitUse: "300+ SEO pages, AEO hubs, flagship launch copy",
  },
];

export const EASYPEASY_DEFAULT_TIER_ID: EasyPeasyTierId = "standard";

/** EasyPeasy subscription plans — reference only (pricing from easy-peasy.ai/pricing). */
export const EASYPEASY_SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0/mo",
    highlight: "1,000 words · 1 image · API not included",
    payUrl: "https://easy-peasy.ai/pricing",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$8/mo yearly",
    highlight: "25K Opus or 50K Sonnet/GPT-5 words · 200 media credits",
    payUrl: "https://easy-peasy.ai/pricing",
  },
  {
    id: "unlimited-50",
    name: "Unlimited 50",
    price: "$12/mo yearly",
    highlight: "Unlimited standard models + 50K premium words",
    payUrl: "https://easy-peasy.ai/pricing",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$16.50/mo yearly",
    highlight: "API access · 100K premium words · priority support",
    payUrl: "https://easy-peasy.ai/pricing",
  },
] as const;

export function getEasyPeasyTierById(id: string | null | undefined): EasyPeasyTier | null {
  const t = id?.trim().toLowerCase();
  if (!t) return null;
  return EASYPEASY_TIERS.find((tier) => tier.id === t) ?? null;
}

export function resolveEasyPeasyTierId(id: string | null | undefined): EasyPeasyTierId {
  return getEasyPeasyTierById(id)?.id ?? EASYPEASY_DEFAULT_TIER_ID;
}

export function getEasyPeasyModelForTier(tierId: string | null | undefined): string {
  return getEasyPeasyTierById(tierId)?.model ?? EASYPEASY_TIERS[0].model;
}

export function getEasyPeasyFallbacksForTier(tierId: string | null | undefined): string[] {
  const tier = getEasyPeasyTierById(tierId) ?? EASYPEASY_TIERS[0];
  return [...new Set([tier.model, ...tier.fallbackModels])];
}
