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

  it("defers heavy 3D on mobile until intro completes", () => {
    expect(pageSrc).toContain("canMountHeavy3d");
    expect(pageSrc).toContain("setCanMountHeavy3d(true)");
    expect(pageSrc).toContain("if (flipComplete) setCanMountHeavy3d(true)");
  });
});
