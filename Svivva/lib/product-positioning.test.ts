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
  it("treats platform desk modules as beta (Klean Sneaks is the GA wedge)", () => {
    expect(CORE_PLATFORM_FEATURE_IDS.size).toBe(0);
    expect(isCorePlatformFeatureId("hybridization")).toBe(false);
    expect(isCorePlatformFeatureId("api-builder")).toBe(false);
    expect(isBetaPlatformFeatureId("api-builder")).toBe(true);
    expect(isBetaPlatformFeatureId("orbit")).toBe(true);
  });

  it("marks public beta routes", () => {
    expect(isBetaHref("/seeds")).toBe(true);
    expect(isBetaHref("/orbit")).toBe(true);
    expect(isBetaHref("/play")).toBe(true);
    expect(isBetaHref("/clean-sneaks")).toBe(false);
    expect(isBetaHref("/dashboard/hybrid-lab")).toBe(true);
    expect(isBetaHref("/dashboard/api-builder")).toBe(true);
    expect(isBetaHref("/dashboard/projects/abc")).toBe(true);
    expect(isBetaHref("/dashboard/pulse")).toBe(true);
    expect(isBetaHref("/lp/ai-api-builder")).toBe(true);
  });

  it("shows beta banner on desk modules but not homepage or game", () => {
    expect(isBetaSurfacePath("/")).toBe(false);
    expect(isBetaSurfacePath("/clean-sneaks")).toBe(false);
    expect(isBetaSurfacePath("/dashboard/hybrid-lab")).toBe(true);
    expect(isBetaSurfacePath("/dashboard/projects/abc")).toBe(true);
    expect(isBetaSurfacePath("/dashboard/orbit")).toBe(true);
    expect(isBetaSurfacePath("/seeds")).toBe(true);
  });

  it("uses the protection tagline", () => {
    expect(PRODUCT_TAGLINE).toMatch(/Rest assured/i);
  });
});
