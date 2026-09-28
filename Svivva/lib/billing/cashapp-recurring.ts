import type { BillingPlanTier } from "@/lib/billing/plans";
import {
  cashAppPlanForTier,
  getCashAppTag,
  type InterimPaymentConfig,
} from "@/lib/interim-payments";

/** Billing period for Cash App “subscription” (manual recurring in app + code renew). */
export const CASHAPP_SUBSCRIPTION_DAYS = 30;
export const CASHAPP_SUBSCRIPTION_SOURCE = "cashapp_monthly";

export type CashAppRecurringPlan = {
  tier: Exclude<BillingPlanTier, "free">;
  name: string;
  amountDollars: number;
  priceLabel: string;
  periodLabel: string;
  /** One-tap pay link — user taps “Repeat monthly” in Cash App after opening. */
  paymentLink: string;
  recurringSteps: string[];
};

const RECURRING_STEPS = [
  "Open Cash App and confirm the payment amount.",
  "Tap Repeat (or Recurring) and choose Monthly before you send.",
  "Return here and enter your access code — unlimited online play activates for 30 days.",
  "Each month Cash App sends automatically; enter the code again if your plan lapses.",
] as const;

function noteForTier(tier: Exclude<BillingPlanTier, "free">): string {
  const label = tier === "starter" ? "ZZAI-Starter-mo" : "ZZAI-Pro-mo";
  return encodeURIComponent(label);
}

/** Deep link with memo hint for recurring ZZAI plans. */
export function cashAppRecurringPaymentLink(
  tier: Exclude<BillingPlanTier, "free">,
  config: InterimPaymentConfig,
): string | null {
  const base = cashAppPlanForTier(tier, config)?.link;
  if (!base) return null;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}note=${noteForTier(tier)}`;
}

export function cashAppRecurringPlans(config: InterimPaymentConfig): CashAppRecurringPlan[] {
  const tag = getCashAppTag(config);
  const plans: CashAppRecurringPlan[] = [];

  const starterLink = cashAppRecurringPaymentLink("starter", config);
  if (starterLink) {
    plans.push({
      tier: "starter",
      name: "Starter",
      amountDollars: 20,
      priceLabel: "$20",
      periodLabel: "per month (recurring in Cash App)",
      paymentLink: starterLink,
      recurringSteps: [...RECURRING_STEPS],
    });
  }

  const proLink = cashAppRecurringPaymentLink("pro", config);
  if (proLink) {
    plans.push({
      tier: "pro",
      name: "Pro",
      amountDollars: 50,
      priceLabel: "$50",
      periodLabel: "per month (recurring in Cash App)",
      paymentLink: proLink,
      recurringSteps: [...RECURRING_STEPS],
    });
  }

  if (plans.length === 0 && tag) {
    plans.push({
      tier: "starter",
      name: "Starter",
      amountDollars: 20,
      priceLabel: "$20",
      periodLabel: "per month (recurring in Cash App)",
      paymentLink: `https://cash.app/$${tag.replace(/^\$/, "")}/20?note=${noteForTier("starter")}`,
      recurringSteps: [...RECURRING_STEPS],
    });
  }

  return plans;
}

export function computeCashAppSubscriptionUntil(
  existing: Date | null | undefined,
  now = new Date(),
): Date {
  const base = existing && existing.getTime() > now.getTime() ? existing : now;
  return new Date(base.getTime() + CASHAPP_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
}
