/** Canonical ZZAI subscription plans shown on /dashboard/billing. */

export type BillingPlanTier = "free" | "starter" | "pro";

export type BillingPlanDefinition = {
  tier: BillingPlanTier;
  name: string;
  priceLabel: string;
  amountCents: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  /** Stripe Price ID — env fallback when products are not synced yet. */
  envPriceIdKey: "STRIPE_PRICE_ID_STARTER" | "STRIPE_PRICE_ID_PRO" | null;
  /** Interim Stripe Payment Link field on platform secrets (works before API checkout). */
  interimLinkKey: "interimStripePaymentLinkStarter" | "interimStripePaymentLinkPro" | null;
};

export const BILLING_PLANS: BillingPlanDefinition[] = [
  {
    tier: "free",
    name: "Free",
    priceLabel: "$0",
    amountCents: 0,
    period: "forever",
    description: "Sample the cube — pay for a Suite Pass to unlock all mini apps",
    features: [
      "Cube launcher — open any mini app",
      "Digital mini app — 1 project, 100 API calls/mo",
      "Basic eval suite",
      "Community support",
    ],
    envPriceIdKey: null,
    interimLinkKey: null,
  },
  {
    tier: "starter",
    name: "Starter",
    priceLabel: "$20",
    amountCents: 2000,
    period: "per month",
    description: "Suite Pass Lite — core mini apps for solo builders",
    features: [
      "Suite Pass Lite — Digital, Orbit & Seeds essentials",
      "Digital mini app — 3 projects, 2,000 API calls/mo",
      "Orbit mini app — marketing copy generation",
      "Full eval suite",
      "Email support",
    ],
    envPriceIdKey: "STRIPE_PRICE_ID_STARTER",
    interimLinkKey: "interimStripePaymentLinkStarter",
  },
  {
    tier: "pro",
    name: "Pro",
    priceLabel: "$50",
    amountCents: 5000,
    period: "per month",
    description: "Full Suite Pass — all six cube mini apps",
    features: [
      "One OaaS brain on the master bus — not six separate SaaS bills",
      "Suite Pass — Play, Seeds, Orbit, Protect, Digital & Hardware",
      "Blend two creation paths (e.g. Seeds + Hardware) on one desk",
      "Digital mini app — 10 projects, 10k API calls/mo, rollback",
      "Play, Seeds, Hardware & Protect — full mini app access",
      "Auto-rollback eval suite",
      "Priority support",
      "Custom training data & version history",
    ],
    popular: true,
    envPriceIdKey: "STRIPE_PRICE_ID_PRO",
    interimLinkKey: "interimStripePaymentLinkPro",
  },
];

export function getBillingPlan(tier: BillingPlanTier): BillingPlanDefinition {
  return BILLING_PLANS.find((p) => p.tier === tier) ?? BILLING_PLANS[0];
}

export function envPriceIdForTier(tier: BillingPlanTier): string | null {
  const plan = getBillingPlan(tier);
  if (!plan.envPriceIdKey) return null;
  return process.env[plan.envPriceIdKey]?.trim() || null;
}

export function isPaidBillingTier(tier: string | null | undefined): tier is "starter" | "pro" {
  return tier === "starter" || tier === "pro";
}

export function paidTierGrantsProAccess(tier: string | null | undefined): boolean {
  return isPaidBillingTier(tier);
}
