import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("uses a Dune-style flip stack instead of a journey cube widget", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
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

  it("lands on the game panel first after intro", () => {
    const stackSrc = readFileSync(resolve(__dirname, "../../lib/homepage-flip-stack.ts"), "utf8");
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    expect(stackSrc).toMatch(/HOMEPAGE_FLIP_PANELS[\s\S]*"home-game"[\s\S]*"nav-cube"/);
    expect(pageSrc).toContain('useState<HomepageFlipPanelId>("home-game")');
  });
});
