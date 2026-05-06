import { getUncachableStripeClient } from "./client";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

function idOf(
  ref: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null | undefined
): string | null {
  if (ref == null) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && "id" in ref && typeof ref.id === "string") return ref.id;
  return null;
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string) {
    const stripe = await getUncachableStripeClient();
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = idOf(session.customer);
        const subscriptionId = idOf(session.subscription);

        if (userId && customerId) {
          await db
            .update(users)
            .set({
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            })
            .where(eq(users.id, userId));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = idOf(subscription.customer);
        if (customerId) {
          await db
            .update(users)
            .set({ stripeSubscriptionId: null })
            .where(eq(users.stripeCustomerId, customerId));
        }
        break;
      }
      default:
        break;
    }
  }
}
