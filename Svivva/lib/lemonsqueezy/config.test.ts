import { describe, expect, it } from "vitest";
import {
  isLemonSqueezyActive,
  lemonSqueezyCheckoutCapable,
  mergeLemonSqueezyConfig,
} from "./config";

describe("lemonsqueezy config", () => {
  it("activates with Pro checkout URL only", () => {
    const config = mergeLemonSqueezyConfig({
      checkoutUrlPro: "https://store.lemonsqueezy.com/checkout/buy/pro",
    });
    expect(isLemonSqueezyActive(config)).toBe(true);
    expect(lemonSqueezyCheckoutCapable(config, "pro")).toBe(true);
    expect(lemonSqueezyCheckoutCapable(config, "starter")).toBe(false);
  });

  it("activates with Starter ($20) checkout URL", () => {
    const config = mergeLemonSqueezyConfig({
      checkoutUrlEnterprise: "https://store.lemonsqueezy.com/checkout/buy/starter",
    });
    expect(lemonSqueezyCheckoutCapable(config, "starter")).toBe(true);
    expect(lemonSqueezyCheckoutCapable(config, "enterprise")).toBe(true);
  });

  it("activates with API + store + both variants", () => {
    const config = mergeLemonSqueezyConfig({
      apiKey: "test_key",
      storeId: "1",
      variantIdPro: "2",
      variantIdEnterprise: "3",
    });
    expect(isLemonSqueezyActive(config)).toBe(true);
    expect(lemonSqueezyCheckoutCapable(config, "starter")).toBe(true);
    expect(lemonSqueezyCheckoutCapable(config, "pro")).toBe(true);
  });

  it("is inactive when empty", () => {
    expect(isLemonSqueezyActive(mergeLemonSqueezyConfig(null))).toBe(false);
  });
});
