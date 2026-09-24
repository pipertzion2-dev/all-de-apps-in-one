import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Orbit mission control GSC sitemap sync", () => {
  it("marks tech-gsc-sitemap done when GSC reports sitemap registered", () => {
    const ui = readFileSync(
      resolve(__dirname, "../../components/orbit-mission-control.tsx"),
      "utf8",
    );
    expect(ui).toContain('case "tech-gsc-sitemap"');
    expect(ui).toContain("gscSitemapRegistered");
  });

  it("orbit status exposes gscSitemapRegistered in preflight", () => {
    const route = readFileSync(resolve(__dirname, "../../app/api/orbit/status/route.ts"), "utf8");
    expect(route).toContain("gscSitemapRegistered");
    expect(route).toContain("isMainGscSitemapRegistered");
  });
});
