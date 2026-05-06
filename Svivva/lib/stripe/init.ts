import { getUncachableStripeClient } from "./client";

export async function initStripe() {
  try {
    await getUncachableStripeClient();
    console.log("[stripe] Stripe client initialized");
  } catch (err: any) {
    console.warn("[stripe] Stripe init skipped:", err?.message ?? err);
  }
}
