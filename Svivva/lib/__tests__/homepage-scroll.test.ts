import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("cube journey replaces scroll-snap loading handoff", () => {
    const journeySrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-journey/homepage-cube-journey.tsx"),
      "utf8",
    );
    const canvasSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-journey/journey-cube-canvas.tsx"),
      "utf8",
    );
    const pageSrc = readFileSync(resolve(__dirname, "../../app/page.tsx"), "utf8");
    expect(journeySrc).toContain("HomepageCubeJourney");
    expect(journeySrc).toContain('data-homepage-journey-face="begin"');
    expect(canvasSrc).toContain("BEGIN");
    expect(canvasSrc).toContain("PLAY");
    expect(canvasSrc).toContain("HOME");
    expect(pageSrc).toContain("showHomepageSection(\"cubeJourney\")");
  });

  it("bundle cube panel opens the game route directly", () => {
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-game-panel.tsx"),
      "utf8",
    );
    expect(cubeSrc).toContain("CleanSneaksLogoCube");
    expect(cubeSrc).toContain("onEnterGame");
  });

  it("scroll hints can navigate between panels", () => {
    const hintSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-scroll-hint.tsx"),
      "utf8",
    );
    expect(hintSrc).toContain("onActivate");
  });
});
