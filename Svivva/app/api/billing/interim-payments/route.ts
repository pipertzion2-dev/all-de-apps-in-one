import { mergeInterimPaymentConfig, toPublicInterimPayments } from "@/lib/interim-payments";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public interim payment links (Stripe Payment Link, PayPal, etc.). */
export async function GET() {
  try {
    const row = await getPlatformRuntimeSecretsRow();
    const config = mergeInterimPaymentConfig(
      row
        ? {
            stripePaymentLinkPro: row.interimStripePaymentLinkPro,
            stripePaymentLinkEnterprise: row.interimStripePaymentLinkEnterprise,
            paypalUrl: row.interimPaypalUrl,
            venmoUrl: row.interimVenmoUrl,
            note: row.interimPaymentNote,
          }
        : null,
    );

    return NextResponse.json(toPublicInterimPayments(config));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
