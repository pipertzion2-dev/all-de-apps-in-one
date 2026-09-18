import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("bundle cube panel opens the game route directly", () => {
    const cubeSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-game-panel.tsx"),
      "utf8",
    );
    const pageSrc = readFileSync(resolve(__dirname, "../../app/page.tsx"), "utf8");
    expect(cubeSrc).toContain("CleanSneaksLogoCube");
    expect(cubeSrc).toContain('router.push("/clean-sneaks")');
    expect(pageSrc).not.toContain("HomepageGameLoadingPanel");
  });

  it("scroll hints can navigate between panels", () => {
    const hintSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-scroll-hint.tsx"),
      "utf8",
    );
    expect(hintSrc).toContain("onActivate");
  });
});
