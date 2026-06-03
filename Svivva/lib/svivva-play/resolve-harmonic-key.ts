import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { parseKeyFromUserHint, normalizeKeyLabel } from "./analysis-utils";
import {
  detectKeyFromMidiNotes,
  inferKeyFromChordSegments,
  type KeyFromNotesResult,
} from "./key-from-notes";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type HarmonicKeySource = "hint" | "midi" | "audio";

type ResolvedKey = { key: string; confidence: number; source: HarmonicKeySource };

function parseKeySignature(key: string): { rootPc: number; isMinor: boolean } | null {
  const norm = normalizeKeyLabel(key);
  const m = norm.match(/^([A-G][#b]?)\s+(major|minor)$/i);
  if (!m) return null;
  const idx = NOTE_NAMES.findIndex((n) => n === m[1]);
  return {
    rootPc: idx >= 0 ? idx : 0,
    isMinor: (m[2] ?? "major").toLowerCase() === "minor",
  };
}

function isCMajorPlaceholder(
  cand: { rootPc: number; isMinor: boolean },
  audio: { rootPc: number; isMinor: boolean },
): boolean {
  return !cand.isMinor && cand.rootPc === 0 && (audio.isMinor || audio.rootPc !== 0);
}

/** When audio and MIDI disagree, don't let weak MIDI (often C major) override good audio. */
function reconcileAudioMidiKey(
  audioKey: string,
  audioConfidence: number,
  candidate: ResolvedKey,
  fromMidi: KeyFromNotesResult | null,
): ResolvedKey {
  if (candidate.source === "hint") return candidate;

  const audio = parseKeySignature(audioKey);
  const cand = parseKeySignature(candidate.key);
  if (!audio || !cand) return candidate;

  const sameTonic = audio.rootPc === cand.rootPc && audio.isMinor === cand.isMinor;
  if (sameTonic) {
    return {
      key: normalizeKeyLabel(candidate.key),
      confidence: Math.max(candidate.confidence, audioConfidence),
      source: candidate.source === "audio" ? "audio" : "midi",
    };
  }

  // Strong note-based Melodyne detection beats wrong audio chroma (e.g. C# vs A).
  if (fromMidi && candidate.source === "midi" && fromMidi.confidence >= 72) {
    const midiSig = parseKeySignature(fromMidi.key);
    if (midiSig && !isCMajorPlaceholder(midiSig, audio)) {
      return {
        key: normalizeKeyLabel(fromMidi.key),
        confidence: fromMidi.confidence,
        source: "midi",
      };
    }
  }

  if (isCMajorPlaceholder(cand, audio) && audioConfidence >= 45) {
    return {
      key: normalizeKeyLabel(audioKey),
      confidence: audioConfidence,
      source: "audio",
    };
  }

  if (audioConfidence >= 50 && candidate.confidence < audioConfidence + 12) {
    return {
      key: normalizeKeyLabel(audioKey),
      confidence: audioConfidence,
      source: "audio",
    };
  }

  if (candidate.confidence >= audioConfidence + 18) return candidate;

  return {
    key: normalizeKeyLabel(audioKey),
    confidence: audioConfidence,
    source: "audio",
  };
}

export function resolveHarmonicKey(options: {
  audioKey: string;
  audioConfidence: number;
  midiNotes: TranscribedNote[];
  chords?: ChordSegment[];
  bpm: number;
  keyHint?: string | null;
}): ResolvedKey {
  const { audioKey, audioConfidence, midiNotes, chords = [], bpm, keyHint } = options;

  const hint = parseKeyFromUserHint(keyHint ?? undefined);
  if (hint) {
    return { key: normalizeKeyLabel(hint), confidence: 95, source: "hint" };
  }

  const fromMidi: KeyFromNotesResult | null =
    midiNotes.length >= 4 ? detectKeyFromMidiNotes(midiNotes, bpm) : null;
  const fromChords: KeyFromNotesResult | null =
    chords.length >= 2 ? inferKeyFromChordSegments(chords) : null;

  let candidate: ResolvedKey;

  if (fromMidi && fromChords) {
    const sameRoot = fromMidi.rootPc === fromChords.rootPc;
    const sameMode = fromMidi.isMinor === fromChords.isMinor;
    if (sameRoot && sameMode) {
      candidate = {
        key: fromMidi.key,
        confidence: Math.max(fromMidi.confidence, fromChords.confidence, 78),
        source: "midi",
      };
    } else {
      // Note-based key beats agnostic chord symbols (often mislabel F#m7 / C#m7 on A major).
      candidate = { key: fromMidi.key, confidence: fromMidi.confidence, source: "midi" };
    }
  } else if (fromChords) {
    candidate = { key: fromChords.key, confidence: fromChords.confidence, source: "midi" };
  } else if (fromMidi) {
    candidate = { key: fromMidi.key, confidence: fromMidi.confidence, source: "midi" };
  } else {
    return { key: normalizeKeyLabel(audioKey), confidence: audioConfidence, source: "audio" };
  }

  return reconcileAudioMidiKey(audioKey, audioConfidence, candidate, fromMidi);
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
