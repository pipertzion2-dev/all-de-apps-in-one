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
    expect(flipPanelFromHash("home-explore")).toBe("home-explore");
  });

  it("round-trips hash helpers", () => {
    expect(hashForFlipPanel("nav-cube")).toBe("nav-cube");
    expect(hashForFlipPanel("home-game")).toBe("home-game");
    expect(hashForFlipPanel("home-explore")).toBe("home-explore");
  });

  it("orders game, explore, then nav cube (three faces)", () => {
    expect(flipPanelIndex("home-game")).toBe(0);
    expect(flipPanelIndex("home-explore")).toBe(1);
    expect(flipPanelIndex("nav-cube")).toBe(2);
  });

  it("uses discrete panel nudges with smooth RAF settling", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("ensureTick");
    expect(flipSrc).toContain("const nudge = (direction: 1 | -1)");
    expect(flipSrc).toContain("NUDGE_DEBOUNCE_MS");
    expect(flipSrc).toContain('panelId === "home-game" && direction > 0');
    expect(flipSrc).not.toContain("virtualIndexRef");
    expect(flipSrc).not.toContain("scheduleSnap");
    expect(flipSrc).toMatch(/const tick = \(now: number\) => \{[\s\S]*animRef\.current = 0/);
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
  });
});
