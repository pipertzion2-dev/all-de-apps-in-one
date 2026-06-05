import { describe, expect, it } from "vitest";
import {
  chordSegmentPitchClasses,
  clampNoteToRegister,
  constrainMidiEvent,
  parseScaleFromKey,
  resolveCompositionKey,
  resolveCompositionScale,
} from "./scale-key-guard";

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

  it("keeps A major when vi chords (Am) appear in a major progression", () => {
    const key = resolveCompositionKey({
      analysisKey: "A major",
      audioAnchorKey: "A major",
      chords: [
        { t0: 0, t1: 2, symbol: "Am", confidence: 80, pitchClasses: [] },
        { t0: 2, t1: 4, symbol: "F", confidence: 80, pitchClasses: [] },
        { t0: 4, t1: 6, symbol: "C", confidence: 80, pitchClasses: [] },
        { t0: 6, t1: 8, symbol: "G", confidence: 80, pitchClasses: [] },
      ],
    });
    expect(key).toBe("A major");
  });
});

describe("chordSegmentPitchClasses", () => {
  it("reads absolute pitchClasses from chroma detection", () => {
    const pcs = chordSegmentPitchClasses({
      t0: 0,
      t1: 2,
      symbol: "A",
      confidence: 80,
      pitchClasses: [9, 1, 4],
    });
    expect(pcs).toEqual([1, 4, 9]);
  });

  it("reads root-relative pitchClasses from Melodyne-style storage", () => {
    const pcs = chordSegmentPitchClasses({
      t0: 0,
      t1: 2,
      symbol: "Am",
      confidence: 80,
      pitchClasses: [0, 3, 7],
    });
    expect(pcs).toEqual([0, 4, 9]); // A C E
  });
});

describe("clampNoteToRegister", () => {
  it("preserves pitch class when clamping into melodic register", () => {
    expect(clampNoteToRegister(45, "melody")).toBe(57);
  });
});

describe("constrainMidiEvent hocket", () => {
  it("keeps scale tones that are not current chord tones (strategic color)", () => {
    const scale = parseScaleFromKey("A major");
    const evt = { note: 62, velocity: 80, startBeat: 0, duration: 0.25, channel: 0 };
    const chords = [{ t0: 0, t1: 4, symbol: "A", confidence: 80, pitchClasses: [9, 1, 4] }];
    const out = constrainMidiEvent(evt, scale, "hocket", chords, 120);
    expect(out.note % 12).toBe(2); // D — scale tone, not A-triad, preserved
  });
});
