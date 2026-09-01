import { NextResponse } from "next/server";
import { getBillingPaymentOptions } from "@/lib/billing/payment-options";
import { resolveBillingPlanOffers } from "@/lib/billing/resolve-plan-offers";
import { getStripeReadyStatus } from "@/lib/billing/stripe-ready";

/** Public plan catalog with live checkout flags ($20 Starter, $50 Pro). */
export async function GET() {
  try {
    const paymentOptions = await getBillingPaymentOptions();
    const stripe = await getStripeReadyStatus();

    const plans = resolveBillingPlanOffers({
      interim: paymentOptions.interim,
    });

    return NextResponse.json({
      plans,
      paymentOptions: {
        directPayActive: paymentOptions.directPayActive,
        preferredProvider: paymentOptions.preferredProvider,
        stripe: {
          checkoutReady: stripe.checkoutReady,
          configured: stripe.configured,
          detail: stripe.detail,
        },
        interim: {
          active: paymentOptions.interim.active,
          note: paymentOptions.interim.note,
          zelleContact: paymentOptions.interim.zelleContact,
        },
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
