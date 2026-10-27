import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage intro scroll", () => {
  const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
  const gameSrc = readFileSync(
    resolve(__dirname, "../../components/homepage-game-panel.tsx"),
    "utf8",
  );

  it("enters on scroll up without touchmove preventDefault", () => {
    expect(pageSrc).toContain('window.addEventListener("wheel", handleWheel');
    expect(pageSrc).not.toContain('window.addEventListener("touchmove", handleTouchMove');
    expect(pageSrc).toContain("skipIntroRef");
    expect(pageSrc).toContain("button-skip-intro");
    expect(pageSrc).not.toContain("isOverIntroVideo");
    expect(pageSrc).toContain("if (e.deltaY < 0)");
    expect(pageSrc).toContain("touchStartY - y > 48");
  });

  it("defers heavy homepage 3D until intro completes", () => {
    expect(pageSrc).toContain("canMountHeavy3d");
    expect(pageSrc).toContain("if (!flipComplete) return");
  });

  it("opens with the Klean Sneaks game on black with Three.js flowers", () => {
    expect(pageSrc).toContain("HomepageGamePanel");
    expect(pageSrc).toContain("asIntro");
    expect(pageSrc).toContain("homepage-game-intro");
    expect(pageSrc).not.toContain("HomepageLockScreen");
    expect(gameSrc).toContain("bg-black");
    expect(gameSrc).toContain("CamoThreeOverlay");
    expect(gameSrc).toContain('preset="lock"');
    expect(gameSrc).toContain("CleanSneaksLogoCube");
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
