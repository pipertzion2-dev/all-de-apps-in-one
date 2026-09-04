import { ok } from "@/lib/http-response";
import { getCashAppTag, mergeInterimPaymentConfig } from "@/lib/interim-payments";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

/** Default Cash App tag for ZZAI Show host payouts. */
export async function GET() {
  const row = await getPlatformRuntimeSecretsRow();
  const config = mergeInterimPaymentConfig(
    row
      ? {
          cashAppUrlStarter: row.interimCashAppUrlStarter,
          cashAppUrlPro: row.interimCashAppUrlPro,
        }
      : null,
  );
  const tag = getCashAppTag(config);
  return ok({
    cashAppTag: tag,
    defaultHostPayment: { method: "cashapp" as const, handle: tag },
  });
}
