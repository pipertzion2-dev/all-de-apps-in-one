import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage intro scroll", () => {
  const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");

  it("does not steal wheel/touch for the Bunny Stream video intro", () => {
    // Window preventDefault + flip RAF froze iPhone with WebGL + the player.
    expect(pageSrc).not.toContain('window.addEventListener("wheel", handleWheel');
    expect(pageSrc).not.toContain('window.addEventListener("touchmove", handleTouchMove');
    expect(pageSrc).toContain("skipIntroRef");
    expect(pageSrc).toContain("Skip intro");
  });

  it("defers heavy homepage 3D until intro completes", () => {
    expect(pageSrc).toContain("canMountHeavy3d");
    expect(pageSrc).toContain("if (!flipComplete) return");
  });

  it("keeps Bunny Stream intro playable with thumbnail + flowers", () => {
    expect(pageSrc).not.toContain("autoSkipTimer");
    expect(pageSrc).toContain("INTRO_BUNNY_STREAM_PLAY");
    expect(pageSrc).toContain("INTRO_BUNNY_THUMBNAIL");
    expect(pageSrc).toContain("player.mediadelivery.net/embed/");
    expect(pageSrc).toContain("paused={introVideoStarted}");
    expect(pageSrc).toContain("isIntro");
  });

  it("releases the page from 3D when the intro finishes", () => {
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transform = ""/);
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transformOrigin = ""/);
  });
});
