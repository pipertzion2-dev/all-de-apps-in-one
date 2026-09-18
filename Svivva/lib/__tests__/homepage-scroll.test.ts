import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("bundle cube panel hands off to a separate loading panel", () => {
    const cubeSrc = readFileSync(resolve(__dirname, "../../components/homepage-game-panel.tsx"), "utf8");
    const loadingSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-game-loading-panel.tsx"),
      "utf8",
    );
    expect(cubeSrc).toContain("CleanSneaksLogoCube");
    expect(cubeSrc).toContain("home-game-loading");
    expect(loadingSrc).toContain("GameLoadingWheels");
    expect(loadingSrc).not.toMatch(/fixed inset-0/);
  });

  it("scroll hints can navigate between panels", () => {
    const hintSrc = readFileSync(resolve(__dirname, "../../components/homepage-scroll-hint.tsx"), "utf8");
    expect(hintSrc).toContain("onActivate");
  });
});
