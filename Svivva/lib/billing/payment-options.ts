import {
  isInterimPaymentActive,
  mergeInterimPaymentConfig,
  toPublicInterimPayments,
} from "@/lib/interim-payments";
import {
  isLemonSqueezyActive,
  lemonSqueezyCheckoutCapable,
  loadLemonSqueezyConfig,
  mergeLemonSqueezyConfig,
} from "@/lib/lemonsqueezy/config";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";
import { getStripeReadyStatus } from "./stripe-ready";

export type BillingPaymentOptions = {
  stripe: Awaited<ReturnType<typeof getStripeReadyStatus>>;
  lemonSqueezy: {
    active: boolean;
    starter: boolean;
    pro: boolean;
    enterprise: boolean;
  };
  interim: ReturnType<typeof toPublicInterimPayments>;
  /** Best provider for new subscriptions when Stripe is unavailable. */
  preferredProvider: "stripe" | "lemonsqueezy" | "interim" | null;
};

export async function getBillingPaymentOptions(): Promise<BillingPaymentOptions> {
  const row = await getPlatformRuntimeSecretsRow();
  const stripe = await getStripeReadyStatus();

  const lemonConfig = mergeLemonSqueezyConfig(
    row
      ? {
          apiKey: row.lemonSqueezyApiKey,
          storeId: row.lemonSqueezyStoreId,
          variantIdPro: row.lemonSqueezyVariantIdPro,
          variantIdEnterprise: row.lemonSqueezyVariantIdEnterprise,
          webhookSecret: row.lemonSqueezyWebhookSecret,
          checkoutUrlPro: row.lemonSqueezyCheckoutUrlPro,
          checkoutUrlEnterprise: row.lemonSqueezyCheckoutUrlEnterprise,
        }
      : null,
  );

  const interimConfig = mergeInterimPaymentConfig(
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

  const lemonSqueezy = {
    active: isLemonSqueezyActive(lemonConfig),
    starter: lemonSqueezyCheckoutCapable(lemonConfig, "starter"),
    pro: lemonSqueezyCheckoutCapable(lemonConfig, "pro"),
    /** @deprecated use starter — legacy alias */
    enterprise: lemonSqueezyCheckoutCapable(lemonConfig, "starter"),
  };

  const interim = toPublicInterimPayments(interimConfig, {
    checkoutUnavailable: !stripe.checkoutReady && !lemonSqueezy.active,
  });

  let preferredProvider: BillingPaymentOptions["preferredProvider"] = null;
  if (lemonSqueezy.starter || lemonSqueezy.pro) preferredProvider = "lemonsqueezy";
  else if (stripe.checkoutReady) preferredProvider = "stripe";
  else if (isInterimPaymentActive(interimConfig)) preferredProvider = "interim";

  return { stripe, lemonSqueezy, interim, preferredProvider };
}

/** Re-export for admin status panels. */
export { loadLemonSqueezyConfig };
