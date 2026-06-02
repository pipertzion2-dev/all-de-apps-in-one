import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { parseKeyFromUserHint, normalizeKeyLabel } from "./analysis-utils";
import {
  detectKeyFromMidiNotes,
  inferKeyFromChordSegments,
  type KeyFromNotesResult,
} from "./key-from-notes";

export type HarmonicKeySource = "hint" | "midi" | "audio";

export function resolveHarmonicKey(options: {
  audioKey: string;
  audioConfidence: number;
  midiNotes: TranscribedNote[];
  chords?: ChordSegment[];
  bpm: number;
  keyHint?: string | null;
}): { key: string; confidence: number; source: HarmonicKeySource } {
  const { audioKey, audioConfidence, midiNotes, chords = [], bpm, keyHint } = options;

  const hint = parseKeyFromUserHint(keyHint ?? undefined);
  if (hint) {
    return { key: normalizeKeyLabel(hint), confidence: 95, source: "hint" };
  }

  const fromMidi: KeyFromNotesResult | null =
    midiNotes.length >= 4 ? detectKeyFromMidiNotes(midiNotes, bpm) : null;
  const fromChords: KeyFromNotesResult | null =
    chords.length >= 2 ? inferKeyFromChordSegments(chords) : null;

  if (fromMidi && fromChords) {
    const sameRoot = fromMidi.rootPc === fromChords.rootPc;
    const sameMode = fromMidi.isMinor === fromChords.isMinor;
    if (sameRoot && sameMode) {
      return {
        key: fromMidi.key,
        confidence: Math.max(fromMidi.confidence, fromChords.confidence, 78),
        source: "midi",
      };
    }
    if (fromChords.confidence >= fromMidi.confidence - 8) {
      return { key: fromChords.key, confidence: fromChords.confidence, source: "midi" };
    }
    return { key: fromMidi.key, confidence: fromMidi.confidence, source: "midi" };
  }

  if (fromChords) {
    return { key: fromChords.key, confidence: fromChords.confidence, source: "midi" };
  }
  if (fromMidi) {
    return { key: fromMidi.key, confidence: fromMidi.confidence, source: "midi" };
  }

  return { key: audioKey, confidence: audioConfidence, source: "audio" };
}

/** Melodyne-aware key resolution (notes + chord timeline + optional hint). */
export function resolveKeyWithMelodyne(
  audioKey: string,
  audioConfidence: number,
  midiNotes: TranscribedNote[],
  bpm = 120,
  chords?: ChordSegment[],
): { key: string; confidence: number; source: "midi" | "audio" } {
  const resolved = resolveHarmonicKey({
    audioKey,
    audioConfidence,
    midiNotes,
    chords,
    bpm,
  });
  return {
    key: resolved.key,
    confidence: resolved.confidence,
    source: resolved.source === "audio" ? "audio" : "midi",
  };
}
