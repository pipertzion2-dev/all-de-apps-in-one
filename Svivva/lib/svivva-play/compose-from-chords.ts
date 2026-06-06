import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { composeCounterpoint, composeHocket, type VoicePart } from "./reich-engine";
import type { HocketGrooveStyle } from "./hocket-groove-v2";
import type { ScaleResolution } from "./reich-engine";
import type { PatternLength } from "./pattern-length";
import {
  chordSegmentPitchClasses,
  clampNoteToRegister,
  melodicAnchorMidi,
  snapNoteToPitchClasses,
} from "./scale-key-guard";

function chordAtTime(chords: ChordSegment[], tSec: number): ChordSegment | null {
  for (const c of chords) {
    if (tSec >= c.t0 && tSec < c.t1) return c;
  }
  return chords[chords.length - 1] ?? null;
}

/**
 * Keep Reich/V-2 melodic motion (scale tones, passing notes, voice-leading tension).
 * Only correct notes that are outside both the session scale and current chord.
 */
function softHarmonicNudge(
  note: number,
  chord: ChordSegment | null,
  scalePcs: Set<number>,
  role: string,
  anchorMidi?: number,
): number {
  let n = note;
  const pc = ((n % 12) + 12) % 12;
  if (chord) {
    const chordPcs = new Set(chordSegmentPitchClasses(chord));
    if (!chordPcs.has(pc) && !scalePcs.has(pc)) {
      n = snapNoteToPitchClasses(n, chordPcs);
    }
  } else if (!scalePcs.has(pc)) {
    n = snapNoteToPitchClasses(n, scalePcs);
  }
  return clampNoteToRegister(n, role, { anchorMidi });
}

/** Bias counterpoint toward the analyzed chord map; hocket keeps full procedural musicality. */
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
  patternLength?: PatternLength;
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
    patternLength,
  } = options;
  const base =
    type === "counterpoint"
      ? composeCounterpoint({ durationSec, bpm, scale, style, seed, patternLength })
      : composeHocket({ durationSec, bpm, scale, style, seed, hocketGroove, patternLength });

  if (!chords.length) return base;

  const guideNotes = melodyneNotes.length > 0 ? melodyneNotes : audioNotes;
  const anchor = melodicAnchorMidi(guideNotes);
  const scalePcs = new Set(scale.pitchClasses);

  // Six-voice Reich interlock: preserve master-cell variety + strategic scale/chord color.
  if (type === "hocket") {
    const beatSec = 60 / bpm;
    return base.map((voice, vi) => ({
      ...voice,
      notes: voice.notes.map((n) => {
        const tSec = n.startBeat * beatSec;
        const chord = chordAtTime(chords, tSec);
        return {
          ...n,
          note: softHarmonicNudge(
            n.note,
            chord,
            scalePcs,
            vi === 0 ? "melody" : "hocket",
            anchor,
          ),
        };
      }),
    }));
  }

  const beatSec = 60 / bpm;
  return base.map((voice, vi) => {
    const role = vi === 0 ? "melody" : "harmony";
    const notes = voice.notes.map((n) => {
      const tSec = n.startBeat * beatSec;
      const chord = chordAtTime(chords, tSec);
      const nearbyGuide = guideNotes.filter(
        (gn) => Math.abs(gn.startSec - tSec) < beatSec * 0.45,
      );
      if (nearbyGuide.length > 0 && vi > 0) {
        const guide = nearbyGuide[vi % nearbyGuide.length]!;
        return { ...n, note: softHarmonicNudge(guide.midi, chord, scalePcs, role, anchor) };
      }
      return { ...n, note: softHarmonicNudge(n.note, chord, scalePcs, role, anchor) };
    });
    return { ...voice, notes };
  });
}
