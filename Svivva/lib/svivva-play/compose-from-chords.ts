import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { composeCounterpoint, composeHocket, type VoicePart } from "./reich-engine";
import type { HocketGrooveStyle } from "./hocket-groove-v2";
import type { ScaleResolution } from "./reich-engine";
import * as ChordKit from "./chordkit";
import {
  chordSegmentPitchClasses,
  clampNoteToRegister,
  melodicAnchorMidi,
  snapNoteToPitchClasses,
} from "./scale-key-guard";

function parseChordRoot(symbol: string): number {
  const m = symbol.match(/^([A-Ga-g][#b♭♯]?)/);
  return ChordKit.parseRoot(m?.[1] ?? "C");
}

/** Absolute pitch classes (0–11) for a chord symbol. */
function pitchClassesForSymbol(symbol: string): number[] {
  const root = parseChordRoot(symbol);
  const s = symbol.toLowerCase();
  if (s.includes("dim")) return [0, 3, 6].map((p) => (root + p) % 12);
  if (s.includes("m7") && !s.includes("maj")) return [0, 3, 7, 10].map((p) => (root + p) % 12);
  if (s.includes("maj7") || s.includes("ma7")) return [0, 4, 7, 11].map((p) => (root + p) % 12);
  if (s.includes("7")) return [0, 4, 7, 10].map((p) => (root + p) % 12);
  if (/m(?!aj)/.test(s) || s.includes("min")) return [0, 3, 7].map((p) => (root + p) % 12);
  return [0, 4, 7].map((p) => (root + p) % 12);
}

function absolutePitchClassesForChord(chord: ChordSegment): number[] {
  return chordSegmentPitchClasses(chord);
}

function chordAtTime(chords: ChordSegment[], tSec: number): ChordSegment | null {
  for (const c of chords) {
    if (tSec >= c.t0 && tSec < c.t1) return c;
  }
  return chords[chords.length - 1] ?? null;
}

function noteFromChordTone(
  chord: ChordSegment,
  voiceIndex: number,
  referenceNote: number,
  anchorMidi?: number,
  role: "melody" | "harmony" = "harmony",
): number {
  const pcs = absolutePitchClassesForChord(chord);
  if (pcs.length === 0) {
    return clampNoteToRegister(referenceNote, role, { anchorMidi });
  }
  const targetPc = pcs[voiceIndex % pcs.length]!;
  let octave = Math.floor(referenceNote / 12);
  let note = octave * 12 + targetPc;
  while (note < referenceNote - 7) note += 12;
  while (note > referenceNote + 7) note -= 12;
  note = snapNoteToPitchClasses(note, new Set(pcs));
  return clampNoteToRegister(note, role, { anchorMidi });
}

function alignVoicesToProgression(options: {
  base: VoicePart[];
  chords: ChordSegment[];
  bpm: number;
  guideNotes: TranscribedNote[];
  anchorMidi?: number;
}): VoicePart[] {
  const { base, chords, bpm, guideNotes, anchorMidi } = options;
  const beatSec = 60 / bpm;

  return base.map((voice, vi) => {
    const role = vi === 0 ? "melody" : "harmony";
    const notes = voice.notes.map((n) => {
      const tSec = n.startBeat * beatSec;
      const chord = chordAtTime(chords, tSec);

      const nearbyGuide = guideNotes.filter(
        (gn) => Math.abs(gn.startSec - tSec) < beatSec * 0.45,
      );
      if (nearbyGuide.length > 0 && (vi === 0 || vi % 2 === 1)) {
        const guide = nearbyGuide[vi % nearbyGuide.length]!;
        let note = guide.midi;
        if (chord) {
          const pcs = new Set(absolutePitchClassesForChord(chord));
          if (!pcs.has(note % 12)) {
            note = snapNoteToPitchClasses(note, pcs);
          }
        }
        return { ...n, note: clampNoteToRegister(note, role, { anchorMidi }) };
      }

      if (!chord) {
        return {
          ...n,
          note: clampNoteToRegister(n.note, role, { anchorMidi }),
        };
      }

      return {
        ...n,
        note: noteFromChordTone(chord, vi, n.note, anchorMidi, role),
      };
    });
    return { ...voice, notes };
  });
}

/** Bias hocket/counterpoint toward the analyzed chord map + optional audio/Melodyne guide. */
export function composeWithChordProgression(options: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  style: "reich_electric" | "shaw_interlace" | "phase_canon";
  seed: number;
  type: "counterpoint" | "hocket";
  chords: ChordSegment[];
  melodyneNotes?: TranscribedNote[];
  audioNotes?: TranscribedNote[];
  hocketGroove?: HocketGrooveStyle;
}): VoicePart[] {
  const {
    durationSec,
    bpm,
    scale,
    style,
    seed,
    type,
    chords,
    melodyneNotes = [],
    audioNotes = [],
    hocketGroove,
  } = options;
  const base =
    type === "counterpoint"
      ? composeCounterpoint({ durationSec, bpm, scale, style, seed })
      : composeHocket({ durationSec, bpm, scale, style, seed, hocketGroove });

  if (!chords.length) return base;

  const guideNotes = melodyneNotes.length > 0 ? melodyneNotes : audioNotes;
  const anchor = melodicAnchorMidi(guideNotes);

  return alignVoicesToProgression({
    base,
    chords,
    bpm,
    guideNotes,
    anchorMidi: anchor,
  });
}
