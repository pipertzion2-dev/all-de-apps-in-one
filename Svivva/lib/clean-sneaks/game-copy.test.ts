import { describe, expect, it } from "vitest";
import {
  KLEAN_BUNDLE_CARD_HEADLINE,
  KLEAN_HOMEPAGE_TAGLINE,
  KLEAN_RUNNER_INTRO_LINE,
} from "./game-copy";

describe("Klean Sneaks game copy", () => {
  it("opens with shoe protection theme", () => {
    expect(KLEAN_RUNNER_INTRO_LINE).toMatch(/Protect your shoes/i);
    expect(KLEAN_RUNNER_INTRO_LINE).toMatch(/Klean/i);
  });

  it("names the card game with bundle protection theme", () => {
    expect(KLEAN_BUNDLE_CARD_HEADLINE).toBe("Protect your bundle!");
  });

  it("states homepage protection from cameras and wear", () => {
    expect(KLEAN_HOMEPAGE_TAGLINE).toMatch(/cameras/i);
    expect(KLEAN_HOMEPAGE_TAGLINE).toMatch(/everyday wear/i);
  });
});
