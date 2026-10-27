import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  flipPanelFromHash,
  flipPanelIndex,
  hashForFlipPanel,
  HOMEPAGE_FLIP_PANELS,
} from "../homepage-flip-stack";

describe("homepage flip stack", () => {
  it("maps legacy hash ids to flip panels", () => {
    expect(flipPanelFromHash("")).toBe("home-beta");
    expect(flipPanelFromHash("nav-cube")).toBe("nav-cube");
    expect(flipPanelFromHash("home-game")).toBe("home-game");
    expect(flipPanelFromHash("clean-sneaks")).toBe("home-game");
    expect(flipPanelFromHash("home-moves")).toBe("home-beta");
    expect(flipPanelFromHash("the-moves-like")).toBe("home-beta");
    expect(flipPanelFromHash("home-beta")).toBe("home-beta");
    expect(flipPanelFromHash("beta-apps")).toBe("home-beta");
    expect(flipPanelFromHash("home-explore")).toBe("home-beta");
    expect(flipPanelFromHash("oaas")).toBe("home-beta");
    expect(flipPanelFromHash("pricing")).toBe("nav-cube");
    expect(flipPanelFromHash("about")).toBe("nav-cube");
  });

  it("round-trips hash helpers", () => {
    expect(hashForFlipPanel("nav-cube")).toBe("nav-cube");
    expect(hashForFlipPanel("home-game")).toBe("home-game");
    expect(hashForFlipPanel("home-beta")).toBe("home-beta");
  });

  it("orders two main-app cube faces: beta → combined", () => {
    expect(HOMEPAGE_FLIP_PANELS).toEqual(["home-beta", "nav-cube"]);
    expect(flipPanelIndex("home-beta")).toBe(0);
    expect(flipPanelIndex("nav-cube")).toBe(1);
  });

  it("runs a timed 3D cube flip with button-only panel changes", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("FLIP_DURATION_MS");
    expect(flipSrc).toContain("FLIP_DURATION_MOBILE_MS");
    expect(flipSrc).toContain("easeInOutCubic");
    expect(flipSrc).toContain("ensureTick");
    expect(flipSrc).toContain("contentHost");
    expect(flipSrc).toContain('updateContentHost("face")');
    expect(flipSrc).toContain('updateContentHost("overlay")');
    expect(flipSrc).toContain('updateContentHost("handoff")');
    expect(flipSrc).toContain("data-homepage-flip-scroll");
    expect(flipSrc).toContain("data-homepage-flip-stack");
    expect(flipSrc).toContain('data-flip-input="buttons-only"');
    expect(flipSrc).toContain("settledOnPlatform");
    expect(flipSrc).toContain('initialPanel = "home-game"');
    expect(flipSrc).toContain("HOMEPAGE_FLIP_EVENT");
    expect(flipSrc).not.toContain('addEventListener("wheel"');
    expect(flipSrc).not.toContain("onWheel");
    expect(flipSrc).not.toContain("onPlatformWheel");
    expect(flipSrc).not.toContain("GAME_WHEEL_FLIP_PX");
    expect(flipSrc).not.toContain("WHEEL_OVERSCROLL_FLIP_PX");
    expect(flipSrc).not.toContain("nudge(");
    expect(flipSrc).not.toContain("paintDirect");
    expect(flipSrc).not.toContain("scheduleSnap");
    expect(flipSrc).not.toContain("virtualIndexRef");
  });

  it("hands off face → overlay without blanking the scroller", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain('"face" | "handoff" | "overlay"');
    expect(flipSrc).toContain("showFaceContent");
    expect(flipSrc).toContain("showOverlayContent");
    expect(flipSrc).toContain('contentHostRef.current === "overlay"');
  });

  it("shows the scroll overlay from live contentHost, not initialPanel", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain(
      'const showOverlay = contentHost === "overlay" && activePanel === "nav-cube"',
    );
    expect(flipSrc).not.toContain('const onPlatform = initialPanel === "nav-cube"');
    expect(flipSrc).toContain("opacity: showOverlay ? 1 : 0");
    expect(flipSrc).toContain('pointerEvents: showOverlay ? "auto" : "none"');
  });

  it("keeps overlay scroll fully native (no touch leave flip)", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).not.toContain('addEventListener("touchmove"');
    expect(flipSrc).not.toContain("TOUCH_LEAVE_PX");
    expect(flipSrc).not.toContain("onGameTouchEnd");
    expect(flipSrc).not.toContain("onPlatformTouchEnd");
    expect(flipSrc).toContain('overscrollBehaviorY: "none"');
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
});
