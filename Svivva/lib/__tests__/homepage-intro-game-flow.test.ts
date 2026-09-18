import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage intro game flow", () => {
  it("runs loading → cube → start before the homepage", () => {
    const flowSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-intro-game-flow.tsx"),
      "utf8",
    );
    const pageSrc = readFileSync(resolve(__dirname, "../../app/page.tsx"), "utf8");

    expect(flowSrc).toContain('useState<IntroGamePhase>("loading")');
    expect(flowSrc).toContain("GameLoadingWheels");
    expect(flowSrc).toContain("CleanSneaksLogoCube");
    expect(flowSrc).toContain('setPhase("start")');
    expect(flowSrc).toContain("GameStartScreen");
    expect(flowSrc).toContain("onEnterHomepage");

    expect(pageSrc).toContain("HomepageIntroGameFlow");
    expect(pageSrc).toContain("introGameDone");
    expect(pageSrc).toContain("onEnterHomepage={() => setIntroGameDone(true)}");
  });

  it("disables scroll-snap panels in favor of the intro flip flow", () => {
    const layoutSrc = readFileSync(resolve(__dirname, "../homepage-layout.ts"), "utf8");
    expect(layoutSrc).toContain("scrollSnap: false");
  });
});
