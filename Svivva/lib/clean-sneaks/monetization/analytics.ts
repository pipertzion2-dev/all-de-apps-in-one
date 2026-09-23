import { trackEvent } from "@/lib/analytics";
import { readWallet, writeWallet } from "./wallet";

export type MonetizationEventName =
  | "shop_opened"
  | "bundle_viewed"
  | "old_man_bundle_purchased"
  | "purchase_started"
  | "purchase_completed"
  | "purchase_failed"
  | "rewarded_ad_offered"
  | "rewarded_ad_started"
  | "rewarded_ad_completed"
  | "rewarded_ad_failed"
  | "ad_bonus_claimed"
  | "daily_reward_claimed"
  | "mission_completed"
  | "pass_purchased"
  | "offline_reward_claimed"
  | "boost_activated";

const LOCAL_EVENTS_KEY = "zzai.clean-sneaks.monetization.events.v1";
const MAX_EVENTS = 500;

export type MonetizationEvent = {
  name: MonetizationEventName;
  at: number;
  props?: Record<string, string | number | boolean | null>;
};

function readLocalEvents(): MonetizationEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MonetizationEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalEvents(events: MonetizationEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* ignore */
  }
}

export function trackMonetization(
  name: MonetizationEventName,
  props?: Record<string, string | number | boolean | null>,
) {
  const event: MonetizationEvent = { name, at: Date.now(), props };
  const prev = readLocalEvents();
  writeLocalEvents([...prev, event]);
  trackEvent(name, {
    event_category: "klean_sneaks_monetization",
    ...props,
  });
  if (name === "shop_opened") {
    const wallet = readWallet();
    writeWallet({
      ...wallet,
      analytics: { ...wallet.analytics, shopOpens: wallet.analytics.shopOpens + 1 },
    });
  }
}

export function computeMonetizationReport(now = Date.now()) {
  const events = readLocalEvents();
  const wallet = readWallet();
  const dayMs = 24 * 60 * 60_000;
  const dayAgo = now - dayMs;
  const monthAgo = now - 30 * dayMs;

  const inRange = (from: number) => events.filter((e) => e.at >= from);
  const revenue = (list: MonetizationEvent[]) =>
    list
      .filter((e) => e.name === "purchase_completed")
      .reduce((sum, e) => sum + Number(e.props?.revenueCents || 0), 0);

  const purchases = events.filter((e) => e.name === "purchase_completed");
  const adOffered = events.filter((e) => e.name === "rewarded_ad_offered").length;
  const adCompleted = events.filter((e) => e.name === "rewarded_ad_completed").length;
  const purchaseStarted = events.filter((e) => e.name === "purchase_started").length;

  const byProduct: Record<string, number> = {};
  for (const e of purchases) {
    const id = String(e.props?.productId || "unknown");
    byProduct[id] = (byProduct[id] || 0) + Number(e.props?.revenueCents || 0);
  }

  const uniquePayers = new Set(purchases.map((e) => String(e.props?.receiptId || e.at))).size;
  const sessionsProxy = Math.max(1, wallet.analytics.shopOpens || 1);

  return {
    revenueCentsDay: revenue(inRange(dayAgo)),
    revenueCentsMonth: revenue(inRange(monthAgo)),
    iapRevenueCents: wallet.analytics.purchaseRevenueCents,
    estimatedAdRevenueUsd: wallet.analytics.adCompletions * 0.0095,
    revenueByProductCents: byProduct,
    oldManBundleSales: purchases.filter(
      (e) =>
        e.props?.productId === "old_mans_bundle" || e.props?.productId === "klean_old_mans_bundle",
    ).length,
    payerConversionRate: uniquePayers / sessionsProxy,
    arpuCents: wallet.analytics.purchaseRevenueCents / sessionsProxy,
    arppuCents: uniquePayers ? wallet.analytics.purchaseRevenueCents / uniquePayers : 0,
    rewardedAdCompletionRate: adOffered ? adCompleted / adOffered : 0,
    purchaseConversionRate: purchaseStarted ? purchases.length / purchaseStarted : 0,
    totals: {
      purchasesCompleted: wallet.analytics.purchasesCompleted,
      adCompletions: wallet.analytics.adCompletions,
      shopOpens: wallet.analytics.shopOpens,
    },
  };
}
