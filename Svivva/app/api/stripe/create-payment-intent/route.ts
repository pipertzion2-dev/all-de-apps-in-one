import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, tier } = await request.json();

    if (!priceId || !tier) {
      return NextResponse.json({ error: "Price ID and tier required" }, { status: 400 });
    }

    const stripe = await getUncachableStripeClient();

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

    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user.id, tier },
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent;

    if (!paymentIntent?.client_secret) {
      return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      amount,
    });
  } catch (error: any) {
    console.error("Create payment intent error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 },
    );
  }
}
