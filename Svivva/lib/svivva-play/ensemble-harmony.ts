import type { ChordSegment } from "./chord-from-chroma";
import { isMinorKeyLabel, parseRootFromKeyLabel } from "./analysis-utils";
import { parseRootNote } from "./reich-engine";

const SPELL_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_PROGRESSIONS: number[][] = [
  [0, 5, 3, 4],
  [1, 4, 0, 5],
  [5, 3, 0, 4],
  [0, 5, 1, 4],
  [3, 0, 5, 4],
];

const MINOR_PROGRESSIONS: number[][] = [
  [0, 6, 5, 4],
  [0, 5, 3, 1],
  [0, 3, 6, 5],
  [0, 6, 5, 6],
];

function majorScalePcs(rootPc: number): number[] {
  return [0, 2, 4, 5, 7, 9, 11].map((s) => (rootPc + s) % 12);
}

function naturalMinorScalePcs(rootPc: number): number[] {
  return [0, 2, 3, 5, 7, 8, 10].map((s) => (rootPc + s) % 12);
}

function triadPitchClasses(scalePcs: number[], degree: number): number[] {
  const r = scalePcs[degree % 7]!;
  const t = scalePcs[(degree + 2) % 7]!;
  const f = scalePcs[(degree + 4) % 7]!;
  return [r, t, f].sort((a, b) => a - b);
}

function pcToSpelling(pc: number): string {
  return SPELL_NAMES[((pc % 12) + 12) % 12] ?? "C";
}

function triadSymbol(scalePcs: number[], degree: number): string {
  const rootPc = scalePcs[degree % 7]!;
  const thirdPc = scalePcs[(degree + 2) % 7]!;
  const isMinorTriad = ((thirdPc - rootPc + 12) % 12) === 3;
  const name = pcToSpelling(rootPc);
  return isMinorTriad ? `${name}m` : name;
}

/** Strict diatonic triads from the user key — no jazz extensions or sus chords. */
export function buildEnsembleChordTimeline(
  key: string,
  durationSec: number,
  bpm: number,
  seed: number,
): ChordSegment[] {
  if (bpm < 30 || durationSec <= 0) return [];

  const root = parseRootFromKeyLabel(key);
  const rootPc = parseRootNote(root);

  const isMinor = isMinorKeyLabel(key);
  const scalePcs = isMinor ? naturalMinorScalePcs(rootPc) : majorScalePcs(rootPc);
  const pool = isMinor ? MINOR_PROGRESSIONS : MAJOR_PROGRESSIONS;
  const progression = pool[Math.abs(seed) % pool.length]!;

  const barSec = (60 / bpm) * 4;
  const totalBars = Math.max(4, Math.ceil(durationSec / barSec));
  const barsPerChord = Math.max(2, Math.floor(totalBars / progression.length));
  const segments: ChordSegment[] = [];

  for (let i = 0; i < progression.length; i++) {
    const degree = progression[i]!;
    const barStart = i * barsPerChord;
    if (barStart >= totalBars) break;
    const t0 = barStart * barSec;
    const t1 = Math.min(durationSec, (barStart + barsPerChord) * barSec);
    const symbol = triadSymbol(scalePcs, degree);
    segments.push({
      t0: Number(t0.toFixed(3)),
      t1: Number(t1.toFixed(3)),
      symbol,
      confidence: 88,
      pitchClasses: triadPitchClasses(scalePcs, degree),
    });
  }

  if (segments.length === 0) {
    segments.push({
      t0: 0,
      t1: durationSec,
      symbol: isMinor ? `${pcToSpelling(rootPc)}m` : pcToSpelling(rootPc),
      confidence: 70,
      pitchClasses: triadPitchClasses(scalePcs, 0),
    });
  }

  return segments;
}
