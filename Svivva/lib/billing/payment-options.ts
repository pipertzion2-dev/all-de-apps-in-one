import {
  getCashAppTag,
  isCashAppPlansActive,
  mergeInterimPaymentConfig,
  toPublicInterimPayments,
} from "@/lib/interim-payments";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

export type BillingPaymentOptions = {
  interim: ReturnType<typeof toPublicInterimPayments>;
  cashAppPlansActive: boolean;
  cashAppTag: string;
  preferredProvider: "cashapp" | null;
};

export async function getBillingPaymentOptions(): Promise<BillingPaymentOptions> {
  const row = await getPlatformRuntimeSecretsRow();

  const interimConfig = mergeInterimPaymentConfig(
    row
      ? {
          cashAppUrlStarter: row.interimCashAppUrlStarter,
          cashAppUrlPro: row.interimCashAppUrlPro,
          note: row.interimPaymentNote,
        }
      : null,
  );

  const cashAppPlansActive = isCashAppPlansActive(interimConfig);
  const interim = toPublicInterimPayments(interimConfig);

  return {
    interim,
    cashAppPlansActive,
    cashAppTag: getCashAppTag(interimConfig),
    preferredProvider: cashAppPlansActive ? "cashapp" : null,
  };
}
