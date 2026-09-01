import {
  isDirectPayActive,
  mergeInterimPaymentConfig,
  toPublicInterimPayments,
} from "@/lib/interim-payments";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

export type BillingPaymentOptions = {
  interim: ReturnType<typeof toPublicInterimPayments>;
  directPayActive: boolean;
  preferredProvider: "direct" | null;
};

export async function getBillingPaymentOptions(): Promise<BillingPaymentOptions> {
  const row = await getPlatformRuntimeSecretsRow();

  const interimConfig = mergeInterimPaymentConfig(
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

  const directPayActive = isDirectPayActive(interimConfig);
  const interim = toPublicInterimPayments(interimConfig);

  return {
    interim,
    directPayActive,
    preferredProvider: directPayActive ? "direct" : null,
  };
}
