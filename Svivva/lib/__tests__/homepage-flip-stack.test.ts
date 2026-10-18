import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { flipPanelFromHash, flipPanelIndex, hashForFlipPanel } from "../homepage-flip-stack";

describe("homepage flip stack", () => {
  it("maps legacy hash ids to flip panels", () => {
    expect(flipPanelFromHash("")).toBe("home-game");
    expect(flipPanelFromHash("nav-cube")).toBe("nav-cube");
    expect(flipPanelFromHash("home-game")).toBe("home-game");
    expect(flipPanelFromHash("clean-sneaks")).toBe("home-game");
    expect(flipPanelFromHash("home-explore")).toBe("nav-cube");
    expect(flipPanelFromHash("oaas")).toBe("nav-cube");
    expect(flipPanelFromHash("pricing")).toBe("nav-cube");
  });

  it("round-trips hash helpers", () => {
    expect(hashForFlipPanel("nav-cube")).toBe("nav-cube");
    expect(hashForFlipPanel("home-game")).toBe("home-game");
  });

  it("orders game above The Moves Like face (land on home-game)", () => {
    expect(flipPanelIndex("home-game")).toBe(0);
    expect(flipPanelIndex("nav-cube")).toBe(1);
  });

  it("runs a timed 3D cube flip with content on the rotating face", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("FLIP_DURATION_MS");
    expect(flipSrc).toContain("FLIP_DURATION_MOBILE_MS");
    expect(flipSrc).toContain("easeInOutCubic");
    expect(flipSrc).toContain("ensureTick");
    expect(flipSrc).toContain("contentHost");
    expect(flipSrc).toContain('setContentHost("face")');
    expect(flipSrc).toContain('setContentHost("overlay")');
    expect(flipSrc).toContain("data-homepage-flip-scroll");
    expect(flipSrc).toContain("data-homepage-flip-stack");
    expect(flipSrc).toContain("settledOnPlatform");
    expect(flipSrc).toContain("TOUCH_LEAVE_PX");
    expect(flipSrc).toContain("platformScrollMode");
    expect(flipSrc).toContain('initialPanel = "home-game"');
    expect(flipSrc).toContain('panelId === "home-game" && direction > 0');
    expect(flipSrc).toMatch(/panelId === "nav-cube"[\s\S]*direction > 0[\s\S]*return false/);
    // No continuous scrub — timed cube rotation only.
    expect(flipSrc).not.toContain("paintDirect");
    expect(flipSrc).not.toContain("scheduleSnap");
    expect(flipSrc).not.toContain("virtualIndexRef");
  });

  it("keeps mobile scroll native (no touchmove preventDefault on window)", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).not.toContain('addEventListener("touchmove", onTouchMove');
    expect(flipSrc).toContain(
      'addEventListener("touchmove", onPlatformTouchMove, { passive: true })',
    );
    expect(flipSrc).toContain("isTouchPrimaryDevice");
  });

  it("rotates forward like the intro reveal (positive rotor, negative face hinge)", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("rotateX(${index * 90}deg)");
    expect(flipSrc).toContain("rotateX(${-i * 90}deg)");
    expect(flipSrc).not.toContain("rotateX(${-index * 90}deg)");
  });

  it("supports touch swipes for mobile flip navigation", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain('addEventListener("touchstart"');
    expect(flipSrc).toContain('addEventListener("touchend"');
    expect(flipSrc).toContain("SWIPE_THRESHOLD_PX");
    expect(flipSrc).toContain("onGameTouchEnd");
  });
});
