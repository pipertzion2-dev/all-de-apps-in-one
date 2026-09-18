import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage scroll panels", () => {
  it("game panel avoids fixed fullscreen loading overlays", () => {
    const src = readFileSync(resolve(__dirname, "../../components/homepage-game-panel.tsx"), "utf8");
    expect(src).not.toContain("GameStartScreen");
    expect(src).not.toContain("GameLoadingWheels");
    expect(src).not.toContain("CleanSneaksGame3D");
  });

  it("scroll hints can navigate between panels", () => {
    const hintSrc = readFileSync(resolve(__dirname, "../../components/homepage-scroll-hint.tsx"), "utf8");
    expect(hintSrc).toContain("onActivate");
  });
});
