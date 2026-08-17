import { describe, expect, it } from "vitest";
import { getStaticSitemapFallback } from "./registry";
import { NATIVE_SVIVVA_TOOLS } from "@/lib/orbit/mini-app-curation";
import { FEATURE_MINI_APPS } from "@/lib/tools/feature-mini-apps";

describe("sitemap native mini-apps", () => {
  it("indexes working /tools slices for IndexNow", () => {
    const urls = getStaticSitemapFallback().map((e) => e.url);
    for (const tool of NATIVE_SVIVVA_TOOLS) {
      expect(urls.some((u) => u.endsWith(tool.path))).toBe(true);
    }
    for (const app of FEATURE_MINI_APPS) {
      const entry = getStaticSitemapFallback().find((e) => e.url.endsWith(app.path));
      expect(entry?.chunk).toBe("tools");
    }
  });
});
