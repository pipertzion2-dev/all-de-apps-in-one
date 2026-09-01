import type { InterimPaymentConfig } from "@/lib/interim-payments";
import {
  BILLING_PLANS,
  envPriceIdForTier,
  type BillingPlanDefinition,
  type BillingPlanTier,
} from "@/lib/billing/plans";
import { inferBillingTier } from "@/lib/stripe/catalog";

export type BillingCheckoutProvider = "lemonsqueezy" | "stripe" | "link" | null;

export type ResolvedBillingPlan = BillingPlanDefinition & {
  priceId: string | null;
  paymentLink: string | null;
  checkoutAvailable: boolean;
  checkoutProvider: BillingCheckoutProvider;
};

type StripePriceRow = {
  id: string;
  unitAmount: number | null;
  recurring: { interval: string } | null;
};

type StripeProductRow = {
  name: string;
  metadata: Record<string, string>;
  prices: StripePriceRow[];
};

function interimLinkForPlan(
  plan: BillingPlanDefinition,
  interim: InterimPaymentConfig,
): string | null {
  if (plan.interimLinkKey === "interimStripePaymentLinkStarter") {
    return interim.stripePaymentLinkStarter ?? interim.stripePaymentLinkEnterprise ?? null;
  }
  if (plan.interimLinkKey === "interimStripePaymentLinkPro") {
    return interim.stripePaymentLinkPro ?? null;
  }
  return null;
}

function priceIdFromStripeProducts(
  tier: BillingPlanTier,
  products: StripeProductRow[],
): string | null {
  for (const product of products) {
    const inferred = inferBillingTier(product.name, product.metadata);
    if (inferred !== tier) continue;
    const monthly =
      product.prices.find((p) => p.recurring?.interval === "month") ?? product.prices[0];
    return monthly?.id ?? null;
  }
  return null;
}

function lemonAvailableForTier(
  tier: BillingPlanTier,
  opts: { lemonStarter?: boolean; lemonPro?: boolean },
): boolean {
  if (tier === "starter") return !!opts.lemonStarter;
  if (tier === "pro") return !!opts.lemonPro;
  return false;
}

export function resolveBillingPlanOffers(opts: {
  stripeProducts?: StripeProductRow[];
  interim: InterimPaymentConfig;
  stripeCheckoutReady: boolean;
  lemonStarter?: boolean;
  lemonPro?: boolean;
}): ResolvedBillingPlan[] {
  const products = opts.stripeProducts ?? [];

  return BILLING_PLANS.map((plan) => {
    if (plan.tier === "free") {
      return {
        ...plan,
        priceId: null,
        paymentLink: null,
        checkoutAvailable: false,
        checkoutProvider: null,
      };
    }

    const priceId =
      priceIdFromStripeProducts(plan.tier, products) ?? envPriceIdForTier(plan.tier) ?? null;
    const paymentLink = interimLinkForPlan(plan, opts.interim);
    const lemonOk = lemonAvailableForTier(plan.tier, opts);

    let checkoutProvider: BillingCheckoutProvider = null;
    if (lemonOk) checkoutProvider = "lemonsqueezy";
    else if (opts.stripeCheckoutReady && priceId) checkoutProvider = "stripe";
    else if (paymentLink) checkoutProvider = "link";

    const checkoutAvailable = checkoutProvider !== null;

    return { ...plan, priceId, paymentLink, checkoutAvailable, checkoutProvider };
  });
}
