import { getSiteUrl } from "@/lib/site-url";
import type { LemonSqueezyConfig } from "./config";

type CheckoutTier = "pro" | "enterprise";

function variantIdForTier(config: LemonSqueezyConfig, tier: CheckoutTier): string | null {
  return tier === "enterprise" ? config.variantIdEnterprise : config.variantIdPro;
}

function directUrlForTier(config: LemonSqueezyConfig, tier: CheckoutTier): string | null {
  return tier === "enterprise" ? config.checkoutUrlEnterprise : config.checkoutUrlPro;
}

function appendCheckoutParams(
  baseUrl: string,
  opts: { userId: string; email?: string | null },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("checkout[custom][user_id]", opts.userId);
  if (opts.email?.trim()) url.searchParams.set("checkout[email]", opts.email.trim());
  url.searchParams.set("checkout[redirect_url]", `${getSiteUrl()}/dashboard/billing?success=1`);
  return url.toString();
}

/** Create a hosted Lemon Squeezy checkout URL for the given tier. */
export async function createLemonSqueezyCheckoutUrl(
  config: LemonSqueezyConfig,
  tier: CheckoutTier,
  opts: { userId: string; email?: string | null },
): Promise<{ url: string; mode: "direct" | "api" }> {
  const direct = directUrlForTier(config, tier);
  if (direct) {
    return { url: appendCheckoutParams(direct, opts), mode: "direct" };
  }

  const variantId = variantIdForTier(config, tier);
  if (!config.apiKey || !config.storeId || !variantId) {
    throw new Error("Lemon Squeezy is not configured for this plan.");
  }

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: { embed: false },
          checkout_data: {
            custom: { user_id: opts.userId },
            email: opts.email?.trim() || undefined,
          },
          product_options: {
            redirect_url: `${getSiteUrl()}/dashboard/billing?success=1`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: config.storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: { attributes?: { url?: string } };
    errors?: Array<{ detail?: string }>;
  };

  if (!res.ok) {
    const detail = json.errors?.[0]?.detail || res.statusText;
    throw new Error(`Lemon Squeezy checkout failed: ${detail}`);
  }

  const url = json.data?.attributes?.url;
  if (!url) throw new Error("Lemon Squeezy did not return a checkout URL.");
  return { url, mode: "api" };
}
