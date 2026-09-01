import { describe, expect, it } from "vitest";
import { resolveBillingPlanOffers } from "./resolve-plan-offers";

describe("resolveBillingPlanOffers", () => {
  it("prefers Lemon Squeezy when configured", () => {
    const plans = resolveBillingPlanOffers({
      stripeProducts: [],
      interim: {
        stripePaymentLinkStarter: null,
        stripePaymentLinkPro: null,
        stripePaymentLinkEnterprise: null,
        paypalUrl: null,
        venmoUrl: null,
        note: null,
      },
      stripeCheckoutReady: true,
      lemonStarter: true,
      lemonPro: true,
    });

    const starter = plans.find((p) => p.tier === "starter");
    const pro = plans.find((p) => p.tier === "pro");
    expect(starter?.checkoutProvider).toBe("lemonsqueezy");
    expect(pro?.checkoutProvider).toBe("lemonsqueezy");
    expect(starter?.checkoutAvailable).toBe(true);
  });

  it("enables checkout when payment links exist", () => {
    const plans = resolveBillingPlanOffers({
      stripeProducts: [],
      interim: {
        stripePaymentLinkStarter: "https://buy.stripe.com/starter",
        stripePaymentLinkPro: "https://buy.stripe.com/pro",
        stripePaymentLinkEnterprise: "https://buy.stripe.com/starter",
        paypalUrl: null,
        venmoUrl: null,
        note: null,
      },
      stripeCheckoutReady: false,
    });

    const starter = plans.find((p) => p.tier === "starter");
    expect(starter?.checkoutProvider).toBe("link");
    expect(starter?.paymentLink).toContain("starter");
  });
});
