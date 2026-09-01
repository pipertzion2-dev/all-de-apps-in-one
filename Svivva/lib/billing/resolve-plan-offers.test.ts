import { describe, expect, it } from "vitest";
import { resolveBillingPlanOffers } from "./resolve-plan-offers";

const emptyInterim = {
  stripePaymentLinkStarter: null,
  stripePaymentLinkPro: null,
  stripePaymentLinkEnterprise: null,
  paypalUrlStarter: null,
  paypalUrlPro: null,
  paypalUrl: null,
  venmoUrlStarter: null,
  venmoUrlPro: null,
  venmoUrl: null,
  cashAppUrlStarter: null,
  cashAppUrlPro: null,
  zelleContact: null,
  note: null,
};

describe("resolveBillingPlanOffers", () => {
  it("enables Cash App checkout per tier", () => {
    const plans = resolveBillingPlanOffers({
      interim: {
        ...emptyInterim,
        cashAppUrlStarter: "https://cash.app/$pipertzion/20",
        cashAppUrlPro: "https://cash.app/$pipertzion/50",
      },
    });

    const starter = plans.find((p) => p.tier === "starter");
    const pro = plans.find((p) => p.tier === "pro");
    expect(starter?.checkoutProvider).toBe("cashapp");
    expect(pro?.checkoutProvider).toBe("cashapp");
    expect(starter?.paymentLink).toContain("pipertzion");
  });

  it("ignores Venmo — Cash App is the plan", () => {
    const plans = resolveBillingPlanOffers({
      interim: {
        ...emptyInterim,
        venmoUrlStarter: "https://venmo.com/u/x",
        cashAppUrlStarter: "https://cash.app/$pipertzion/20",
      },
    });
    const starter = plans.find((p) => p.tier === "starter");
    expect(starter?.checkoutProvider).toBe("cashapp");
    expect(starter?.paymentLink).toContain("cash.app");
  });

  it("free tier has no checkout", () => {
    const plans = resolveBillingPlanOffers({ interim: emptyInterim });
    expect(plans.find((p) => p.tier === "free")?.checkoutAvailable).toBe(false);
  });
});
