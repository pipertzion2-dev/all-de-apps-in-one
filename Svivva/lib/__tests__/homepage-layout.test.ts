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
  });

  it("uses the Dune-style flip stack for begin, game, and home", () => {
    expect(showHomepageSection("scrollSnap")).toBe(true);
  });

  it("exposes Admin Orbit on the intro overlay and main nav", () => {
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(pageSrc).toContain("OrbitAdminAccessButton");
    expect(pageSrc).toContain("button-home-intro-admin-orbit");
    expect(pageSrc).toContain("button-home-nav-admin-orbit");
  });
});
