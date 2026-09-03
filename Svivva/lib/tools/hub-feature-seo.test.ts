import { describe, expect, it } from "vitest";
import {
  HUB_FEATURE_PAGES,
  getCyberFeatureSitemapPaths,
  getAiHubFeatureSitemapPaths,
} from "@/lib/tools/catalogs/hub-feature-pages";
import {
  allHubFeaturesPassQualityGate,
  buildHubFeatureHtml,
  hubFeaturePassesQualityGate,
} from "@/lib/tools/hub-feature-seo";

describe("hub feature SEO pages", () => {
  it("indexes cyber + AI feature URLs (not generic /apps)", () => {
    expect(HUB_FEATURE_PAGES.length).toBeGreaterThanOrEqual(100);
    expect(getCyberFeatureSitemapPaths().every((p) => p.startsWith("/cyber-security-mini-apps/"))).toBe(
      true,
    );
    expect(getAiHubFeatureSitemapPaths().every((p) => p.startsWith("/ai-tools-hub/"))).toBe(true);
    expect(HUB_FEATURE_PAGES.some((p) => p.path === "/apps")).toBe(false);
    expect(HUB_FEATURE_PAGES.every((p) => p.keyword.trim().length > 0)).toBe(true);
  });

  it("builds keyword-rich bodies that pass the quality gate", () => {
    const sample = HUB_FEATURE_PAGES[0];
    const html = buildHubFeatureHtml(sample);
    expect(html).toContain(sample.keyword);
    expect(html).toContain("[FAQ_JSON]");
    expect(hubFeaturePassesQualityGate(sample)).toBe(true);
    expect(allHubFeaturesPassQualityGate()).toBe(true);
  });
});
