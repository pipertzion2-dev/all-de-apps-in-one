import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage intro scroll", () => {
  const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");

  it("enters on scroll up without touchmove preventDefault", () => {
    // Passive scroll-up enter is OK; flip RAF + touchmove preventDefault froze iPhone.
    expect(pageSrc).toContain("Scroll up to enter");
    expect(pageSrc).toContain('window.addEventListener("wheel", handleWheel');
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
    expect(pageSrc).toContain("muted=true");
    expect(pageSrc).toContain("introPosterCover");
    expect(pageSrc).toContain("The inspiration for the site in one episode");
    expect(pageSrc).toContain("isIntro");
    expect(pageSrc).not.toContain("button-intro-video-start");
    expect(pageSrc).not.toContain("paused={introVideoStarted}");
  });

  it("releases the page from 3D when the intro finishes", () => {
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transform = ""/);
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transformOrigin = ""/);
  });
});
