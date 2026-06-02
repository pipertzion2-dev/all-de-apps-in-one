import { describe, expect, it } from "vitest";
import type { TranscribedNote } from "./audio-transcription";
import { detectKeyFromMidiNotes, resolveKeyWithMelodyne } from "./key-from-notes";

function note(midi: number, start = 0, dur = 0.5): TranscribedNote {
  return { midi, startSec: start, endSec: start + dur, velocity: 90, cents: 0 };
}

/** A major triads: A C# E, D F# A, E G# B */
function aMajorProgression(): TranscribedNote[] {
  const chords = [
    [57, 61, 64],
    [62, 66, 69],
    [64, 68, 71],
  ];
  const out: TranscribedNote[] = [];
  let t = 0;
  for (const triad of chords) {
    for (const m of triad) out.push(note(m, t, 1.8));
    t += 2;
  }
  return out;
}

describe("key-from-notes", () => {
  it("detects A major from Melodyne-style triads", () => {
    const det = detectKeyFromMidiNotes(aMajorProgression());
    expect(det?.key).toBe("A major");
    expect(det!.confidence).toBeGreaterThan(50);
  });

  it("prefers MIDI key over wrong audio key", () => {
    const resolved = resolveKeyWithMelodyne("C# major", 75, aMajorProgression());
    expect(resolved.key).toBe("A major");
    expect(resolved.source).toBe("midi");
  });
});
