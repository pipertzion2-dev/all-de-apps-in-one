import type Stripe from "stripe";
import { getUncachableStripeClient } from "./client";

export type BillingTier = "pro" | "enterprise";

/** Validate a price for hosted checkout: active price + product with tier metadata. */
export async function validateCheckoutPrice(
  stripe: Stripe,
  priceId: string
): Promise<{ ok: true; tier: BillingTier } | { ok: false; reason: string }> {
  let price: Stripe.Price;
  try {
    price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  } catch {
    return { ok: false, reason: "Price not found" };
  }
  if (!price.active) return { ok: false, reason: "Price inactive" };

  const product = price.product;
  if (typeof product === "string" || product.deleted) {
    return { ok: false, reason: "Invalid product" };
  }
  if (!product.active) return { ok: false, reason: "Product inactive" };

  const tier = product.metadata?.tier;
  if (tier !== "pro" && tier !== "enterprise") {
    return { ok: false, reason: "Product missing metadata.tier (pro | enterprise)" };
  }
  return { ok: true, tier };
}

/** Same shape as /api/stripe/prices consumers (billing + checkout pages). */
export async function listProductsFromStripeApi(stripe: Stripe) {
  const { data: products } = await stripe.products.list({ active: true, limit: 100 });

  const out: {
    id: string;
    name: string;
    description: string | null;
    metadata: Stripe.Metadata;
    prices: {
      id: string;
      unitAmount: number | null;
      currency: string;
      recurring: Stripe.Price.Recurring | null;
      metadata: Stripe.Metadata;
    }[];
  }[] = [];

  for (const p of products) {
    const { data: prices } = await stripe.prices.list({
      product: p.id,
      active: true,
      limit: 20,
    });
    out.push({
      id: p.id,
      name: p.name,
      description: p.description,
      metadata: p.metadata,
      prices: prices.map((pr) => ({
        id: pr.id,
        unitAmount: pr.unit_amount,
        currency: pr.currency,
        recurring: pr.recurring,
        metadata: pr.metadata,
      })),
    });
  }

  return { products: out };
}

export async function getSubscriptionPlanFromStripe(
  stripe: Stripe,
  subscriptionId: string
): Promise<{
  subscription: {
    id: string;
    status: Stripe.Subscription.Status;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  };
  plan: "free" | BillingTier;
} | null> {
  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });
  } catch {
    return null;
  }

  const item = sub.items.data[0];
  const price = item?.price;
  const periodEnd = sub.current_period_end ?? null;

  if (!price) {
    return {
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      plan: "free",
    };
  }

  const product = price.product;
  const productObj = typeof product === "object" && product && !product.deleted ? product : null;
  const tierMeta = productObj?.metadata?.tier;

  let plan: "free" | BillingTier = "free";
  if (sub.status === "active" || sub.status === "trialing") {
    if (tierMeta === "enterprise") plan = "enterprise";
    else if (tierMeta === "pro") plan = "pro";
  }

  return {
    subscription: {
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    plan,
  };
}
