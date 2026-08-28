import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("homepage intro scroll", () => {
  const pageSrc = readFileSync(resolve(__dirname, "../../app/page.tsx"), "utf8");

  it("registers wheel/touch only on window (no duplicate capture listeners)", () => {
    expect(pageSrc).toContain('window.addEventListener("wheel", handleWheel');
    expect(pageSrc).toContain('window.addEventListener("touchmove", handleTouchMove');
    expect(pageSrc).not.toContain('captureEl.addEventListener("wheel"');
    expect(pageSrc).not.toContain('captureEl.addEventListener("touchmove"');
  });

  it("smooths flip progress with RAF instead of painting every delta immediately", () => {
    expect(pageSrc).toContain("requestAnimationFrame(tickFlip)");
    expect(pageSrc).toContain("ensureTick");
    expect(pageSrc).toContain("flipAnimRef");
  });

  it("defers heavy 3D until intro completes on all devices", () => {
    expect(pageSrc).toContain("canMountHeavy3d");
    expect(pageSrc).toContain("if (!flipComplete) return");
    expect(pageSrc).not.toMatch(/if \(!mobile\) setCanMountHeavy3d\(true\)/);
  });

  it("auto-advances to homepage when intro is idle", () => {
    expect(pageSrc).toContain("autoSkipTimer");
    expect(pageSrc).toContain("snapToFinish");
    expect(pageSrc).toContain("bumpIdleComplete");
  });

  it("rotates the real page in as the flip's second face", () => {
    // Without a second face the reveal is a flat cross-fade, so the page face
    // must be driven from the same angle as the intro panel.
    expect(pageSrc).toContain("pageFaceRef");
    expect(pageSrc).toContain("paintPageFace");
    expect(pageSrc).toContain("rotateX(${angle - 90}deg)");
    // paintFlip drives every frame; syncFlipDepth covers resize.
    expect(pageSrc.match(/paintPageFace\(angle\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the intro layer transparent so the second face is visible behind it", () => {
    expect(pageSrc).toContain('backgroundColor: "transparent"');
  });

  it("releases the page from 3D when the intro finishes", () => {
    // Imperative transforms survive React's style diff, so finishIntro must
    // clear them or the finished page stays in a 3D layer with fixed
    // positioning broken.
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transform = ""/);
    expect(pageSrc).toMatch(/pageFaceRef\.current\.style\.transformOrigin = ""/);
  });
});
