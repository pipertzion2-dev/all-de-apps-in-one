import { describe, expect, it } from "vitest";
import {
  KLEAN_BUNDLE_CARD_HEADLINE,
  KLEAN_DISCOVER_PERFECT_UI,
  KLEAN_HOMEPAGE_TAGLINE,
  KLEAN_RUNNER_INTRO_LINE,
  STEAL_BUNDLE_ENGLISH_TITLE,
  STEAL_BUNDLE_GERMAN_TITLE,
} from "./game-copy";

describe("Klean Sneaks game copy", () => {
  it("opens with shoe protection theme", () => {
    expect(KLEAN_RUNNER_INTRO_LINE).toMatch(/Protect your shoes/i);
    expect(KLEAN_RUNNER_INTRO_LINE).toMatch(/Klean/i);
  });

  it("names the card game with bundle protection theme", () => {
    expect(KLEAN_BUNDLE_CARD_HEADLINE).toBe("Protect your bundle!");
  });

  it("labels the reference UI remix feature", () => {
    expect(KLEAN_DISCOVER_PERFECT_UI).toBe("Discover your perfect UI");
  });

  it("states homepage protection from cameras and wear", () => {
    expect(KLEAN_HOMEPAGE_TAGLINE).toMatch(/cameras/i);
    expect(KLEAN_HOMEPAGE_TAGLINE).toMatch(/everyday wear/i);
  });

  it("keeps Steal Bundle German title matching the main graphic", () => {
    expect(STEAL_BUNDLE_GERMAN_TITLE).toMatch(/stiehl den alten Manns Bündel/i);
    expect(STEAL_BUNDLE_ENGLISH_TITLE).toMatch(/Steal the Old Man's Bundle/i);
  });
});
