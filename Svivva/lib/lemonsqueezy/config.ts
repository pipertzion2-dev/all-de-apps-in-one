import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

/** Lemon Squeezy plan keys — `enterprise` is a legacy alias for Starter ($20). */
export type LemonSqueezyCheckoutTier = "starter" | "pro" | "enterprise";

export type LemonSqueezyConfig = {
  apiKey: string | null;
  storeId: string | null;
  /** Pro ($50/mo) variant */
  variantIdPro: string | null;
  /** Starter ($20/mo) variant — stored as enterprise in DB for backward compatibility */
  variantIdStarter: string | null;
  webhookSecret: string | null;
  checkoutUrlPro: string | null;
  checkoutUrlStarter: string | null;
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
  const starterVariant =
    trim(process.env.LEMON_SQUEEZY_VARIANT_ID_STARTER) ??
    trim(process.env.LEMON_SQUEEZY_VARIANT_ID_ENTERPRISE);
  const starterUrl =
    trimUrl(process.env.LEMON_SQUEEZY_CHECKOUT_URL_STARTER) ??
    trimUrl(process.env.LEMON_SQUEEZY_CHECKOUT_URL_ENTERPRISE);

  return {
    apiKey: trim(process.env.LEMON_SQUEEZY_API_KEY),
    storeId: trim(process.env.LEMON_SQUEEZY_STORE_ID),
    variantIdPro: trim(process.env.LEMON_SQUEEZY_VARIANT_ID_PRO),
    variantIdStarter: starterVariant,
    webhookSecret: trim(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET),
    checkoutUrlPro: trimUrl(process.env.LEMON_SQUEEZY_CHECKOUT_URL_PRO),
    checkoutUrlStarter: starterUrl,
  };
}

export function normalizeLemonSqueezyTier(tier: LemonSqueezyCheckoutTier): "starter" | "pro" {
  return tier === "pro" ? "pro" : "starter";
}

export function mergeLemonSqueezyConfig(
  db:
    | Partial<{
        apiKey: string | null;
        storeId: string | null;
        variantIdPro: string | null;
        variantIdEnterprise: string | null;
        variantIdStarter: string | null;
        webhookSecret: string | null;
        checkoutUrlPro: string | null;
        checkoutUrlEnterprise: string | null;
        checkoutUrlStarter: string | null;
      }>
    | null
    | undefined,
): LemonSqueezyConfig {
  const env = fromEnv();
  const starterVariant =
    trim(db?.variantIdStarter) ?? trim(db?.variantIdEnterprise) ?? env.variantIdStarter;
  const starterUrl =
    trimUrl(db?.checkoutUrlStarter) ?? trimUrl(db?.checkoutUrlEnterprise) ?? env.checkoutUrlStarter;

  return {
    apiKey: trim(db?.apiKey) ?? env.apiKey,
    storeId: trim(db?.storeId) ?? env.storeId,
    variantIdPro: trim(db?.variantIdPro) ?? env.variantIdPro,
    variantIdStarter: starterVariant,
    webhookSecret: trim(db?.webhookSecret) ?? env.webhookSecret,
    checkoutUrlPro: trimUrl(db?.checkoutUrlPro) ?? env.checkoutUrlPro,
    checkoutUrlStarter: starterUrl,
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

export function lemonSqueezyCheckoutCapable(
  config: LemonSqueezyConfig,
  tier: LemonSqueezyCheckoutTier,
): boolean {
  const normalized = normalizeLemonSqueezyTier(tier);
  if (normalized === "pro") {
    return Boolean(
      config.checkoutUrlPro || (config.apiKey && config.storeId && config.variantIdPro),
    );
  }
  return Boolean(
    config.checkoutUrlStarter || (config.apiKey && config.storeId && config.variantIdStarter),
  );
}

export function isLemonSqueezyActive(config: LemonSqueezyConfig): boolean {
  return (
    lemonSqueezyCheckoutCapable(config, "starter") || lemonSqueezyCheckoutCapable(config, "pro")
  );
}
