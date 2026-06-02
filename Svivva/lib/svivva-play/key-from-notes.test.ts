import { describe, expect, it } from "vitest";
import type { TranscribedNote } from "./audio-transcription";
import { detectKeyFromMidiNotes } from "./key-from-notes";
import { resolveKeyWithMelodyne } from "./resolve-harmonic-key";

function note(midi: number, start = 0, dur = 0.5): TranscribedNote {
  return { midi, startSec: start, endSec: start + dur, velocity: 90, cents: 0 };
}

/** A major triads: A C# E, D F# A, E G# B */
function aMajorProgression(): TranscribedNote[] {
  const chords = [
    [45, 57, 61, 64],
    [50, 62, 66, 69],
    [52, 64, 68, 71],
  ];
  const out: TranscribedNote[] = [];
  let t = 0;
  for (const triad of chords) {
    for (const m of triad) out.push(note(m, t, 1.8));
    t += 2;
  }
  return out;
}

/** Melody-heavy C# without bass — old algorithm could pick C# major */
function aMajorWithLoudMediantMelody(): TranscribedNote[] {
  const out: TranscribedNote[] = [];
  let t = 0;
  for (let bar = 0; bar < 4; bar++) {
    out.push(note(45, t, 1.5));
    out.push(note(57, t, 1.5));
    out.push(note(61, t + 0.05, 1.2));
    out.push(note(64, t + 0.05, 1.2));
    out.push(note(73, t + 0.1, 0.8));
    out.push(note(76, t + 0.15, 0.8));
    t += 2;
  }
  return out;
}

describe("key-from-notes", () => {
  it("detects A major from Melodyne-style triads", () => {
    const det = detectKeyFromMidiNotes(aMajorProgression(), 120);
    expect(det?.key).toBe("A major");
    expect(det!.confidence).toBeGreaterThan(50);
  });

  it("detects A major when C# mediant is loud in the melody", () => {
    const det = detectKeyFromMidiNotes(aMajorWithLoudMediantMelody(), 120);
    expect(det?.key).toBe("A major");
  });

  it("detects A major over C# when chord roots are A–D–E", () => {
    const notes: TranscribedNote[] = [];
    const chords = [
      [57, 61, 64],
      [62, 66, 69],
      [64, 68, 71],
      [57, 61, 64],
    ];
    let t = 0;
    for (const triad of chords) {
      for (const m of triad) notes.push(note(m, t, 1.9));
      t += 2;
    }
    for (let i = 0; i < 24; i++) notes.push(note(73 + (i % 3), 0.2 + i * 0.15, 0.12));
    const det = detectKeyFromMidiNotes(notes, 120);
    expect(det?.key).toBe("A major");
  });

  it("always prefers MIDI key over wrong audio key when Melodyne is loaded", () => {
    const resolved = resolveKeyWithMelodyne("C# major", 99, aMajorProgression(), 120);
    expect(resolved.key).toBe("A major");
    expect(resolved.source).toBe("midi");
  });

  it("keeps audio key when MIDI would falsely snap to C major", () => {
    const sparse: TranscribedNote[] = [note(60, 0, 0.2), note(64, 0.5, 0.2), note(67, 1, 0.2)];
    const resolved = resolveKeyWithMelodyne("A major", 78, sparse, 120);
    expect(resolved.key).toBe("A major");
    expect(resolved.source).toBe("audio");
  });
});
