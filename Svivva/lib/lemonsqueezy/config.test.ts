import { describe, expect, it } from "vitest";
import {
  isLemonSqueezyActive,
  lemonSqueezyCheckoutCapable,
  mergeLemonSqueezyConfig,
} from "./config";

describe("lemonsqueezy config", () => {
  it("activates with checkout URL only", () => {
    const config = mergeLemonSqueezyConfig({
      checkoutUrlPro: "https://store.lemonsqueezy.com/checkout/buy/abc",
    });
    expect(isLemonSqueezyActive(config)).toBe(true);
    expect(lemonSqueezyCheckoutCapable(config, "pro")).toBe(true);
  });

  it("activates with API + store + variant", () => {
    const config = mergeLemonSqueezyConfig({
      apiKey: "test_key",
      storeId: "1",
      variantIdPro: "2",
    });
    expect(isLemonSqueezyActive(config)).toBe(true);
  });

  it("is inactive when empty", () => {
    expect(isLemonSqueezyActive(mergeLemonSqueezyConfig(null))).toBe(false);
  });
});
