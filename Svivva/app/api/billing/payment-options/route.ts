import { NextResponse } from "next/server";
import { getBillingPaymentOptions } from "@/lib/billing/payment-options";

export const dynamic = "force-dynamic";

/** Public payment options for Billing (Stripe readiness, Lemon Squeezy, interim links). */
export async function GET() {
  try {
    const options = await getBillingPaymentOptions();
    return NextResponse.json(options);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
