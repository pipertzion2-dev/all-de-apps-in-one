import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { validateCheckoutPrice } from "@/lib/stripe/catalog";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getBillingOriginFromRequest } from "@/lib/site-url";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: "Price ID required" }, { status: 400 });
    }

    let tier: string | null = null;

    try {
      const priceResult = await db.execute(sql`
        SELECT pr.id, p.metadata as product_metadata
        FROM stripe.prices pr
        JOIN stripe.products p ON pr.product = p.id
        WHERE pr.id = ${priceId} 
          AND pr.active = true 
          AND p.active = true
      `);

      if (priceResult.rows.length > 0) {
        const priceData = priceResult.rows[0] as any;
        tier = priceData.product_metadata?.tier ?? null;
      }
    } catch {
      /* no synced stripe schema */
    }

    const stripe = await getUncachableStripeClient();

    if (!tier || !["pro", "enterprise"].includes(tier)) {
      const v = await validateCheckoutPrice(stripe, priceId);
      if (!v.ok) {
        return NextResponse.json(
          { error: v.reason === "Price not found" ? "Invalid or inactive price" : v.reason },
          { status: 400 },
        );
      }
      tier = v.tier;
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));

    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      });

      await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, user.id));
      customerId = customer.id;
    }

    const origin = getBillingOriginFromRequest(request);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tier!,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
