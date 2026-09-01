import { mergeInterimPaymentConfig, toPublicInterimPayments } from "@/lib/interim-payments";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public direct-pay links (Venmo, Cash App, Zelle). */
export async function GET() {
  try {
    const row = await getPlatformRuntimeSecretsRow();
    const config = mergeInterimPaymentConfig(
      row
        ? {
            venmoUrlStarter: row.interimVenmoUrlStarter,
            venmoUrlPro: row.interimVenmoUrlPro,
            venmoUrl: row.interimVenmoUrl,
            cashAppUrlStarter: row.interimCashAppUrlStarter,
            cashAppUrlPro: row.interimCashAppUrlPro,
            zelleContact: row.interimZelleContact,
            note: row.interimPaymentNote,
          }
        : null,
    );

    return NextResponse.json(toPublicInterimPayments(config));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
