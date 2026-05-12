import Stripe from "stripe";

export function hasCompleteStripeEnvKeys(): boolean {
  return !!getEnvStripeKeys();
}

function getEnvStripeKeys(): { publishableKey: string; secretKey: string } | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (secretKey && publishableKey) {
    return { publishableKey, secretKey };
  }
  return null;
}

async function getCredentials() {
  const fromEnv = getEnvStripeKeys();
  if (fromEnv) return fromEnv;
  throw new Error(
    "Stripe: set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) in Vercel environment variables.",
  );
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil" as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}
