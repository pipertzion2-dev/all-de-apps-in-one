import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { parseKeyFromUserHint, normalizeKeyLabel } from "./analysis-utils";
import {
  applyAudioKeyAnchor,
  isMajorKeyMisreadTrap,
  parseMajorRootPc,
  type AudioKeyAnchor,
} from "./key-detection-advanced";
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

function audioAnchorFromKey(audioKey: string, audioConfidence: number): AudioKeyAnchor | null {
  const rootPc = parseMajorRootPc(normalizeKeyLabel(audioKey));
  if (rootPc == null || audioConfidence < 40) return null;
  return { rootPc, key: normalizeKeyLabel(audioKey), confidence: audioConfidence };
}

/**
 * Audio-first reconciliation when Melodyne disagrees.
 * MIDI only wins when confidence is very high AND the read is not a known trap vs audio.
 */
function reconcileAudioMidiKey(
  audioKey: string,
  audioConfidence: number,
  candidate: ResolvedKey,
  fromMidi: KeyFromNotesResult | null,
  fromChords: KeyFromNotesResult | null,
): ResolvedKey {
  if (candidate.source === "hint") return candidate;

  const audio = parseKeySignature(audioKey);
  const cand = parseKeySignature(candidate.key);
  if (!audio || !cand) return candidate;

  const sameTonic = audio.rootPc === cand.rootPc && audio.isMinor === cand.isMinor;
  if (sameTonic) {
    const matchesAudioKey = normalizeKeyLabel(candidate.key) === normalizeKeyLabel(audioKey);
    return {
      key: normalizeKeyLabel(candidate.key),
      confidence: Math.max(candidate.confidence, audioConfidence),
      source: matchesAudioKey && audioConfidence >= 45 ? "audio" : candidate.source,
    };
  }

  const trapVsAudio =
    !audio.isMinor && !cand.isMinor && isMajorKeyMisreadTrap(audio.rootPc, cand.rootPc);

  if (trapVsAudio && audioConfidence >= 42) {
    const chordsAgreeAudio =
      fromChords && !fromChords.isMinor && fromChords.rootPc === audio.rootPc;
    return {
      key: normalizeKeyLabel(audioKey),
      confidence: Math.max(audioConfidence, chordsAgreeAudio ? fromChords.confidence : 0, 68),
      source: "audio",
    };
  }

  if (isCMajorPlaceholder(cand, audio) && audioConfidence >= 45) {
    return {
      key: normalizeKeyLabel(audioKey),
      confidence: audioConfidence,
      source: "audio",
    };
  }

  const chordsAgreeAudio =
    fromChords && !fromChords.isMinor && !audio.isMinor && fromChords.rootPc === audio.rootPc;
  const midiDisagreesAudio =
    fromMidi && !fromMidi.isMinor && !audio.isMinor && fromMidi.rootPc !== audio.rootPc;

  if (chordsAgreeAudio && midiDisagreesAudio && audioConfidence >= 48) {
    return {
      key: normalizeKeyLabel(audioKey),
      confidence: Math.max(audioConfidence, fromChords.confidence, 72),
      source: "audio",
    };
  }

  if (
    fromMidi &&
    candidate.source === "midi" &&
    fromMidi.confidence >= 78 &&
    !isMajorKeyMisreadTrap(audio.rootPc, fromMidi.rootPc)
  ) {
    const midiSig = parseKeySignature(fromMidi.key);
    if (midiSig && !isCMajorPlaceholder(midiSig, audio)) {
      return {
        key: normalizeKeyLabel(fromMidi.key),
        confidence: fromMidi.confidence,
        source: "midi",
      };
    }
  }

  if (audioConfidence >= 50 && candidate.confidence < audioConfidence + 10) {
    return {
      key: normalizeKeyLabel(audioKey),
      confidence: audioConfidence,
      source: "audio",
    };
  }

  if (candidate.confidence >= audioConfidence + 22) return candidate;

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

  const anchor = audioAnchorFromKey(audioKey, audioConfidence);

  const fromMidiRaw: KeyFromNotesResult | null =
    midiNotes.length >= 4 ? detectKeyFromMidiNotes(midiNotes, bpm, anchor) : null;
  const fromMidi = fromMidiRaw ? applyAudioKeyAnchor(fromMidiRaw, anchor) : null;

  const fromChords: KeyFromNotesResult | null =
    chords.length >= 2 ? inferKeyFromChordSegments(chords) : null;

  const audioSig = parseKeySignature(audioKey);

  let candidate: ResolvedKey;

  if (fromMidi && fromChords) {
    const sameRoot = fromMidi.rootPc === fromChords.rootPc;
    const sameMode = fromMidi.isMinor === fromChords.isMinor;
    const chordsMatchAudio =
      audioSig && !fromChords.isMinor && !audioSig.isMinor && fromChords.rootPc === audioSig.rootPc;
    const midiTrapVsAudio =
      audioSig &&
      !fromMidi.isMinor &&
      !audioSig.isMinor &&
      isMajorKeyMisreadTrap(audioSig.rootPc, fromMidi.rootPc);

    if (chordsMatchAudio && midiTrapVsAudio) {
      candidate = {
        key: normalizeKeyLabel(audioKey),
        confidence: Math.max(audioConfidence, fromChords.confidence, 74),
        source: "audio",
      };
    } else if (sameRoot && sameMode) {
      candidate = {
        key: fromMidi.key,
        confidence: Math.max(fromMidi.confidence, fromChords.confidence, 78),
        source: "midi",
      };
    } else if (chordsMatchAudio) {
      candidate = {
        key: fromChords.key,
        confidence: Math.max(fromChords.confidence, audioConfidence),
        source: "audio",
      };
    } else {
      candidate = { key: fromMidi.key, confidence: fromMidi.confidence, source: "midi" };
    }
  } else if (fromChords) {
    const chordsMatchAudio =
      audioSig && !fromChords.isMinor && !audioSig.isMinor && fromChords.rootPc === audioSig.rootPc;
    candidate = chordsMatchAudio
      ? {
          key: normalizeKeyLabel(audioKey),
          confidence: Math.max(audioConfidence, fromChords.confidence),
          source: "audio",
        }
      : { key: fromChords.key, confidence: fromChords.confidence, source: "midi" };
  } else if (fromMidi) {
    const trap =
      audioSig &&
      !fromMidi.isMinor &&
      !audioSig.isMinor &&
      isMajorKeyMisreadTrap(audioSig.rootPc, fromMidi.rootPc);
    candidate = trap
      ? {
          key: normalizeKeyLabel(audioKey),
          confidence: Math.max(audioConfidence, 70),
          source: "audio",
        }
      : { key: fromMidi.key, confidence: fromMidi.confidence, source: "midi" };
  } else {
    return { key: normalizeKeyLabel(audioKey), confidence: audioConfidence, source: "audio" };
  }

  return reconcileAudioMidiKey(audioKey, audioConfidence, candidate, fromMidi, fromChords);
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
