import { describe, expect, it } from "vitest";
import {
  filterToolsForTrafficDiscovery,
  nativeToolsAsDiscoverable,
  NATIVE_SVIVVA_TOOLS,
} from "./mini-app-curation";

describe("mini-app-curation", () => {
  it("always includes native Svivva tools", () => {
    const out = filterToolsForTrafficDiscovery([]);
    expect(out.length).toBeGreaterThanOrEqual(NATIVE_SVIVVA_TOOLS.length);
    expect(nativeToolsAsDiscoverable().every((n) => out.some((t) => t.url === n.url))).toBe(true);
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
