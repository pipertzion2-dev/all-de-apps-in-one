import { describe, expect, it } from "vitest";
import {
  filterToolsForTrafficDiscovery,
  nativeToolsAsDiscoverable,
  nativeToolSitemapPaths,
  NATIVE_SVIVVA_TOOLS,
} from "./mini-app-curation";
import { FEATURE_MINI_APPS } from "@/lib/tools/feature-mini-apps";

describe("mini-app-curation", () => {
  it("always includes native ZZAI tools", () => {
    const out = filterToolsForTrafficDiscovery([]);
    expect(out.length).toBeGreaterThanOrEqual(NATIVE_SVIVVA_TOOLS.length);
    expect(nativeToolsAsDiscoverable().every((n) => out.some((t) => t.url === n.url))).toBe(true);
  });

  it("registers feature slices as native /tools URLs", () => {
    const paths = nativeToolSitemapPaths();
    for (const app of FEATURE_MINI_APPS) {
      expect(paths).toContain(app.path);
      expect(NATIVE_SVIVVA_TOOLS.some((t) => t.path === app.path && t.name === app.name)).toBe(
        true,
      );
    }
  });

  it("blocks full-product style names", () => {
    const out = filterToolsForTrafficDiscovery([
      {
        name: "Full Stack Production Deploy Suite",
        url: "https://example.com/deploy",
        description: "enterprise",
      },
      { name: "Password Strength Checker", url: "https://example.com/password-checker" },
    ]);
    expect(out.some((t) => t.url.includes("example.com/deploy"))).toBe(false);
  });
});
