import {
  FREE_ONLINE_TABLES_PER_MONTH,
  GUEST_ONLINE_TABLES_PER_MONTH,
} from "@/lib/clean-sneaks/monetization/platform-strategy";

/** Resolve whether a DB user row grants paid platform access (Stripe / Lemon / grant). */

export type ResolvedPlatformPlan = "free" | "starter" | "pro" | "enterprise";

export type UserBillingRow = {
  stripeSubscriptionId?: string | null;
  lemonSqueezySubscriptionId?: string | null;
  proAccessUntil?: Date | null;
};

export function hasActiveProGrant(user: UserBillingRow, now = Date.now()): boolean {
  const until = user.proAccessUntil;
  if (!until) return false;
  const t = until instanceof Date ? until.getTime() : new Date(until).getTime();
  return Number.isFinite(t) && t > now;
}

/** Any active subscription or complimentary Pro — unlimited Klean online. */
export function hasUnlimitedKleanOnline(user: UserBillingRow | null | undefined): boolean {
  if (!user) return false;
  if (hasActiveProGrant(user)) return true;
  if (user.lemonSqueezySubscriptionId?.trim()) return true;
  if (user.stripeSubscriptionId?.trim()) return true;
  return false;
}

export function kleanOnlineMonthlyLimit(signedIn: boolean, unlimited: boolean): number {
  if (unlimited) return 0;
  return signedIn ? FREE_ONLINE_TABLES_PER_MONTH : GUEST_ONLINE_TABLES_PER_MONTH;
}
