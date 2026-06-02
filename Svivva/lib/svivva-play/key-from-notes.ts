import type { TranscribedNote } from "./audio-transcription";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlate(rotated: number[], profile: number[]): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += rotated[i]! * profile[i]!;
  return sum;
}

/** Weighted pitch-class histogram from polyphonic MIDI (Melodyne export). */
export function buildChromaFromNotes(notes: TranscribedNote[]): Float64Array {
  const chroma = new Float64Array(12);
  for (const n of notes) {
    const dur = Math.max(0.04, n.endSec - n.startSec);
    const w = dur * (n.velocity / 127);
    chroma[n.midi % 12] += w;
  }
  const max = Math.max(...Array.from(chroma));
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

export type KeyFromNotesResult = {
  key: string;
  confidence: number;
  rootPc: number;
  isMinor: boolean;
};

/**
 * Detect key from Melodyne / MIDI note content (preferred over audio chroma when present).
 */
export function detectKeyFromMidiNotes(notes: TranscribedNote[]): KeyFromNotesResult | null {
  if (!notes.length) return null;

  const chromagram = buildChromaFromNotes(notes);
  const maxChroma = Math.max(...Array.from(chromagram));
  if (maxChroma <= 0) return null;

  let bestCorr = -Infinity;
  let secondBest = -Infinity;
  let bestKey = "C major";
  const majorCorrs: number[] = [];
  const minorCorrs: number[] = [];

  for (let shift = 0; shift < 12; shift++) {
    const rotated: number[] = [];
    for (let i = 0; i < 12; i++) rotated.push(chromagram[(i + shift) % 12]!);

    const majorCorr = correlate(rotated, MAJOR_PROFILE);
    const minorCorr = correlate(rotated, MINOR_PROFILE);
    majorCorrs.push(majorCorr);
    minorCorrs.push(minorCorr);

    if (majorCorr > bestCorr) {
      secondBest = bestCorr;
      bestCorr = majorCorr;
      bestKey = `${NOTE_NAMES[shift]} major`;
    } else if (majorCorr > secondBest) {
      secondBest = majorCorr;
    }

    if (minorCorr > bestCorr) {
      secondBest = bestCorr;
      bestCorr = minorCorr;
      bestKey = `${NOTE_NAMES[shift]} minor`;
    } else if (minorCorr > secondBest) {
      secondBest = minorCorr;
    }
  }

  // Prefer relative major when minor wins by a small margin (A major vs F# minor, etc.)
  if (bestKey.endsWith("minor")) {
    const minorRoot = bestKey.split(" ")[0]!;
    const minorIdx = NOTE_NAMES.indexOf(minorRoot);
    if (minorIdx >= 0) {
      const relMajorIdx = (minorIdx + 3) % 12;
      const relMajorCorr = majorCorrs[relMajorIdx]!;
      const minorWinCorr = minorCorrs[minorIdx]!;
      if (relMajorCorr >= minorWinCorr * 0.88) {
        bestKey = `${NOTE_NAMES[relMajorIdx]} major`;
        bestCorr = relMajorCorr;
      }
    }
  }

  const m = bestKey.match(/^([A-G][#b]?)\s+(major|minor)$/i);
  const rootName = m?.[1] ?? "C";
  const isMinor = (m?.[2] ?? "major").toLowerCase() === "minor";
  const rootPc = NOTE_NAMES.findIndex((n) => n === rootName);

  const confidence = Math.min(
    99,
    Math.max(40, Math.round(((bestCorr - secondBest) / (Math.abs(bestCorr) + 0.001)) * 180 + 52)),
  );

  return {
    key: bestKey,
    confidence,
    rootPc: rootPc >= 0 ? rootPc : 0,
    isMinor,
  };
}

/** When audio key and MIDI key disagree, prefer MIDI if confident (Melodyne is ground truth). */
export function resolveKeyWithMelodyne(
  audioKey: string,
  audioConfidence: number,
  midiNotes: TranscribedNote[],
): { key: string; confidence: number; source: "midi" | "audio" } {
  const midiKey = detectKeyFromMidiNotes(midiNotes);
  if (!midiKey) {
    return { key: audioKey, confidence: audioConfidence, source: "audio" };
  }

  const audioRoot = audioKey.split(" ")[0]?.toLowerCase();
  const midiRoot = midiKey.key.split(" ")[0]?.toLowerCase();
  const sameRoot = audioRoot === midiRoot;

  if (midiKey.confidence >= 52 && (!sameRoot || midiKey.confidence >= audioConfidence - 8)) {
    return { key: midiKey.key, confidence: midiKey.confidence, source: "midi" };
  }

  return { key: audioKey, confidence: audioConfidence, source: "audio" };
}
