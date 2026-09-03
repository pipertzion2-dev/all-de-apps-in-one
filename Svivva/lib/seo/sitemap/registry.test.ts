import { describe, expect, it } from "vitest";
import { getStaticSitemapFallback } from "./registry";
import { NATIVE_SVIVVA_TOOLS } from "@/lib/orbit/mini-app-curation";
import { FEATURE_MINI_APPS } from "@/lib/tools/feature-mini-apps";
import { HUB_FEATURE_PATHS } from "@/lib/tools/catalogs/hub-feature-pages";

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

  it("indexes individual hub feature pages with higher priority than hubs", () => {
    const entries = getStaticSitemapFallback();
    const urls = entries.map((e) => e.url);
    expect(HUB_FEATURE_PATHS.length).toBeGreaterThan(50);
    for (const path of HUB_FEATURE_PATHS.slice(0, 20)) {
      expect(urls.some((u) => u.endsWith(path))).toBe(true);
    }
    const password = entries.find((e) =>
      e.url.endsWith("/cyber-security-mini-apps/password-strength"),
    );
    const hub = entries.find((e) => e.url.endsWith("/cyber-security-mini-apps"));
    expect(password?.priority ?? 0).toBeGreaterThan(hub?.priority ?? 0);
  });
});
