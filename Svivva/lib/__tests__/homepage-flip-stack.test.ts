import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { flipPanelFromHash, flipPanelIndex, hashForFlipPanel } from "../homepage-flip-stack";

describe("homepage flip stack", () => {
  it("maps legacy hash ids to flip panels", () => {
    expect(flipPanelFromHash("")).toBe("nav-cube");
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

  it("orders game above The Moves Like face (land on nav-cube)", () => {
    expect(flipPanelIndex("home-game")).toBe(0);
    expect(flipPanelIndex("nav-cube")).toBe(1);
  });

  it("uses discrete nudge flips with RAF settle (no continuous wheel scrub)", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("ensureTick");
    expect(flipSrc).toContain("NUDGE_DEBOUNCE_MS");
    expect(flipSrc).toContain("const nudge = ");
    expect(flipSrc).toContain("isAnimating");
    expect(flipSrc).toContain("WHEEL_OVERSCROLL_FLIP_PX");
    expect(flipSrc).toContain("WHEEL_OVERSCROLL_MIN_EVENTS");
    expect(flipSrc).toContain("AT_TOP_DWELL_MS");
    expect(flipSrc).toContain("AT_TOP_INERTIA_LOCK_MS");
    expect(flipSrc).toContain("TOUCH_LEAVE_PX");
    expect(flipSrc).toContain("onPlatformWheel");
    expect(flipSrc).toContain("scroll-auto");
    expect(flipSrc).toContain("PLATFORM_WHEEL_LOCK_MS");
    expect(flipSrc).toContain("onScrollerWheelCapture");
    expect(flipSrc).toContain("platformScrollMode");
    expect(flipSrc).toContain("data-homepage-flip-scroll");
    expect(flipSrc).toContain("scrollRef");
    expect(flipSrc).toContain("syncOverlayVisuals");
    expect(flipSrc).toContain("overlayScrollEnabled");
    expect(flipSrc).toContain("OVERLAY_FADE_START = 0.88");
    expect(flipSrc).toContain("resetPlatformScroll");
    expect(flipSrc).toContain('panelId === "home-game" && direction > 0');
    expect(flipSrc).toContain('panelId === "nav-cube"');
    expect(flipSrc).toMatch(/panelId === "nav-cube"[\s\S]*direction > 0[\s\S]*return false/);
    expect(flipSrc).toMatch(/const tick = \(now: number\) => \{[\s\S]*animRef\.current = 0/);
    expect(flipSrc).not.toContain("paintDirect");
    expect(flipSrc).not.toContain("scheduleSnap");
    expect(flipSrc).not.toContain("virtualIndexRef");
    expect(flipSrc).not.toContain("scrubbingRef");
  });

  it("keeps mobile scroll native (no touchmove preventDefault, passive platform touch)", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    // iPhone froze when flip RAF + touchmove preventDefault ran together.
    expect(flipSrc).not.toContain('addEventListener("touchmove", onTouchMove');
    expect(flipSrc).toContain(
      'addEventListener("touchmove", onPlatformTouchMove, { passive: true })',
    );
    expect(flipSrc).toContain("TOUCH_LEAVE_PX");
    expect(flipSrc).toContain("isTouchPrimaryDevice");
    expect(flipSrc).toContain("touchPrimaryRef");
    // body overflow:hidden only on non-touch — it breaks iOS fixed overlay scroll.
    expect(flipSrc).toContain("if (!touchPrimaryRef.current)");
    expect(flipSrc).toContain('document.body.style.overflow = "hidden"');
  });

  it("keeps gesture effect deps stable (no per-render panels array)", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("[interactive, goToPanel, isAnimating]");
    expect(flipSrc).not.toContain("panels,");
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
