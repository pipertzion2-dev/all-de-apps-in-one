import { describe, expect, it } from "vitest";
import { resolveCompositionScale } from "./scale-key-guard";

describe("resolveCompositionScale", () => {
  it("prefers explicit major scale over minor key detection and Am chords", () => {
    const { scaleInfo, resolution } = resolveCompositionScale(
      "A minor",
      "major",
      null,
      [{ t0: 0, t1: 4, symbol: "Am", confidence: 80, pitchClasses: [0, 3, 7] }],
    );
    expect(scaleInfo.isMinor).toBe(false);
    expect(resolution.detectedMode).toBe("major");
    expect(scaleInfo.scalePcs.has(9)).toBe(true); // A
    expect(scaleInfo.scalePcs.has(11)).toBe(true); // B — major 7th, not in natural minor
  });

  it("respects manual major key override", () => {
    const { scaleInfo } = resolveCompositionScale(
      "A minor",
      "major",
      "A major",
      [{ t0: 0, t1: 4, symbol: "Am", confidence: 80, pitchClasses: [0, 3, 7] }],
    );
    expect(scaleInfo.isMinor).toBe(false);
    expect(scaleInfo.keyLabel).toBe("A major");
  });
});
