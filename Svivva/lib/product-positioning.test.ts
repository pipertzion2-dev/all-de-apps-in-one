import { describe, expect, it } from "vitest";
import {
  CORE_PLATFORM_FEATURE_IDS,
  isBetaHref,
  isBetaPlatformFeatureId,
  isBetaSurfacePath,
  isCorePlatformFeatureId,
  PRODUCT_TAGLINE,
} from "./product-positioning";

describe("product-positioning", () => {
  it("defines GA platform channels", () => {
    expect(CORE_PLATFORM_FEATURE_IDS.has("api-builder")).toBe(true);
    expect(CORE_PLATFORM_FEATURE_IDS.has("projects")).toBe(true);
    expect(CORE_PLATFORM_FEATURE_IDS.has("pulse")).toBe(true);
    expect(isCorePlatformFeatureId("seeds")).toBe(false);
    expect(isBetaPlatformFeatureId("orbit")).toBe(true);
  });

  it("marks public beta routes", () => {
    expect(isBetaHref("/seeds")).toBe(true);
    expect(isBetaHref("/orbit")).toBe(true);
    expect(isBetaHref("/play")).toBe(true);
    expect(isBetaHref("/clean-sneaks")).toBe(false);
    expect(isBetaHref("/dashboard/api-builder")).toBe(false);
    expect(isBetaHref("/dashboard/orbit")).toBe(true);
  });

  it("shows beta banner only on non-core surfaces", () => {
    expect(isBetaSurfacePath("/")).toBe(false);
    expect(isBetaSurfacePath("/clean-sneaks")).toBe(false);
    expect(isBetaSurfacePath("/dashboard/projects/abc")).toBe(false);
    expect(isBetaSurfacePath("/dashboard/orbit")).toBe(true);
    expect(isBetaSurfacePath("/seeds")).toBe(true);
  });

  it("uses the new tagline", () => {
    expect(PRODUCT_TAGLINE).toMatch(/Klean/i);
  });
});
