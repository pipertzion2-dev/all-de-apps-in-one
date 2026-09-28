import { NextResponse } from "next/server";
import { getMembershipUnlockInfo } from "@/lib/billing/membership-unlock";
import { getBillingPaymentOptions } from "@/lib/billing/payment-options";
import { cashAppRecurringPlans } from "@/lib/billing/cashapp-recurring";
import { mergeInterimPaymentConfig } from "@/lib/interim-payments";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

export const dynamic = "force-dynamic";

/** Cash App recurring subscription offers for Klean / platform unlock. */
export async function GET() {
  try {
    const row = await getPlatformRuntimeSecretsRow();
    const interim = mergeInterimPaymentConfig(
      row
        ? {
            cashAppUrlStarter: row.interimCashAppUrlStarter,
            cashAppUrlPro: row.interimCashAppUrlPro,
            note: row.interimPaymentNote,
          }
        : null,
    );
    const paymentOptions = await getBillingPaymentOptions();
    const plans = cashAppRecurringPlans(interim);
    const unlock = getMembershipUnlockInfo();

    return NextResponse.json({
      cashAppTag: paymentOptions.cashAppTag,
      plans,
      membershipUnlock: unlock,
      note: interim.note,
    });
  } catch (err) {
    console.error("platform-subscribe:", err);
    return NextResponse.json({ error: "Could not load subscription options." }, { status: 500 });
  }
}
