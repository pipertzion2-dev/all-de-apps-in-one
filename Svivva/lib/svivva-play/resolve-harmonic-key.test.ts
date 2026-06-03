import { describe, expect, it } from "vitest";
import type { TranscribedNote } from "./audio-transcription";
import { resolveHarmonicKey } from "./resolve-harmonic-key";

function note(midi: number, start = 0, dur = 0.5): TranscribedNote {
  return { midi, startSec: start, endSec: start + dur, velocity: 90, cents: 0 };
}

/** A major: A C# E, D F# A, E G# B with A in bass */
function aMajorHarmonyMidi(): TranscribedNote[] {
  const chords = [
    [45, 57, 61, 64],
    [50, 62, 66, 69],
    [52, 64, 68, 71],
    [45, 57, 61, 64],
  ];
  const out: TranscribedNote[] = [];
  let t = 0;
  for (const triad of chords) {
    for (const m of triad) out.push(note(m, t, 1.9));
    t += 2;
  }
  return out;
}

/** Melody sits on B; harmony still A major (supertonic trap). */
function aMajorWithMelodyOnB(): TranscribedNote[] {
  const base = aMajorHarmonyMidi();
  const extra: TranscribedNote[] = [];
  for (let bar = 0; bar < 4; bar++) {
    const t = bar * 2;
    for (let i = 0; i < 12; i++) {
      extra.push(note(71 + (i % 3), t + 0.05 + i * 0.07, 0.28));
    }
  }
  return [...base, ...extra];
}

describe("resolveHarmonicKey", () => {
  it("keeps A major from audio when Melodyne notes would suggest B", () => {
    const resolved = resolveHarmonicKey({
      audioKey: "A major",
      audioConfidence: 78,
      midiNotes: aMajorWithMelodyOnB(),
      bpm: 120,
    });
    expect(resolved.key).toBe("A major");
    expect(resolved.source).toBe("audio");
    expect(resolved.confidence).toBeGreaterThanOrEqual(68);
  });

  it("keeps A major when chord timeline matches audio but chroma leans B", () => {
    const resolved = resolveHarmonicKey({
      audioKey: "A major",
      audioConfidence: 72,
      midiNotes: aMajorHarmonyMidi(),
      chords: [
        { t0: 0, t1: 2, symbol: "A", confidence: 80, pitchClasses: [9, 1, 4] },
        { t0: 2, t1: 4, symbol: "D", confidence: 80, pitchClasses: [2, 6, 9] },
        { t0: 4, t1: 6, symbol: "E", confidence: 80, pitchClasses: [4, 8, 11] },
      ],
      bpm: 120,
    });
    expect(resolved.key).toBe("A major");
  });

  it("uses MIDI when audio is wrong B but harmony is clearly A major", () => {
    const resolved = resolveHarmonicKey({
      audioKey: "B major",
      audioConfidence: 55,
      midiNotes: aMajorHarmonyMidi(),
      bpm: 120,
    });
    expect(resolved.key).toBe("A major");
  });

  it("respects user hint over audio and MIDI", () => {
    const resolved = resolveHarmonicKey({
      audioKey: "B major",
      audioConfidence: 90,
      midiNotes: aMajorHarmonyMidi(),
      bpm: 120,
      keyHint: "key of A major",
    });
    expect(resolved.key).toBe("A major");
    expect(resolved.source).toBe("hint");
  });
});
