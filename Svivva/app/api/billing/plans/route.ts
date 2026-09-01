import { NextResponse } from "next/server";
import { getBillingPaymentOptions } from "@/lib/billing/payment-options";
import { resolveBillingPlanOffers } from "@/lib/billing/resolve-plan-offers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { listProductsFromStripeApi } from "@/lib/stripe/catalog";

async function loadStripeProducts() {
  try {
    const result = await db.execute(sql`
      SELECT 
        p.name as product_name,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.recurring
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY p.id, pr.unit_amount
    `);

    const productsMap = new Map<
      string,
      {
        name: string;
        metadata: Record<string, string>;
        prices: { id: string; unitAmount: number | null; recurring: { interval: string } | null }[];
      }
    >();

    for (const row of result.rows as {
      product_name: string;
      product_metadata: Record<string, string>;
      price_id: string | null;
      unit_amount: number | null;
      recurring: { interval: string } | null;
    }[]) {
      const key = row.product_name;
      if (!productsMap.has(key)) {
        productsMap.set(key, {
          name: row.product_name,
          metadata: row.product_metadata ?? {},
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(key)!.prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          recurring: row.recurring,
        });
      }
    }

    if (productsMap.size > 0) return Array.from(productsMap.values());
  } catch {
    /* stripe schema optional */
  }

  try {
    const stripe = await getUncachableStripeClient();
    const { products } = await listProductsFromStripeApi(stripe);
    return products.map((p) => ({
      name: p.name,
      metadata: Object.fromEntries(
        Object.entries(p.metadata).map(([k, v]) => [k, String(v ?? "")]),
      ),
      prices: p.prices.map((pr) => ({
        id: pr.id,
        unitAmount: pr.unitAmount,
        recurring: pr.recurring ? { interval: pr.recurring.interval } : null,
      })),
    }));
  } catch {
    return [];
  }
}

/** Public plan catalog with live checkout flags ($20 Starter, $50 Pro). */
export async function GET() {
  try {
    const paymentOptions = await getBillingPaymentOptions();
    const stripeProducts = await loadStripeProducts();

    const plans = resolveBillingPlanOffers({
      stripeProducts,
      interim: {
        stripePaymentLinkStarter: paymentOptions.interim.stripePaymentLinkStarter ?? null,
        stripePaymentLinkPro: paymentOptions.interim.stripePaymentLinkPro,
        stripePaymentLinkEnterprise: paymentOptions.interim.stripePaymentLinkEnterprise,
        paypalUrl: paymentOptions.interim.paypalUrl,
        venmoUrl: paymentOptions.interim.venmoUrl,
        note: paymentOptions.interim.note,
      },
      stripeCheckoutReady: paymentOptions.stripe.checkoutReady,
      lemonStarter: paymentOptions.lemonSqueezy.starter,
      lemonPro: paymentOptions.lemonSqueezy.pro,
    });

    return NextResponse.json({
      plans,
      paymentOptions: {
        stripe: paymentOptions.stripe,
        lemonSqueezy: paymentOptions.lemonSqueezy,
        interimActive: paymentOptions.interim.active,
        preferredProvider: paymentOptions.preferredProvider,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
