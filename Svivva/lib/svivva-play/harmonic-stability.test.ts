import { describe, expect, it } from "vitest";
import { clampNoteToRegister, stabilizeHarmonicTimeline } from "./scale-key-guard";

describe("stabilizeHarmonicTimeline", () => {
  it("collapses repeated symbols to one region for static harmony", () => {
    const chords = [
      { t0: 0, t1: 4, symbol: "A maj", confidence: 70, pitchClasses: [0, 4, 7] },
      { t0: 4, t1: 8, symbol: "A", confidence: 55, pitchClasses: [0, 4, 7] },
      { t0: 8, t1: 12, symbol: "Amaj", confidence: 60, pitchClasses: [0, 4, 7] },
    ];
    const out = stabilizeHarmonicTimeline(chords, 12, 120);
    expect(out).toHaveLength(1);
    expect(out[0]?.t0).toBe(0);
    expect(out[0]?.t1).toBe(12);
  });

  it("collapses same-root false changes (Am vs Am7)", () => {
    const chords = [
      { t0: 0, t1: 8, symbol: "Am", confidence: 80, pitchClasses: [0, 3, 7] },
      { t0: 8, t1: 16, symbol: "Am7", confidence: 50, pitchClasses: [0, 3, 7, 10] },
    ];
    const out = stabilizeHarmonicTimeline(chords, 16, 120);
    expect(out).toHaveLength(1);
  });
});

describe("clampNoteToRegister", () => {
  it("keeps melody near anchor and below ceiling", () => {
    expect(clampNoteToRegister(96, "melody", { anchorMidi: 67 })).toBeLessThanOrEqual(84);
    expect(clampNoteToRegister(96, "melody", { anchorMidi: 67 })).toBeGreaterThanOrEqual(55);
  });
});
