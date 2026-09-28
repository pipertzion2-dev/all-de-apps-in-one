import { describe, expect, it } from "vitest";
import {
  CASHAPP_SUBSCRIPTION_DAYS,
  cashAppRecurringPaymentLink,
  computeCashAppSubscriptionUntil,
} from "./cashapp-recurring";

describe("cashapp recurring", () => {
  const config = {
    cashAppUrlStarter: "https://cash.app/$pipertzion/20",
    cashAppUrlPro: "https://cash.app/$pipertzion/50",
  } as const;

  it("appends subscription memo to payment link", () => {
    const link = cashAppRecurringPaymentLink("starter", config);
    expect(link).toContain("cash.app/$pipertzion/20");
    expect(link).toContain("note=");
  });

  it("extends access by 30 days", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const until = computeCashAppSubscriptionUntil(null, now);
    expect(until.getTime() - now.getTime()).toBe(CASHAPP_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
  });
});
