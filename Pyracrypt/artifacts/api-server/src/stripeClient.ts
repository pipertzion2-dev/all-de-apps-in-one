import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  return key;
}

export async function getUncachableStripeClient() {
  return new Stripe(getSecretKey(), { apiVersion: "2025-08-27.basil" as any });
}

export async function getStripePublishableKey() {
  const secretKey = getSecretKey();
  const isLive = secretKey.startsWith("sk_live_");
  return isLive
    ? process.env.STRIPE_PUBLISHABLE_KEY || ""
    : process.env.STRIPE_PUBLISHABLE_KEY || "";
}

export async function getStripeSecretKey() {
  return getSecretKey();
}

let stripeSync: InstanceType<typeof StripeSync> | null = null;

export async function getStripeSync() {
  if (!stripeSync) {
    stripeSync = new StripeSync({
      poolConfig: { connectionString: process.env.DATABASE_URL!, max: 2 },
      stripeSecretKey: getSecretKey(),
    });
  }
  return stripeSync;
}
