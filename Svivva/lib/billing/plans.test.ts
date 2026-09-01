import { describe, expect, it } from "vitest";
import { BILLING_PLANS, envPriceIdForTier, isPaidBillingTier } from "./plans";

describe("billing plans", () => {
  it("defines free, starter ($20), and pro ($50)", () => {
    expect(BILLING_PLANS.map((p) => p.tier)).toEqual(["free", "starter", "pro"]);
    expect(BILLING_PLANS.find((p) => p.tier === "starter")?.amountCents).toBe(2000);
    expect(BILLING_PLANS.find((p) => p.tier === "pro")?.amountCents).toBe(5000);
  });

  it("reads env price ids", () => {
    process.env.STRIPE_PRICE_ID_STARTER = "price_starter_test";
    expect(envPriceIdForTier("starter")).toBe("price_starter_test");
    delete process.env.STRIPE_PRICE_ID_STARTER;
  });

  it("detects paid tiers", () => {
    expect(isPaidBillingTier("starter")).toBe(true);
    expect(isPaidBillingTier("pro")).toBe(true);
    expect(isPaidBillingTier("free")).toBe(false);
  });
});
