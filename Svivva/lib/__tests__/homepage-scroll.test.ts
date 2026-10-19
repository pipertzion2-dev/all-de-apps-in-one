import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("uses native document scroll instead of a fixed flip overlay", () => {
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    const scrollSrc = readFileSync(resolve(__dirname, "../homepage-scroll.ts"), "utf8");
    expect(pageSrc).toContain("data-homepage-native-scroll");
    expect(pageSrc).toContain("HomepageGamePanel");
    expect(pageSrc).toContain("HomepageCubePanel");
    expect(pageSrc).not.toContain("HomepageFlipStack");
    expect(pageSrc).not.toContain("HomepageCubeJourney");
    expect(pageSrc).not.toContain("JourneyCubeCanvas");
    expect(pageSrc).not.toContain("HomepageExplorePanel");
    expect(scrollSrc).toContain("scrollIntoView");
    expect(scrollSrc).toContain("scrollToHomepagePanel");
  });

  it("bundle cube panel opens the game route directly", () => {
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-game-panel.tsx"),
      "utf8",
    );
    expect(cubeSrc).toContain("CleanSneaksLogoCube");
    expect(cubeSrc).toContain('router.push("/clean-sneaks")');
    expect(cubeSrc).toContain('id="home-game"');
  });

  it("lands on the game panel first, then homepage cube with pricing", () => {
    const stackSrc = readFileSync(resolve(__dirname, "../../lib/homepage-flip-stack.ts"), "utf8");
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-panel.tsx"),
      "utf8",
    );
    expect(stackSrc).toMatch(/HOMEPAGE_FLIP_PANELS[\s\S]*"home-game"[\s\S]*"nav-cube"/);
    expect(pageSrc).toContain('useState<HomepageFlipPanelId>("home-game")');
    expect(pageSrc).toContain("HomepageCubePanel");
    expect(cubeSrc).toContain('id="nav-cube"');
    expect(cubeSrc).toContain("HomepageMovesLikeHero");
    expect(cubeSrc).toContain("HomepageAboutSection");
    expect(cubeSrc).toContain("HomepageFounderSonSection");
    expect(cubeSrc).toMatch(/HomepageFounderSonSection[\s\S]*HomepagePricingSection/);
    expect(cubeSrc).not.toContain("HomepageProtectionHero");
    const founderSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-founder-son-section.tsx"),
      "utf8",
    );
    expect(founderSrc).toContain("He designed the logo at the computer");
    expect(founderSrc).not.toMatch(/Poor Man Protection|Klean Sneaks|Hybrid² Lab|Bed Stuy/);
    expect(cubeSrc).toContain("HomepagePricingSection");
    expect(cubeSrc).toContain("HomepageFaqSection");
    expect(cubeSrc).toContain("HomepageHowToSection");
    expect(cubeSrc).toContain("HomepageExploreLinks");
    expect(cubeSrc).toContain("HomepageCubeFaceHint");
    expect(cubeSrc).toContain("scrollPlatformSection");
    expect(cubeSrc).toContain("PlatformFeatureHub");
    expect(cubeSrc).toContain('id="oaas"');
    expect(cubeSrc).not.toContain("Flip down · game");
  });

  it("keeps the cube-face hint in document flow (not sticky overlay)", () => {
    const hintSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-face-hint.tsx"),
      "utf8",
    );
    expect(hintSrc).not.toMatch(/\bsticky\b/);
    expect(hintSrc).not.toContain("position: fixed");
    expect(hintSrc).not.toContain("sticky top-0");
    expect(hintSrc).toContain("scrollToHomepagePanel");
  });

  it("mounts the OaaS mixing console on the scrollSnap cube face", () => {
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-panel.tsx"),
      "utf8",
    );
    const hubSrc = readFileSync(
      resolve(__dirname, "../../components/platform-feature-hub.tsx"),
      "utf8",
    );
    expect(cubeSrc).toContain("hideBackground");
    expect(cubeSrc).toContain("hideChannelStrips");
    expect(hubSrc).toContain("BusOverviewFilter");
    expect(hubSrc).toContain("onSubmit");
    expect(hubSrc).toContain("Patch route");
    expect(hubSrc).toContain("Beta desk modules");
    expect(hubSrc).not.toContain("The mixing board for your stack");
  });
});
