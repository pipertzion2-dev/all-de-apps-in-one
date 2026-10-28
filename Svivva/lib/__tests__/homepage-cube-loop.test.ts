import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { cubeLoopWrapTarget, nextCubeLoopPanel, prevCubeLoopPanel } from "../homepage-cube-loop";
import { HOMEPAGE_FLIP_PANELS } from "../homepage-flip-stack";

describe("homepage cube loop", () => {
  it("orders faces beta → story only (game is intro-only)", () => {
    expect([...HOMEPAGE_FLIP_PANELS]).toEqual(["home-beta", "nav-cube"]);
  });

  it("stops after the story face instead of continuing to the game", () => {
    expect(nextCubeLoopPanel("home-beta")).toBe("nav-cube");
    expect(nextCubeLoopPanel("nav-cube")).toBeNull();
  });

  it("does not wrap backward past beta into a third face", () => {
    expect(prevCubeLoopPanel("nav-cube")).toBe("home-beta");
    expect(prevCubeLoopPanel("home-beta")).toBeNull();
  });

  it("maps wheel + active panel edges without opening a page after story", () => {
    expect(
      cubeLoopWrapTarget(40, {
        activePanel: "home-beta",
        nearPanelBottom: true,
        nearPanelTop: false,
      }),
    ).toBe("nav-cube");
    expect(
      cubeLoopWrapTarget(40, {
        activePanel: "nav-cube",
        nearPanelBottom: true,
        nearPanelTop: false,
      }),
    ).toBeNull();
    expect(
      cubeLoopWrapTarget(-40, {
        activePanel: "nav-cube",
        nearPanelBottom: false,
        nearPanelTop: true,
      }),
    ).toBe("home-beta");
    expect(
      cubeLoopWrapTarget(-40, {
        activePanel: "home-beta",
        nearPanelBottom: false,
        nearPanelTop: true,
      }),
    ).toBeNull();
  });

  it("mounts beta then story only after the intro — no scrolled game face", () => {
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    const loopSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-loop.tsx"),
      "utf8",
    );
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-panel.tsx"),
      "utf8",
    );
    const scrollSrc = readFileSync(resolve(__dirname, "../homepage-scroll.ts"), "utf8");
    expect(pageSrc).toContain("HomepageCubeLoop");
    expect(pageSrc).toContain('data-homepage-cube-faces="2"');
    expect(pageSrc).toMatch(
      /data-homepage-native-scroll[\s\S]*HomepageBetaPanel[\s\S]*HomepageCubePanel[\s\S]*HomepageCubeLoop/,
    );
    expect(pageSrc).not.toMatch(/data-homepage-native-scroll[\s\S]*<HomepageGamePanel/);
    expect(loopSrc).toContain("flipToHomepagePanel");
    expect(loopSrc).toContain("nearestHomepagePanel");
    expect(loopSrc).not.toContain("IntersectionObserver");
    expect(cubeSrc).not.toContain("button-continue-to-game");
    expect(cubeSrc).not.toContain('flipToHomepagePanel("home-game"');
    expect(scrollSrc).toContain("playHomepageFineFlip");
    expect(scrollSrc).toContain("flipToHomepagePanel");
    expect(scrollSrc).toContain("homepagePanelsAreAdjacent");
    expect(scrollSrc).toContain('behavior: "smooth"');
  });
});
