import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage intro scroll", () => {
  const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
  const gameSrc = readFileSync(
    resolve(__dirname, "../../components/homepage-game-panel.tsx"),
    "utf8",
  );

  it("drives a vertical cube flip on scroll down / swipe up", () => {
    expect(pageSrc).toContain("Scroll down to enter");
    expect(pageSrc).toContain('window.addEventListener("wheel", handleWheel');
    expect(pageSrc).toContain('window.addEventListener("touchmove", handleTouchMove');
    expect(pageSrc).toContain("skipIntroRef");
    expect(pageSrc).toContain("enterFlipRef");
    expect(pageSrc).toContain("button-skip-intro");
    expect(pageSrc).toContain("rotateX(${angle}deg)");
    expect(pageSrc).toContain("rotateX(${angle - 90}deg)");
    expect(pageSrc).toContain("snapToFinish");
    // Desktop/Mac: positive deltaY (scroll down / natural trackpad) advances.
    expect(pageSrc).toContain("let delta = e.deltaY");
    expect(pageSrc).not.toContain("let delta = -e.deltaY");
  });

  it("keeps the scroll-down cue on the intro face with high-contrast copy", () => {
    const hintIdx = pageSrc.indexOf("Scroll down to enter");
    const frontIdx = pageSrc.indexOf("flipFrontRef");
    const panelIdx = pageSrc.indexOf("<HomepageGamePanel");
    expect(hintIdx).toBeGreaterThan(panelIdx);
    expect(panelIdx).toBeGreaterThan(frontIdx);
    expect(pageSrc).toContain('data-testid="button-enter-main-app"');
    expect(pageSrc).toContain("safe-area-inset-bottom");
    expect(pageSrc).toMatch(/text-black[\s\S]{0,120}Scroll down to enter/);
    expect(gameSrc).toContain("Tap cube to play free");
    expect(gameSrc).not.toContain("button-enter-main-app");
    expect(gameSrc).not.toMatch(/scroll (up|down) to enter/i);
  });

  it("defers heavy homepage 3D until intro completes", () => {
    expect(pageSrc).toContain("canMountHeavy3d");
    expect(pageSrc).toContain("if (!flipComplete) return");
  });

  it("opens with the Klean Sneaks game on white with Three.js flowers", () => {
    expect(pageSrc).toContain("HomepageGamePanel");
    expect(pageSrc).toContain("asIntro");
    expect(pageSrc).toContain("homepage-game-intro");
    expect(pageSrc).not.toContain("HomepageLockScreen");
    expect(gameSrc).toContain("bg-white");
    expect(gameSrc).toContain("CamoThreeOverlay");
    expect(gameSrc).toContain('preset="lock"');
    expect(gameSrc).toContain("CleanSneaksLogoCube");
    expect(gameSrc).not.toContain("HomepageBundlePuzzle");
  });

  it("releases the page from 3D when the intro finishes", () => {
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transform = ""/);
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transformOrigin = ""/);
  });

  it("remembers intro completion and lands on the main app", () => {
    expect(pageSrc).toContain('sessionStorage.setItem("svivva:homepageIntroComplete", "1")');
    expect(pageSrc).toContain('sessionStorage.getItem("svivva:homepageIntroComplete")');
    expect(pageSrc).toContain("svivva:homepage-intro-complete");
    expect(pageSrc).toContain("/#${landPanel}");
    expect(pageSrc).toContain('?? "home-beta"');
    expect(pageSrc).toContain("setFlipInitialPanel(landPanel)");
  });
});
