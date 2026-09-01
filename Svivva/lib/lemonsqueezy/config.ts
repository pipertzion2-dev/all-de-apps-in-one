import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

export type LemonSqueezyConfig = {
  apiKey: string | null;
  storeId: string | null;
  variantIdPro: string | null;
  variantIdEnterprise: string | null;
  webhookSecret: string | null;
  /** Direct checkout URL override when API checkout is not used. */
  checkoutUrlPro: string | null;
  checkoutUrlEnterprise: string | null;
};

function trim(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function trimUrl(v: string | null | undefined): string | null {
  const t = trim(v);
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return null;
  return t;
}

function fromEnv(): LemonSqueezyConfig {
  return {
    apiKey: trim(process.env.LEMON_SQUEEZY_API_KEY),
    storeId: trim(process.env.LEMON_SQUEEZY_STORE_ID),
    variantIdPro: trim(process.env.LEMON_SQUEEZY_VARIANT_ID_PRO),
    variantIdEnterprise: trim(process.env.LEMON_SQUEEZY_VARIANT_ID_ENTERPRISE),
    webhookSecret: trim(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET),
    checkoutUrlPro: trimUrl(process.env.LEMON_SQUEEZY_CHECKOUT_URL_PRO),
    checkoutUrlEnterprise: trimUrl(process.env.LEMON_SQUEEZY_CHECKOUT_URL_ENTERPRISE),
  };
}

export function mergeLemonSqueezyConfig(
  db: Partial<LemonSqueezyConfig> | null | undefined,
): LemonSqueezyConfig {
  const env = fromEnv();
  return {
    apiKey: trim(db?.apiKey) ?? env.apiKey,
    storeId: trim(db?.storeId) ?? env.storeId,
    variantIdPro: trim(db?.variantIdPro) ?? env.variantIdPro,
    variantIdEnterprise: trim(db?.variantIdEnterprise) ?? env.variantIdEnterprise,
    webhookSecret: trim(db?.webhookSecret) ?? env.webhookSecret,
    checkoutUrlPro: trimUrl(db?.checkoutUrlPro) ?? env.checkoutUrlPro,
    checkoutUrlEnterprise: trimUrl(db?.checkoutUrlEnterprise) ?? env.checkoutUrlEnterprise,
  };
}

export async function loadLemonSqueezyConfig(): Promise<LemonSqueezyConfig> {
  const row = await getPlatformRuntimeSecretsRow();
  return mergeLemonSqueezyConfig(
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
}

export function isLemonSqueezyActive(config: LemonSqueezyConfig): boolean {
  const hasApiCheckout = Boolean(config.apiKey && config.storeId && config.variantIdPro);
  const hasUrlCheckout = Boolean(config.checkoutUrlPro);
  return hasApiCheckout || hasUrlCheckout;
}

export function lemonSqueezyCheckoutCapable(config: LemonSqueezyConfig, tier: "pro" | "enterprise") {
  if (tier === "pro") {
    return Boolean(
      config.checkoutUrlPro || (config.apiKey && config.storeId && config.variantIdPro),
    );
  }
  return Boolean(
    config.checkoutUrlEnterprise ||
      (config.apiKey && config.storeId && config.variantIdEnterprise),
  );
}
