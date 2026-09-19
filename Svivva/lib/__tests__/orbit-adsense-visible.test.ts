import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Orbit admin AdSense visibility", () => {
  it("shows AdSense hero and tab on launchpad/orbit before other content", () => {
    const launchpad = readFileSync(
      resolve(__dirname, "../../app/dashboard/launchpad/page.tsx"),
      "utf8",
    );
    expect(launchpad).toContain('| "adsense"');
    expect(launchpad).toContain("OrbitAdsenseSetup");
    expect(launchpad).toContain('data-testid="orbit-adsense-hero"');
    expect(launchpad).toContain('data-testid="orbit-tab-adsense"');
    expect(launchpad).toContain('data-testid="orbit-header-adsense"');
    expect(launchpad).toContain("/dashboard/orbit?tab=adsense");

    // Hero must appear before OneClickLaunch so admins cannot miss it
    const heroIdx = launchpad.indexOf('data-testid="orbit-adsense-hero"');
    const oneClickIdx = launchpad.indexOf("<OrbitOneClickLaunch");
    expect(heroIdx).toBeGreaterThan(-1);
    expect(oneClickIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(oneClickIdx);

    // Only one AdSense tab button (no duplicate buried tabs)
    const tabMatches = launchpad.match(/data-testid="orbit-tab-adsense"/g) ?? [];
    expect(tabMatches).toHaveLength(1);
  });

  it("AdSense setup UI saves to platform secrets", () => {
    const ui = readFileSync(
      resolve(__dirname, "../../components/orbit-adsense-setup.tsx"),
      "utf8",
    );
    expect(ui).toContain("/api/admin/platform-secrets");
    expect(ui).toContain("input-adsense-client");
    expect(ui).toContain("button-save-adsense");
  });
});
