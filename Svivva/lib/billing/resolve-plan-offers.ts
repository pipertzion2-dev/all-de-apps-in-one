import type { InterimPaymentConfig } from "@/lib/interim-payments";
import { directPayForTier } from "@/lib/interim-payments";
import {
  BILLING_PLANS,
  envPriceIdForTier,
  type BillingPlanDefinition,
  type BillingPlanTier,
} from "@/lib/billing/plans";
import { inferBillingTier } from "@/lib/stripe/catalog";

export type BillingCheckoutProvider = "venmo" | "cashapp" | null;

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

/** Resolves $20 Starter / $50 Pro checkout via Venmo or Cash App only. */
export function resolveBillingPlanOffers(opts: {
  stripeProducts?: StripeProductRow[];
  interim: InterimPaymentConfig;
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
    const direct = directPayForTier(plan.tier, opts.interim);

    return {
      ...plan,
      priceId,
      paymentLink: direct?.link ?? null,
      checkoutAvailable: direct !== null,
      checkoutProvider: direct?.method ?? null,
    };
  });
}
