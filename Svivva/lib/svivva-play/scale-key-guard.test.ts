import { describe, expect, it } from "vitest";
import { resolveCompositionKey, resolveCompositionScale } from "./scale-key-guard";

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

  it("locks to major when scale dropdown is major despite Am chords", () => {
    const { scaleInfo } = resolveCompositionScale(
      "C major",
      "major",
      null,
      [{ t0: 0, t1: 4, symbol: "Am", confidence: 80, pitchClasses: [0, 3, 7] }],
    );
    expect(scaleInfo.isMinor).toBe(false);
  });
});

describe("resolveCompositionKey", () => {
  it("prefers chord-map tonic over stale C major when audio anchor agrees", () => {
    const key = resolveCompositionKey({
      analysisKey: "C major",
      audioAnchorKey: "Eb major",
      chords: [
        { t0: 0, t1: 2, symbol: "Eb", confidence: 80, pitchClasses: [] },
        { t0: 2, t1: 4, symbol: "Bb", confidence: 80, pitchClasses: [] },
        { t0: 4, t1: 6, symbol: "F", confidence: 80, pitchClasses: [] },
      ],
    });
    expect(key).toBe("Eb major");
  });

  it("respects explicit manual key override", () => {
    const key = resolveCompositionKey({
      manualKey: "D major",
      analysisKey: "C major",
      audioAnchorKey: "Eb major",
      chords: [
        { t0: 0, t1: 2, symbol: "Eb", confidence: 80, pitchClasses: [] },
        { t0: 2, t1: 4, symbol: "Bb", confidence: 80, pitchClasses: [] },
      ],
    });
    expect(key).toBe("D major");
  });
});
