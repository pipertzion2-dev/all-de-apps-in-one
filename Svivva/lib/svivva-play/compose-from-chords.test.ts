import { describe, expect, it } from "vitest";
import { composeWithChordProgression } from "./compose-from-chords";
import { resolveCompositionScale } from "./scale-key-guard";

function allowedPcsForChord(symbol: string): Set<number> {
  const map: Record<string, number[]> = {
    A: [9, 1, 4],
    D: [2, 6, 9],
    E: [4, 8, 11],
  };
  return new Set(map[symbol] ?? []);
}

function chordAtBeat(
  chords: { t0: number; t1: number; symbol: string }[],
  beat: number,
  bpm: number,
): string {
  const tSec = (beat * 60) / bpm;
  for (const c of chords) {
    if (tSec >= c.t0 && tSec < c.t1) return c.symbol;
  }
  return chords[chords.length - 1]?.symbol ?? "?";
}

describe("composeWithChordProgression", () => {
  it("aligns hocket notes to chord tones at each beat (A major progression)", () => {
    const chords = [
      { t0: 0, t1: 2, symbol: "A", confidence: 80, pitchClasses: [] },
      { t0: 2, t1: 4, symbol: "D", confidence: 80, pitchClasses: [] },
      { t0: 4, t1: 6, symbol: "E", confidence: 80, pitchClasses: [] },
    ];
    const { resolution: scale } = resolveCompositionScale("A major", "major", null, chords);
    const voices = composeWithChordProgression({
      durationSec: 6,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      type: "hocket",
      chords,
    });

    expect(voices.length).toBeGreaterThan(0);
    for (const voice of voices) {
      for (const n of voice.notes) {
        const sym = chordAtBeat(chords, n.startBeat, 120);
        const allowed = allowedPcsForChord(sym);
        const pc = n.note % 12;
        expect(allowed.has(pc)).toBe(true);
      }
    }
  });

  it("uses absolute pitchClasses from chroma without double-adding root", () => {
    const chords = [
      { t0: 0, t1: 4, symbol: "A", confidence: 80, pitchClasses: [9, 1, 4] },
    ];
    const { resolution: scale } = resolveCompositionScale("A major", "major", null, chords);
    const voices = composeWithChordProgression({
      durationSec: 4,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 7,
      type: "hocket",
      chords,
    });
    for (const voice of voices) {
      for (const n of voice.notes) {
        expect([9, 1, 4].includes(n.note % 12)).toBe(true);
      }
    }
  });
});
