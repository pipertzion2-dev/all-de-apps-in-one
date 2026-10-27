import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("uses native document scroll instead of a fixed flip overlay", () => {
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    const scrollSrc = readFileSync(resolve(__dirname, "../homepage-scroll.ts"), "utf8");
    expect(pageSrc).toContain("data-homepage-native-scroll");
    expect(pageSrc).toContain('data-homepage-cube-faces="2"');
    expect(pageSrc).toContain("HomepageGamePanel");
    expect(pageSrc).not.toContain("HomepageMovesPanel");
    expect(pageSrc).toContain("HomepageBetaPanel");
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
    expect(cubeSrc).toContain("CamoThreeOverlay");
    expect(cubeSrc).toContain('preset="lock"');
    expect(cubeSrc).toContain("bg-white");
    expect(cubeSrc).toContain("button-enter-main-app");
    expect(cubeSrc).not.toContain("HomepageScrollHint");
  });

  it("splits main app faces: beta apps then combined; game is intro; Moves Like in Play", () => {
    const stackSrc = readFileSync(resolve(__dirname, "../../lib/homepage-flip-stack.ts"), "utf8");
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    const betaSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-beta-panel.tsx"),
      "utf8",
    );
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-panel.tsx"),
      "utf8",
    );
    const gameSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-game-panel.tsx"),
      "utf8",
    );
    const playHubSrc = readFileSync(
      resolve(__dirname, "../../components/play/play-hub-client.tsx"),
      "utf8",
    );
    expect(stackSrc).toMatch(/HOMEPAGE_FLIP_PANELS[\s\S]*"home-beta"[\s\S]*"nav-cube"/);
    expect(pageSrc).toContain('useState<HomepageFlipPanelId>("home-beta")');
    expect(pageSrc).toMatch(/HomepageBetaPanel[\s\S]*HomepageCubePanel/);
    expect(pageSrc).toContain("asIntro");
    expect(pageSrc).toContain("homepage-game-intro");
    expect(betaSrc).toContain('id="home-beta"');
    expect(betaSrc).toContain("HomepageHeroBlock");
    expect(betaSrc).toContain("PlatformFeatureHub");
    expect(betaSrc).toContain('id="oaas"');
    expect(betaSrc).toContain('href="/play"');
    expect(cubeSrc).toContain('id="nav-cube"');
    expect(cubeSrc).toContain("HomepageAboutSection");
    expect(cubeSrc).toContain("HomepageFounderSonSection");
    expect(cubeSrc).toMatch(/HomepageFounderSonSection[\s\S]*HomepagePricingSection/);
    expect(cubeSrc).toContain('href="/clean-sneaks"');
    expect(cubeSrc).not.toContain("HomepageProtectionHero");
    expect(cubeSrc).not.toContain("HomepageMovesLikeHero");
    expect(cubeSrc).not.toContain("HomepageHeroBlock");
    expect(cubeSrc).not.toContain("PlatformFeatureHub");
    expect(gameSrc).toContain('surface="game"');
    expect(gameSrc).toContain("KLEAN_HOMEPAGE_TAGLINE");
    expect(playHubSrc).toContain("MovesLikeApp");
    expect(playHubSrc).toContain("tab-play-moves");
    expect(playHubSrc).toContain("tab-play-studio");
    const positioningSrc = readFileSync(resolve(__dirname, "../product-positioning.ts"), "utf8");
    expect(positioningSrc).toMatch(/god moves/i);
    expect(positioningSrc).toContain("HOMEPAGE_GAME_FACE_TITLE");
    expect(positioningSrc).toMatch(/Make god moves on the walk/);
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
    expect(hintSrc).toContain('scrollToHomepagePanel("home-beta")');
  });

  it("mounts the OaaS mixing console on the beta cube face", () => {
    const betaSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-beta-panel.tsx"),
      "utf8",
    );
    const hubSrc = readFileSync(
      resolve(__dirname, "../../components/platform-feature-hub.tsx"),
      "utf8",
    );
    expect(betaSrc).toContain("hideBackground");
    expect(betaSrc).toContain("hideChannelStrips");
    expect(hubSrc).toContain("BusOverviewFilter");
    expect(hubSrc).toContain("onSubmit");
    expect(hubSrc).toContain("Patch route");
    expect(hubSrc).toContain("Beta desk modules");
    expect(hubSrc).not.toContain("The mixing board for your stack");
  });
});
