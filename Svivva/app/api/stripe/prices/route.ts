import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { listProductsFromStripeApi } from "@/lib/stripe/catalog";

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active,
        pr.metadata as price_metadata
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY p.id, pr.unit_amount
    `);

    const productsMap = new Map<string, any>();

    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          metadata: row.price_metadata,
        });
      }
    }

    if (productsMap.size > 0) {
      return NextResponse.json({
        products: Array.from(productsMap.values()),
        source: "database",
      });
    }
  } catch (error: any) {
    console.warn(
      "[stripe/prices] stripe.* schema empty or missing — using Stripe API:",
      error?.message,
    );
  }

  try {
    const stripe = await getUncachableStripeClient();
    const { products } = await listProductsFromStripeApi(stripe);
    return NextResponse.json({ products, source: "stripe_api" });
  } catch (error: any) {
    console.error("[stripe/prices] Stripe API fallback failed:", error);
    return NextResponse.json({ products: [], source: "none", error: error?.message });
  }
}
