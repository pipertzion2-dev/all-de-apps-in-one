import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { cubeLoopWrapTarget, nextCubeLoopPanel, prevCubeLoopPanel } from "../homepage-cube-loop";
import { HOMEPAGE_FLIP_PANELS } from "../homepage-flip-stack";

describe("homepage cube loop", () => {
  it("orders faces beta → story → white game", () => {
    expect([...HOMEPAGE_FLIP_PANELS]).toEqual(["home-beta", "nav-cube", "home-game"]);
  });

  it("continues from the story face to the white game face", () => {
    expect(nextCubeLoopPanel("nav-cube")).toBe("home-game");
    expect(nextCubeLoopPanel("home-game")).toBe("home-beta");
    expect(nextCubeLoopPanel("home-beta")).toBe("nav-cube");
  });

  it("wraps backward from beta to the white game face", () => {
    expect(prevCubeLoopPanel("home-beta")).toBe("home-game");
    expect(prevCubeLoopPanel("home-game")).toBe("nav-cube");
  });

  it("maps wheel + active panel edges to the next continuous face", () => {
    expect(
      cubeLoopWrapTarget(40, {
        activePanel: "nav-cube",
        nearPanelBottom: true,
        nearPanelTop: false,
      }),
    ).toBe("home-game");
    expect(
      cubeLoopWrapTarget(40, {
        activePanel: "home-game",
        nearPanelBottom: true,
        nearPanelTop: false,
      }),
    ).toBe("home-beta");
    expect(
      cubeLoopWrapTarget(-40, {
        activePanel: "home-beta",
        nearPanelBottom: false,
        nearPanelTop: true,
      }),
    ).toBe("home-game");
    expect(
      cubeLoopWrapTarget(40, {
        activePanel: "nav-cube",
        nearPanelBottom: false,
        nearPanelTop: false,
        nearBottom: false,
      }),
    ).toBeNull();
  });

  it("mounts the white game face after the story face and uses a fine flip wrap", () => {
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
    expect(pageSrc).toContain('data-homepage-cube-faces="3"');
    expect(pageSrc).toMatch(
      /HomepageBetaPanel[\s\S]*HomepageCubePanel[\s\S]*HomepageGamePanel[\s\S]*HomepageCubeLoop/,
    );
    expect(loopSrc).toContain("flipToHomepagePanel");
    expect(loopSrc).toContain("nearestHomepagePanel");
    expect(loopSrc).not.toContain("IntersectionObserver");
    expect(cubeSrc).toContain("button-continue-to-game");
    expect(cubeSrc).toContain('flipToHomepagePanel("home-game"');
    expect(scrollSrc).toContain("playHomepageFineFlip");
    expect(scrollSrc).toContain("flipToHomepagePanel");
  });
});
