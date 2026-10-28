import { describe, expect, it } from "vitest";
import {
  easeInOutCubic,
  fineFlipAngleProgress,
  HOMEPAGE_FINE_FLIP_MS,
} from "../homepage-fine-flip";
import { homepagePanelsAreAdjacent } from "../homepage-scroll";

describe("homepage fine flip", () => {
  it("uses a longer ease for continuous face transitions", () => {
    expect(HOMEPAGE_FINE_FLIP_MS).toBeGreaterThanOrEqual(700);
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
  });

  it("peaks mid-flip then eases back to flat", () => {
    expect(fineFlipAngleProgress(0)).toBe(0);
    expect(fineFlipAngleProgress(1)).toBe(0);
    expect(fineFlipAngleProgress(0.42)).toBeGreaterThan(0.95);
    expect(fineFlipAngleProgress(0.2)).toBeGreaterThan(0);
    expect(fineFlipAngleProgress(0.2)).toBeLessThan(1);
  });

  it("treats story and white game as adjacent (smooth scroll path)", () => {
    expect(homepagePanelsAreAdjacent("nav-cube", "home-game")).toBe(true);
    expect(homepagePanelsAreAdjacent("home-game", "nav-cube")).toBe(true);
    expect(homepagePanelsAreAdjacent("home-beta", "nav-cube")).toBe(true);
    expect(homepagePanelsAreAdjacent("home-game", "home-beta")).toBe(false);
    expect(homepagePanelsAreAdjacent("home-beta", "home-game")).toBe(false);
  });
});
