import { describe, expect, it } from "vitest";
import {
  CORE_PLATFORM_FEATURE_IDS,
  isBetaHref,
  isBetaPlatformFeatureId,
  isBetaSurfacePath,
  isCorePlatformFeatureId,
  PRODUCT_HERO_HEADLINE,
  PRODUCT_TAGLINE,
} from "./product-positioning";

describe("product-positioning", () => {
  it("treats platform desk modules as beta (Play is the GA wedge)", () => {
    expect(CORE_PLATFORM_FEATURE_IDS.size).toBe(0);
    expect(isCorePlatformFeatureId("hybridization")).toBe(false);
    expect(isCorePlatformFeatureId("api-builder")).toBe(false);
    expect(isBetaPlatformFeatureId("api-builder")).toBe(true);
    expect(isBetaPlatformFeatureId("orbit")).toBe(true);
  });

  it("marks public beta routes", () => {
    expect(isBetaHref("/seeds")).toBe(true);
    expect(isBetaHref("/orbit")).toBe(true);
    expect(isBetaHref("/play")).toBe(false);
    expect(isBetaHref("/the-moves-like")).toBe(false);
    expect(isBetaHref("/poor-man-protection")).toBe(false);
    expect(isBetaHref("/dashboard/poor-man-protection")).toBe(false);
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
    expect(isBetaSurfacePath("/the-moves-like")).toBe(false);
    expect(isBetaSurfacePath("/poor-man-protection")).toBe(false);
    expect(isBetaSurfacePath("/dashboard/hybrid-lab")).toBe(true);
    expect(isBetaSurfacePath("/dashboard/projects/abc")).toBe(true);
    expect(isBetaSurfacePath("/dashboard/orbit")).toBe(true);
    expect(isBetaSurfacePath("/seeds")).toBe(true);
  });

  it("uses a short seal/pack tagline", () => {
    expect(PRODUCT_TAGLINE).toMatch(/court-ready pack|timestamp|hash/i);
    expect(PRODUCT_TAGLINE.toLowerCase()).not.toContain("poor man protection");
  });

  it("leads the homepage with a single focused thesis", () => {
    expect(PRODUCT_HERO_HEADLINE.length).toBeGreaterThan(10);
    expect(PRODUCT_HERO_HEADLINE).toMatch(/Seal what you made/i);
    expect(PRODUCT_HERO_HEADLINE.toLowerCase()).not.toContain("poor man protection");
  });
});
