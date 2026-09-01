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
  it("prefers Cash App over Venmo when both exist", () => {
    const plans = resolveBillingPlanOffers({
      interim: {
        ...emptyInterim,
        venmoUrlStarter: "https://venmo.com/u/x",
        cashAppUrlStarter: "https://cash.app/$pipertzion/20",
      },
    });
    const starter = plans.find((p) => p.tier === "starter");
    expect(starter?.checkoutProvider).toBe("cashapp");
  });

  it("enables Venmo checkout per tier", () => {
    const plans = resolveBillingPlanOffers({
      interim: {
        ...emptyInterim,
        venmoUrlStarter: "https://venmo.com/u/starter",
        venmoUrlPro: "https://venmo.com/u/pro",
      },
    });

    const starter = plans.find((p) => p.tier === "starter");
    const pro = plans.find((p) => p.tier === "pro");
    expect(starter?.checkoutProvider).toBe("venmo");
    expect(pro?.checkoutProvider).toBe("venmo");
    expect(starter?.paymentLink).toContain("starter");
    expect(pro?.paymentLink).toContain("pro");
  });

  it("falls back to Cash App when Venmo missing", () => {
    const plans = resolveBillingPlanOffers({
      interim: {
        ...emptyInterim,
        cashAppUrlStarter: "https://cash.app/$tag/20",
      },
    });

    const starter = plans.find((p) => p.tier === "starter");
    expect(starter?.checkoutProvider).toBe("cashapp");
    expect(starter?.checkoutAvailable).toBe(true);
  });

  it("free tier has no checkout", () => {
    const plans = resolveBillingPlanOffers({ interim: emptyInterim });
    const free = plans.find((p) => p.tier === "free");
    expect(free?.checkoutAvailable).toBe(false);
  });
});
