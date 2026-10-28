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
    expect(pageSrc).toContain("HomepageCubeLoop");
    expect(pageSrc).toMatch(
      /data-homepage-native-scroll[\s\S]*HomepageBetaPanel[\s\S]*HomepageCubePanel[\s\S]*HomepageCubeLoop/,
    );
    expect(pageSrc).not.toMatch(/data-homepage-native-scroll[\s\S]*<HomepageGamePanel/);
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
    const startSrc = readFileSync(
      resolve(__dirname, "../../components/clean-sneaks/GameStartScreen.tsx"),
      "utf8",
    );
    expect(cubeSrc).toContain("CleanSneaksLogoCube");
    expect(cubeSrc).not.toContain("HomepageBundlePuzzle");
    expect(cubeSrc).toContain('router.push("/clean-sneaks")');
    expect(cubeSrc).toContain('id="home-game"');
    expect(cubeSrc).toContain("CamoThreeOverlay");
    expect(cubeSrc).toContain('preset="lock"');
    expect(cubeSrc).toContain("bg-white");
    expect(cubeSrc).toContain("Tap cube to play free");
    expect(cubeSrc).not.toContain("button-enter-main-app");
    expect(cubeSrc).not.toContain("HomepageScrollHint");
    expect(startSrc).not.toContain("HomepageBundlePuzzle");
    expect(startSrc).toContain("game-start-cover-screen");
    expect(startSrc).toContain("MAIN_GAME_COVER_URL");
    expect(startSrc).toContain("img-main-game-cover");
    expect(startSrc).toContain("bg-black");
  });

  it("splits main app faces: beta apps then combined; game is intro; no Moves Like ads", () => {
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
    expect(stackSrc).toMatch(
      /HOMEPAGE_FLIP_PANELS: readonly HomepageFlipPanelId\[] = \[\s*"home-beta",\s*"nav-cube",\s*] as const/,
    );
    expect(pageSrc).toContain('useState<HomepageFlipPanelId>("home-beta")');
    expect(pageSrc).toMatch(
      /data-homepage-native-scroll[\s\S]*HomepageBetaPanel[\s\S]*HomepageCubePanel[\s\S]*HomepageCubeLoop/,
    );
    expect(pageSrc).not.toMatch(/data-homepage-native-scroll[\s\S]*<HomepageGamePanel/);
    expect(pageSrc).toContain("asIntro");
    expect(pageSrc).toContain("homepage-game-intro");
    expect(betaSrc).toContain('id="home-beta"');
    expect(betaSrc).toContain("HomepageProtectionHero");
    expect(betaSrc).toContain("HomepageHeroBlock");
    expect(betaSrc).toContain("PlatformFeatureHub");
    expect(betaSrc).toContain('id="oaas"');
    expect(betaSrc).toContain("HOMEPAGE_BETA_CUBE_TITLE");
    expect(betaSrc).not.toContain('href="/play"');
    expect(betaSrc).not.toMatch(/Moves Like/i);
    expect(cubeSrc).toContain('id="nav-cube"');
    expect(cubeSrc).toContain("HomepageAboutSection");
    expect(cubeSrc).toContain("HomepageFounderSonSection");
    expect(cubeSrc).toMatch(/HomepageFounderSonSection[\s\S]*HomepagePricingSection/);
    expect(cubeSrc).toContain("PRODUCT_PROTECTION_PATH");
    expect(cubeSrc).not.toContain('href="/play"');
    expect(cubeSrc).not.toContain('href="/poor-man-protection/invention-studio"');
    expect(cubeSrc).not.toMatch(/Klean Sneaks/i);
    expect(cubeSrc).not.toContain("HomepageProtectionHero");
    expect(cubeSrc).not.toContain("HomepageMovesLikeHero");
    expect(cubeSrc).not.toContain("HomepageHeroBlock");
    expect(cubeSrc).not.toContain("PlatformFeatureHub");
    expect(gameSrc).not.toContain("HomepageMainGoal");
    expect(gameSrc).toContain("KLEAN_HOMEPAGE_TAGLINE");
    expect(playHubSrc).toContain("MovesLikeApp");
    expect(playHubSrc).toContain("tab-play-moves");
    expect(playHubSrc).toContain("tab-play-studio");
    expect(playHubSrc).not.toContain("Open The Moves Like");
    const positioningSrc = readFileSync(resolve(__dirname, "../product-positioning.ts"), "utf8");
    expect(positioningSrc).toContain("HOMEPAGE_GAME_FACE_TITLE");
    expect(positioningSrc).toContain('PRODUCT_NAME_LINE = "Poor Man Protection"');
    expect(positioningSrc).toContain('PRODUCT_PROTECTION_PATH = "/poor-man-protection"');
    expect(positioningSrc).not.toMatch(/HOMEPAGE_APPLICATIONS_SUBLINE[\s\S]*Moves Like/);
    const aboutSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-about-section.tsx"),
      "utf8",
    );
    const exploreSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-explore-links.tsx"),
      "utf8",
    );
    expect(aboutSrc).not.toMatch(/Moves Like/i);
    expect(exploreSrc).not.toMatch(/Moves Like/i);
    expect(aboutSrc).not.toContain('href="/play"');
    expect(exploreSrc).not.toContain('href="/play"');
    const founderSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-founder-son-section.tsx"),
      "utf8",
    );
    expect(founderSrc).toContain("He designed the logo at the computer");
    expect(founderSrc).toContain("founder-son-logo-credit");
    expect(founderSrc).toContain("Logo by my son");
    expect(founderSrc).toContain("ZZAI_OFFICIAL_LOGO");
    expect(founderSrc).not.toMatch(/Poor Man Protection|Klean Sneaks|Hybrid² Lab|Bed Stuy/);
    const protectionSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-protection-hero.tsx"),
      "utf8",
    );
    expect(protectionSrc).not.toContain("Logo by my son");
    expect(protectionSrc).not.toContain("ZZAI_OFFICIAL_LOGO");
    expect(protectionSrc).not.toContain("Klean Sneaks demo");
    expect(aboutSrc).not.toContain("Klean Sneaks demo");
    expect(exploreSrc).not.toContain("Klean Sneaks demo");
    expect(pageSrc).not.toContain("Klean Sneaks demo");
    expect(pageSrc).not.toMatch(/Klean Sneaks/i);
    const featureDefsSrc = readFileSync(
      resolve(__dirname, "../../components/svivva-artifact/feature-defs.ts"),
      "utf8",
    );
    expect(featureDefsSrc).not.toMatch(/Klean Sneaks/i);
    expect(featureDefsSrc).not.toContain("Play Klean Sneaks");
    expect(pageSrc).toContain('data-testid="link-home-brand"');
    expect(pageSrc).toContain(
      'className="whitespace-nowrap text-sm font-semibold tracking-[0.12em] text-foreground"',
    );
    expect(cubeSrc).toContain("HomepagePricingSection");
    expect(cubeSrc).toContain("HomepageFaqSection");
    expect(cubeSrc).toContain("HomepageHowToSection");
    expect(cubeSrc).toContain("HomepageExploreLinks");
    expect(cubeSrc).toContain("HomepageCubeFaceHint");
    expect(cubeSrc).not.toContain("button-open-invention-protection");
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
