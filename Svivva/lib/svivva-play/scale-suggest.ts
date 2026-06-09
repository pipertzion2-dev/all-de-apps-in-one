import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { normalizeKeyLabel, parseRootFromKeyLabel, isMinorKeyLabel } from "./analysis-utils";
import { buildChromaFromNotes } from "./key-from-notes";
import { inferKeyModeFromChords } from "./scale-key-guard";
import { listScales, parseRootNote, resolveScale, scaleNoteNames } from "./reich-engine";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MODE_LOCKED_SCALES = new Set([
  "major",
  "ionian",
  "minor",
  "natural_minor",
  "harmonic_minor",
  "melodic_minor_asc",
  "pentatonic_major",
  "pentatonic_minor",
  "blues_minor",
]);

export type ScaleSuggestion = {
  scaleName: string;
  keyLabel: string;
  mode: "major" | "minor";
  confidence: number;
  reason: string;
  noteNames: string[];
};

function chromaFit(chroma: Float64Array, pcs: number[]): number {
  let score = 0;
  for (const pc of pcs) score += chroma[pc] ?? 0;
  return score;
}

/** Analyze audio/Melodyne/chords and recommend scale + key before composition. */
export function suggestCompositionScale(input: {
  analysisKey: string;
  chords?: ChordSegment[];
  melodyneNotes?: TranscribedNote[];
  audioNotes?: TranscribedNote[];
}): ScaleSuggestion {
  const analysisKey = normalizeKeyLabel(input.analysisKey || "C major");
  const analysisRoot = parseRootNote(parseRootFromKeyLabel(analysisKey));
  const notes = [...(input.melodyneNotes ?? []), ...(input.audioNotes ?? [])];
  const chroma = notes.length >= 8 ? buildChromaFromNotes(notes) : null;

  const chordMode = inferKeyModeFromChords(input.chords ?? []);
  const analysisMode: "major" | "minor" = isMinorKeyLabel(analysisKey) ? "minor" : "major";

  const candidates = listScales().filter((s) => !s.startsWith("raga_") || notes.length >= 8);
  let best: { root: number; scaleName: string; score: number } = {
    root: analysisRoot,
    scaleName: analysisMode === "minor" ? "natural_minor" : "major",
    score: -1,
  };

  for (let root = 0; root < 12; root++) {
    for (const scaleName of candidates) {
      const mode =
        scaleName === "minor" ||
        scaleName === "natural_minor" ||
        scaleName === "harmonic_minor" ||
        scaleName === "melodic_minor_asc" ||
        scaleName === "pentatonic_minor" ||
        scaleName === "blues_minor"
          ? "minor"
          : scaleName === "major" || scaleName === "ionian" || scaleName === "pentatonic_major"
            ? "major"
            : analysisMode;
      const resolved = resolveScale(mode, NOTE_NAMES[root]!, scaleName);
      let score = chroma ? chromaFit(chroma, resolved.pitchClasses) : 0;
      if (root === analysisRoot) score += 0.35;
      if (scaleName === "major" && chordMode === "major") score += 0.25;
      if (scaleName === "natural_minor" && chordMode === "minor") score += 0.25;
      if (MODE_LOCKED_SCALES.has(scaleName)) score += 0.05;
      if (score > best.score) {
        best = { root, scaleName, score };
      }
    }
  }

  if (chordMode === "major" && !isMinorKeyLabel(analysisKey)) {
    best = { root: analysisRoot, scaleName: "major", score: Math.max(best.score, 1) };
  } else if (chordMode === "minor" && chroma && best.score < 0.5) {
    best = { root: analysisRoot, scaleName: "natural_minor", score: Math.max(best.score, 1) };
  }

  if (notes.length < 8 && chordMode === "major") {
    best = { root: analysisRoot, scaleName: "major", score: 1 };
  }

  const rootName = NOTE_NAMES[best.root]!;
  const mode =
    best.scaleName === "minor" ||
    best.scaleName === "natural_minor" ||
    best.scaleName === "harmonic_minor" ||
    best.scaleName === "melodic_minor_asc" ||
    best.scaleName === "pentatonic_minor" ||
    best.scaleName === "blues_minor"
      ? "minor"
      : best.scaleName === "major" || best.scaleName === "ionian"
        ? "major"
        : (chordMode ?? analysisMode);
  const keyLabel = `${rootName} ${mode}`;
  const confidence = Math.min(98, Math.round(52 + best.score * 40 + (notes.length >= 12 ? 12 : 0)));

  const parts: string[] = [];
  if (notes.length >= 8) parts.push("Melodyne/audio pitch histogram");
  if (input.chords?.length) parts.push(`chord symbols (${chordMode ?? "mixed"} lean)`);
  parts.push(`detected key ${analysisKey}`);
  const reason = `Suggested from ${parts.join(" + ")}.`;

  return {
    scaleName: best.scaleName,
    keyLabel,
    mode,
    confidence,
    reason,
    noteNames: scaleNoteNames(best.scaleName, rootName),
  };
}
