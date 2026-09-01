import { NextResponse } from "next/server";
import { getBillingPaymentOptions } from "@/lib/billing/payment-options";
import { resolveBillingPlanOffers } from "@/lib/billing/resolve-plan-offers";

/** Public plan catalog — Starter $20 / Pro $50 via Cash App. */
export async function GET() {
  try {
    const paymentOptions = await getBillingPaymentOptions();

    const plans = resolveBillingPlanOffers({
      interim: paymentOptions.interim,
    });

    return NextResponse.json({
      plans,
      paymentOptions: {
        cashAppPlansActive: paymentOptions.cashAppPlansActive,
        cashAppTag: paymentOptions.cashAppTag,
        preferredProvider: paymentOptions.preferredProvider,
        interim: {
          active: paymentOptions.interim.active,
          note: paymentOptions.interim.note,
        },
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
