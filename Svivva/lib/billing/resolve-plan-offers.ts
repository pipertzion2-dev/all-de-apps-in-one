import type { InterimPaymentConfig } from "@/lib/interim-payments";
import { cashAppPlanForTier } from "@/lib/interim-payments";
import { BILLING_PLANS, type BillingPlanDefinition } from "@/lib/billing/plans";

export type BillingCheckoutProvider = "cashapp" | null;

export type ResolvedBillingPlan = BillingPlanDefinition & {
  paymentLink: string | null;
  checkoutAvailable: boolean;
  checkoutProvider: BillingCheckoutProvider;
};

/** Resolves $20 Starter / $50 Pro — paid via Cash App only. */
export function resolveBillingPlanOffers(opts: {
  interim: InterimPaymentConfig;
}): ResolvedBillingPlan[] {
  return BILLING_PLANS.map((plan) => {
    if (plan.tier === "free") {
      return {
        ...plan,
        paymentLink: null,
        checkoutAvailable: false,
        checkoutProvider: null,
      };
    }

    const cashPlan = cashAppPlanForTier(plan.tier, opts.interim);

    return {
      ...plan,
      paymentLink: cashPlan?.link ?? null,
      checkoutAvailable: cashPlan !== null,
      checkoutProvider: cashPlan?.method ?? null,
    };
  });
}
