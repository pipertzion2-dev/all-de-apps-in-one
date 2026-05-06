import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { getSubscriptionPlanFromStripe } from "@/lib/stripe/catalog";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ subscription: null, plan: "free" });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));

    if (!dbUser?.stripeSubscriptionId) {
      return NextResponse.json({ subscription: null, plan: "free" });
    }

    try {
      const result = await db.execute(sql`
        SELECT 
          s.*,
          p.name as product_name,
          p.metadata as product_metadata
        FROM stripe.subscriptions s
        LEFT JOIN stripe.products p ON s.metadata->>'product_id' = p.id
        WHERE s.id = ${dbUser.stripeSubscriptionId}
      `);

      const subscription = result.rows[0] as any;

      if (subscription?.id) {
        let plan: "free" | "pro" | "enterprise" = "free";
        if (subscription.status === "active" || subscription.status === "trialing") {
          const productMeta = subscription.product_metadata;
          if (productMeta?.tier === "enterprise") plan = "enterprise";
          else if (productMeta?.tier === "pro") plan = "pro";
        }

        return NextResponse.json({
          subscription: {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          plan,
          source: "database",
        });
      }
    } catch (e) {
      console.warn("[stripe/subscription] DB stripe.subscriptions miss — using Stripe API");
    }

    const stripe = await getUncachableStripeClient();
    const api = await getSubscriptionPlanFromStripe(stripe, dbUser.stripeSubscriptionId);
    if (!api) {
      return NextResponse.json({ subscription: null, plan: "free", source: "stripe_api" });
    }

    return NextResponse.json({
      subscription: api.subscription,
      plan: api.plan,
      source: "stripe_api",
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ subscription: null, plan: "free" });
  }
}
