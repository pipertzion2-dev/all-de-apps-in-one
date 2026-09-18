import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("uses a Dune-style flip stack instead of a journey cube widget", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    const pageSrc = readFileSync(resolve(__dirname, "../../app/page.tsx"), "utf8");
    expect(flipSrc).toContain("data-homepage-flip-stack");
    expect(flipSrc).toContain("rotateX");
    expect(pageSrc).toContain("HomepageFlipStack");
    expect(pageSrc).not.toContain("HomepageCubeJourney");
    expect(pageSrc).not.toContain("JourneyCubeCanvas");
  });

  it("bundle cube panel opens the game route directly", () => {
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-game-panel.tsx"),
      "utf8",
    );
    expect(cubeSrc).toContain("CleanSneaksLogoCube");
    expect(cubeSrc).toContain('router.push("/clean-sneaks")');
  });

  it("scroll hints can navigate between panels", () => {
    const hintSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-scroll-hint.tsx"),
      "utf8",
    );
    expect(hintSrc).toContain("onActivate");
  });
});
