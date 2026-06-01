import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { composeCounterpoint, composeHocket, type VoicePart } from "./reich-engine";
import type { ScaleResolution } from "./reich-engine";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function parseChordRoot(symbol: string): number {
  const m = symbol.match(/^([A-G][#b]?)/i);
  if (!m) return 0;
  const idx = NOTE_NAMES.findIndex((n) => n.toLowerCase() === m[1].replace(/b/g, "b"));
  return idx >= 0 ? idx : 0;
}

function pitchClassesForSymbol(symbol: string): number[] {
  const root = parseChordRoot(symbol);
  const s = symbol.toLowerCase();
  if (s.includes("dim")) return [0, 3, 6].map((p) => (root + p) % 12);
  if (s.includes("m7") && !s.includes("maj")) return [0, 3, 7, 10].map((p) => (root + p) % 12);
  if (s.includes("maj7") || s.includes("ma7")) return [0, 4, 7, 11].map((p) => (root + p) % 12);
  if (s.includes("7")) return [0, 4, 7, 10].map((p) => (root + p) % 12);
  if (s.includes("m")) return [0, 3, 7].map((p) => (root + p) % 12);
  return [0, 4, 7].map((p) => (root + p) % 12);
}

function chordAtTime(chords: ChordSegment[], tSec: number): ChordSegment | null {
  for (const c of chords) {
    if (tSec >= c.t0 && tSec < c.t1) return c;
  }
  return chords[chords.length - 1] ?? null;
}

/** Bias counterpoint degrees toward chord progression; optional Melodyne notes anchor harmony. */
export function composeWithChordProgression(options: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  style: "reich_electric" | "shaw_interlace" | "phase_canon";
  seed: number;
  type: "counterpoint" | "hocket";
  chords: ChordSegment[];
  melodyneNotes?: TranscribedNote[];
}): VoicePart[] {
  const { durationSec, bpm, scale, style, seed, type, chords, melodyneNotes = [] } = options;
  const base =
    type === "counterpoint"
      ? composeCounterpoint({ durationSec, bpm, scale, style, seed })
      : composeHocket({ durationSec, bpm, scale, style, seed });

  if (!chords.length) return base;

  const beatSec = 60 / bpm;
  return base.map((voice, vi) => {
    const notes = voice.notes.map((n) => {
      const tSec = n.startBeat * beatSec;
      const chord = chordAtTime(chords, tSec);
      const nearbyMelodyne = melodyneNotes.filter(
        (mn) => Math.abs(mn.startSec - tSec) < beatSec * 0.45,
      );
      if (nearbyMelodyne.length > 0 && vi > 0) {
        const anchor = nearbyMelodyne[vi % nearbyMelodyne.length];
        return { ...n, note: anchor.midi };
      }
      if (!chord) return n;
      const pcs =
        chord.pitchClasses?.length > 0 ? chord.pitchClasses : pitchClassesForSymbol(chord.symbol);
      const root = parseChordRoot(chord.symbol);
      const targetPc = pcs[vi % pcs.length];
      const octave = Math.floor(n.note / 12);
      let note = octave * 12 + ((root + targetPc) % 12);
      if (note < 48) note += 12;
      if (note > 84) note -= 12;
      return { ...n, note };
    });
    return { ...voice, notes };
  });
}
