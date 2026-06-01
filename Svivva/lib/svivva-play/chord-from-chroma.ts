const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Pitch classes present in common chord symbols (root-relative semitones). */
const CHORD_TEMPLATES: { symbol: string; pcs: number[] }[] = [
  { symbol: "", pcs: [0, 4, 7] },
  { symbol: "m", pcs: [0, 3, 7] },
  { symbol: "7", pcs: [0, 4, 7, 10] },
  { symbol: "m7", pcs: [0, 3, 7, 10] },
  { symbol: "maj7", pcs: [0, 4, 7, 11] },
  { symbol: "dim", pcs: [0, 3, 6] },
  { symbol: "sus4", pcs: [0, 5, 7] },
  { symbol: "sus2", pcs: [0, 2, 7] },
];

export interface ChordSegment {
  t0: number;
  t1: number;
  symbol: string;
  roman?: string;
  confidence: number;
  pitchClasses: number[];
}

function parseKeyRoot(key: string): { rootPc: number; isMinor: boolean } {
  const m = key.trim().match(/^([A-G][#b]?)/i);
  const rootStr = m?.[1] ?? "C";
  const idx = NOTE_NAMES.findIndex((n) => n.toLowerCase() === rootStr.replace(/b/g, "b"));
  return {
    rootPc: idx >= 0 ? idx : 0,
    isMinor: /minor/i.test(key),
  };
}

function chordScore(chroma: Float64Array, rootPc: number, template: number[]): number {
  let score = 0;
  for (const rel of template) {
    const pc = (rootPc + rel) % 12;
    score += chroma[pc];
  }
  return score;
}

export function detectChordAtTime(
  chroma: Float64Array,
  key: string,
): { symbol: string; confidence: number; pitchClasses: number[] } {
  const { rootPc: keyRoot, isMinor } = parseKeyRoot(key);
  let bestSymbol = isMinor ? "Am" : "C";
  let bestScore = -1;
  let bestPcs: number[] = [0, 4, 7];

  for (let root = 0; root < 12; root++) {
    for (const tmpl of CHORD_TEMPLATES) {
      const score = chordScore(chroma, root, tmpl.pcs);
      if (score > bestScore) {
        bestScore = score;
        bestPcs = tmpl.pcs.map((p) => (root + p) % 12);
        bestSymbol = `${NOTE_NAMES[root]}${tmpl.symbol}`;
      }
    }
  }

  const keyBonus = chordScore(chroma, keyRoot, isMinor ? [0, 3, 7] : [0, 4, 7]) * 0.08;
  const confidence = Math.min(92, Math.max(35, Math.round((bestScore + keyBonus) * 28)));
  return { symbol: bestSymbol, confidence, pitchClasses: bestPcs };
}

export function buildChordTimeline(
  chromaFrames: Float64Array[],
  frameTimesSec: number[],
  bpm: number,
  key: string,
  durationSec: number,
): ChordSegment[] {
  if (!chromaFrames.length) return [];

  const barSec = (60 / bpm) * 4;
  const bars = Math.max(1, Math.ceil(durationSec / barSec));
  const segments: ChordSegment[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * barSec;
    const t1 = Math.min(durationSec, (bar + 1) * barSec);
    const avg = new Float64Array(12);
    let count = 0;
    for (let fi = 0; fi < frameTimesSec.length; fi++) {
      const t = frameTimesSec[fi];
      if (t >= t0 && t < t1) {
        for (let pc = 0; pc < 12; pc++) avg[pc] += chromaFrames[fi][pc];
        count++;
      }
    }
    if (!count) continue;
    for (let pc = 0; pc < 12; pc++) avg[pc] /= count;
    const det = detectChordAtTime(avg, key);
    const prev = segments[segments.length - 1];
    if (prev && prev.symbol === det.symbol) {
      prev.t1 = t1;
      prev.confidence = Math.round((prev.confidence + det.confidence) / 2);
    } else {
      segments.push({
        t0: Number(t0.toFixed(3)),
        t1: Number(t1.toFixed(3)),
        symbol: det.symbol,
        confidence: det.confidence,
        pitchClasses: det.pitchClasses,
      });
    }
  }
  return segments;
}
