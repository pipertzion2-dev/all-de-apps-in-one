import { NextResponse } from "next/server";
import { computeMonetizationReport } from "@/lib/clean-sneaks/monetization/analytics";

export const dynamic = "force-dynamic";

/**
 * Reporting snapshot.
 * Full ARPU/ARPPU for the fleet needs a warehouse — this returns formula helpers + notes.
 * Client-local report is computed in-browser via computeMonetizationReport.
 */
export async function GET() {
  return NextResponse.json({
    note: "Per-player metrics live in the client wallet analytics + local event log. Aggregate with your analytics sink.",
    formulas: {
      arpu: "total_iap_revenue / active_players",
      arppu: "total_iap_revenue / paying_players",
      rewarded_ad_completion_rate: "rewarded_ad_completed / rewarded_ad_offered",
      purchase_conversion_rate: "purchase_completed / purchase_started",
      payer_conversion_rate: "paying_players / active_players",
    },
    events: [
      "shop_opened",
      "bundle_viewed",
      "old_man_bundle_purchased",
      "purchase_started",
      "purchase_completed",
      "purchase_failed",
      "rewarded_ad_offered",
      "rewarded_ad_started",
      "rewarded_ad_completed",
      "rewarded_ad_failed",
      "ad_bonus_claimed",
      "daily_reward_claimed",
      "mission_completed",
      "pass_purchased",
    ],
    /** Empty server stub — browser computes via same helper when needed. */
    sample: null as ReturnType<typeof computeMonetizationReport> | null,
  });
}
