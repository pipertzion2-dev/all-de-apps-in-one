import { hasStripeConfigured } from "@/lib/env";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { getUncachableStripeClient } from "@/lib/stripe/client";

export type StripeReadyStatus = {
  configured: boolean;
  verified: boolean;
  checkoutReady: boolean;
  detail: string;
};

/** True only when Stripe keys exist and the API accepts them (account usable for checkout). */
export async function getStripeReadyStatus(): Promise<StripeReadyStatus> {
  await hydratePlatformSecrets();
  const configured = hasStripeConfigured();
  if (!configured) {
    return {
      configured: false,
      verified: false,
      checkoutReady: false,
      detail: "Stripe keys not configured",
    };
  }

  try {
    const stripe = await getUncachableStripeClient();
    await stripe.balance.retrieve();
    return {
      configured: true,
      verified: true,
      checkoutReady: true,
      detail: "Stripe verified — card checkout available",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      configured: true,
      verified: false,
      checkoutReady: false,
      detail: `Stripe keys present but account not ready: ${msg}`,
    };
  }
}
