import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { HOMEPAGE_SECTIONS, showHomepageSection } from "@/lib/homepage-layout";

describe("homepage-layout", () => {
  it("keeps the homepage compact by default", () => {
    // OaaS hub mounts inside HomepageCubePanel (scrollSnap), not the legacy branch.
    expect(HOMEPAGE_SECTIONS.oaasHub).toBe(false);
    expect(HOMEPAGE_SECTIONS.features).toBe(false);
    expect(HOMEPAGE_SECTIONS.pricing).toBe(false);
    expect(HOMEPAGE_SECTIONS.cleanSneaks).toBe(false);
    expect(HOMEPAGE_SECTIONS.founderStory).toBe(false);
  });

  it("keeps the compact scrollSnap homepage path enabled", () => {
    expect(showHomepageSection("scrollSnap")).toBe(true);
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(pageSrc).toContain("data-homepage-native-scroll");
    expect(pageSrc).not.toContain("HomepageFlipStack");
  });

  it("keeps intro minimal and a clean main nav", () => {
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(pageSrc).toContain("button-skip-intro");
    expect(pageSrc).toContain('data-testid="homepage-main-nav"');
    expect(pageSrc).toContain('data-testid="link-home-brand"');
    expect(pageSrc).toContain('data-testid="link-nav-poor-man-protection"');
    expect(pageSrc).toContain('data-testid="link-nav-game"');
    expect(pageSrc).toContain('href="/clean-sneaks"');
    expect(pageSrc).toContain('aria-label="Open Game"');
    expect(pageSrc).toContain('window.location.assign("/clean-sneaks")');
    // Game is the first/action link after the brand so it stays findable past the intro.
    expect(pageSrc.indexOf('data-testid="link-nav-game"')).toBeLessThan(
      pageSrc.indexOf('data-testid="link-nav-poor-man-protection"'),
    );
    expect(pageSrc).not.toMatch(
      /data-testid="link-nav-game"[\s\S]{0,280}href="\/play"|href="\/play"[\s\S]{0,280}data-testid="link-nav-game"/,
    );
    expect(pageSrc).toContain('data-testid="button-start-free"');
    expect(pageSrc).not.toContain("OrbitAdminAccessButton");
    expect(pageSrc).not.toContain("button-home-nav-admin-orbit");
    expect(pageSrc).not.toContain("button-home-intro-admin-orbit");
    expect(pageSrc).not.toContain('data-testid="link-nav-events"');
    expect(pageSrc).not.toContain('data-testid="button-signin"');
  });
});
