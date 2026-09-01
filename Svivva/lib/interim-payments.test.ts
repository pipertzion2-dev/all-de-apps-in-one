import { describe, expect, it } from "vitest";
import {
  isInterimPaymentActive,
  mergeInterimPaymentConfig,
  toPublicInterimPayments,
} from "./interim-payments";

describe("interim-payments", () => {
  it("merges db over env", () => {
    const prev = process.env.INTERIM_PAYPAL_URL;
    process.env.INTERIM_PAYPAL_URL = "https://paypal.me/env";
    const config = mergeInterimPaymentConfig({
      stripePaymentLinkPro: "https://buy.stripe.com/test_pro",
      paypalUrl: null,
    });
    expect(config.stripePaymentLinkPro).toBe("https://buy.stripe.com/test_pro");
    expect(config.paypalUrl).toBe("https://paypal.me/env");
    if (prev === undefined) delete process.env.INTERIM_PAYPAL_URL;
    else process.env.INTERIM_PAYPAL_URL = prev;
  });

  it("detects active when any link exists", () => {
    expect(isInterimPaymentActive(mergeInterimPaymentConfig(null))).toBe(false);
    expect(
      isInterimPaymentActive(
        mergeInterimPaymentConfig({ stripePaymentLinkPro: "https://buy.stripe.com/x" }),
      ),
    ).toBe(true);
  });

  it("public payload includes default note", () => {
    const pub = toPublicInterimPayments(
      mergeInterimPaymentConfig({ stripePaymentLinkPro: "https://buy.stripe.com/x" }),
    );
    expect(pub.active).toBe(true);
    expect(pub.note).toContain("hello@zzaizzai.com");
  });
});
