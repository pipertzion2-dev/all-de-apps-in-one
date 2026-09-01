import { describe, expect, it } from "vitest";
import {
  EASYPEASY_TIERS,
  getEasyPeasyFallbacksForTier,
  getEasyPeasyModelForTier,
  resolveEasyPeasyTierId,
} from "./tiers";

describe("EasyPeasy tiers", () => {
  it("defines standard, balanced, and premium", () => {
    expect(EASYPEASY_TIERS.map((t) => t.id)).toEqual(["standard", "balanced", "premium"]);
  });

  it("maps tier to model", () => {
    expect(getEasyPeasyModelForTier("standard")).toBe("gemini-3-flash");
    expect(getEasyPeasyModelForTier("balanced")).toBe("claude-sonnet-4-6");
    expect(getEasyPeasyModelForTier("premium")).toBe("gpt-5");
  });

  it("falls back unknown tier to standard", () => {
    expect(resolveEasyPeasyTierId("unknown")).toBe("standard");
  });

  it("includes primary model in fallback chain", () => {
    const chain = getEasyPeasyFallbacksForTier("premium");
    expect(chain[0]).toBe("gpt-5");
    expect(chain.length).toBeGreaterThan(1);
  });
});
