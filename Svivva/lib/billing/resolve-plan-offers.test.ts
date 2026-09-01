import { describe, expect, it } from "vitest";
import { resolveBillingPlanOffers } from "./resolve-plan-offers";

describe("resolveBillingPlanOffers", () => {
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
    const pro = plans.find((p) => p.tier === "pro");
    expect(starter?.checkoutAvailable).toBe(true);
    expect(starter?.paymentLink).toContain("starter");
    expect(pro?.checkoutAvailable).toBe(true);
    expect(pro?.priceLabel).toBe("$50");
  });
});
