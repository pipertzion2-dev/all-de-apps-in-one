export type StyleName = "reich_electric" | "shaw_interlace" | "phase_canon";

const SCALE_DEFS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor_asc: [0, 2, 3, 5, 7, 9, 11],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues_minor: [0, 3, 5, 6, 7, 10],
  whole_tone: [0, 2, 4, 6, 8, 10],
  raga_yaman: [0, 2, 4, 6, 7, 9, 11],
  raga_bhairav: [0, 1, 4, 5, 7, 8, 11],
  arabic_hijaz: [0, 1, 4, 5, 7, 8, 11],
  japanese_in: [0, 1, 5, 7, 8],
};

const NOTE_NAMES: Record<string, number> = {
  c: 0, "c#": 1, db: 1, d: 2, "d#": 3, eb: 3,
  e: 4, f: 5, "f#": 6, gb: 6, g: 7, "g#": 8, ab: 8,
  a: 9, "a#": 10, bb: 10, b: 11,
};

export function parseRootNote(root: string): number {
  const r = root.trim().toLowerCase().replace(/♯/g, "#").replace(/♭/g, "b");
  if (!(r in NOTE_NAMES)) throw new Error(`Unknown root: ${root}`);
  return NOTE_NAMES[r];
}

export interface ScaleResolution {
  rootPc: number;
  pitchClasses: number[];
  scaleName: string;
  detectedMode: "major" | "minor";
  keyRoot: string;
}

export function resolveScale(detectedMode: "major" | "minor", keyRoot: string, scaleName?: string): ScaleResolution {
  const rootPc = parseRootNote(keyRoot);
  const sn = scaleName || (detectedMode === "major" ? "major" : "natural_minor");
  const rel = SCALE_DEFS[sn.toLowerCase().replace(/ /g, "_")] || SCALE_DEFS[detectedMode === "major" ? "major" : "natural_minor"];
  const absPcs = [...new Set(rel.map(p => (rootPc + p) % 12))].sort((a, b) => a - b);
  return { rootPc, pitchClasses: absPcs, scaleName: sn, detectedMode, keyRoot };
}

export function listScales(): string[] {
  return Object.keys(SCALE_DEFS).sort();
}

function relativeSteps(absPcs: number[], rootPc: number): number[] {
  return [...new Set(absPcs.map(p => ((p - rootPc) % 12 + 12) % 12))].sort((a, b) => a - b);
}

function midiForDegree(rootPc: number, absPcs: number[], degree: number, baseOctave = 4): number {
  const rel = relativeSteps(absPcs, rootPc);
  const n = rel.length || 1;
  const octJump = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return 12 * (baseOctave + octJump) + rootPc + rel[idx];
}

class Rng {
  private state: number;
  constructor(seed: number) { this.state = seed || 1; }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }
}

const REICH_WEIGHTS: [number, number][] = [[0, 0.20], [1, 0.395], [-1, 0.395], [2, 0.01], [-2, 0.01]];
const SHAW_WEIGHTS: [number, number][] = [[0, 0.15], [1, 0.3], [-1, 0.3], [2, 0.1], [-2, 0.1], [3, 0.03], [-3, 0.02]];

function weightedDelta(rng: Rng, weights: [number, number][]): number {
  const total = weights.reduce((s, w) => s + w[1], 0);
  let t = rng.next() * total;
  for (const [d, w] of weights) { t -= w; if (t <= 0) return d; }
  return 0;
}

const CP_CELL_LEN = 12;
const HK_CELL_LEN = 24;
const CP_ROTATIONS = [0, 4, 8];
const HK_ROTATIONS = [0, 4, 8, 12, 16, 20];

function buildMelodicCell(rootPc: number, absPcs: number[], length: number, style: StyleName, rng: Rng, baseDeg = 0): number[] {
  const n = Math.max(absPcs.length, 1);
  let deg = (baseDeg % (n * 3)) + n;
  const out: number[] = [];
  const weights = style === "shaw_interlace" ? SHAW_WEIGHTS : REICH_WEIGHTS;
  for (let i = 0; i < length; i++) {
    if (style === "shaw_interlace" && rng.next() < 0.08) {
      out.push(deg);
      continue;
    }
    deg += weightedDelta(rng, weights);
    deg = Math.max(n, Math.min(n * 5, deg));
    out.push(deg);
  }
  return out;
}

function rotateCell(cell: number[], k: number): number[] {
  if (!cell.length) return cell;
  const r = ((k % cell.length) + cell.length) % cell.length;
  return [...cell.slice(r), ...cell.slice(0, r)];
}

function cellToMidis(rootPc: number, absPcs: number[], degrees: number[], baseOctave: number): number[] {
  return degrees.map(d => midiForDegree(rootPc, absPcs, d, baseOctave));
}

function voiceBaseOctave(vi: number, numVoices: number, base = 4): number {
  const spread = [0, 0, 1, 1, 2, 2].slice(0, numVoices);
  return vi < spread.length ? base + spread[vi] : base + Math.floor(vi / 2);
}

export interface MidiNote {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
}

export interface VoicePart {
  voiceIndex: number;
  notes: MidiNote[];
  name: string;
}

function sixteenthsForDuration(durationSec: number, bpm: number): number {
  return Math.max(1, Math.round(durationSec * (bpm / 60) * 4));
}

export function composeCounterpoint(opts: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  style?: StyleName;
  seed?: number;
}): VoicePart[] {
  const { durationSec, bpm, scale, style = "reich_electric", seed = 42 } = opts;
  const rng = new Rng(seed);
  const total = sixteenthsForDuration(durationSec, bpm);
  const sixteenthBeats = 0.25;

  const baseCells: number[][] = [];
  if (style === "phase_canon") {
    const master = buildMelodicCell(scale.rootPc, scale.pitchClasses, CP_CELL_LEN, "reich_electric", rng, 0);
    for (let v = 0; v < 3; v++) baseCells.push(rotateCell(master, v * 4));
  } else if (style === "reich_electric") {
    const master = buildMelodicCell(scale.rootPc, scale.pitchClasses, CP_CELL_LEN, "reich_electric", rng, 0);
    for (let v = 0; v < 3; v++) baseCells.push(rotateCell(master, CP_ROTATIONS[v]));
  } else {
    for (let v = 0; v < 3; v++) {
      const vRng = new Rng((seed || 0) + v * 7919);
      baseCells.push(buildMelodicCell(scale.rootPc, scale.pitchClasses, CP_CELL_LEN, style, vRng, v * 2));
    }
  }

  const parts: VoicePart[] = [];
  for (let v = 0; v < 3; v++) {
    const bo = voiceBaseOctave(v, 3, 4);
    const seqMidis = cellToMidis(scale.rootPc, scale.pitchClasses, baseCells[v], bo);
    const notes: MidiNote[] = [];
    let s = v;
    let i = 0;
    while (s < total) {
      if (style === "shaw_interlace" && rng.next() < 0.12) { s += 3; i++; continue; }
      const pitch = seqMidis[i % seqMidis.length];
      notes.push({ note: pitch, velocity: 78 + Math.floor(rng.next() * 12), startBeat: s * sixteenthBeats, duration: sixteenthBeats * 0.9 });
      s += 3;
      i++;
    }
    parts.push({ voiceIndex: v, notes, name: `Counterpoint Voice ${v + 1}` });
  }
  return parts;
}

export function composeHocket(opts: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  style?: StyleName;
  seed?: number;
}): VoicePart[] {
  const { durationSec, bpm, scale, style = "reich_electric", seed = 42 } = opts;
  const rng = new Rng((seed || 0) ^ 0xC0FFEE);
  const total = sixteenthsForDuration(durationSec, bpm);
  const sixteenthBeats = 0.25;

  const cells: number[][] = [];
  if (style === "phase_canon") {
    const master = buildMelodicCell(scale.rootPc, scale.pitchClasses, HK_CELL_LEN, "reich_electric", rng);
    for (let v = 0; v < 6; v++) cells.push(rotateCell(master, v * 3));
  } else if (style === "reich_electric") {
    const master = buildMelodicCell(scale.rootPc, scale.pitchClasses, HK_CELL_LEN, "reich_electric", rng, 0);
    for (let v = 0; v < 6; v++) cells.push(rotateCell(master, HK_ROTATIONS[v]));
  } else {
    for (let v = 0; v < 6; v++) {
      const vRng = new Rng((seed || 0) + v * 104729);
      cells.push(buildMelodicCell(scale.rootPc, scale.pitchClasses, HK_CELL_LEN, style, vRng, v));
    }
  }

  const parts: VoicePart[] = [];
  for (let v = 0; v < 6; v++) {
    const bo = voiceBaseOctave(v, 6, 4);
    const seqMidis = cellToMidis(scale.rootPc, scale.pitchClasses, cells[v], bo);
    const notes: MidiNote[] = [];
    let s = v;
    let i = 0;
    while (s < total) {
      if (style === "shaw_interlace" && rng.next() < 0.18) { s += 6; i++; continue; }
      const pitch = seqMidis[i % seqMidis.length];
      notes.push({ note: pitch, velocity: 72 + Math.floor(rng.next() * 16), startBeat: s * sixteenthBeats, duration: sixteenthBeats * 0.95 });
      s += 6;
      i++;
    }
    parts.push({ voiceIndex: v, notes, name: `Hocket Voice ${v + 1}` });
  }
  return parts;
}

export function strategiesInfo() {
  return {
    sourcesNote: "Paraphrase of Reich Electric Counterpoint program material and process-music principles; heuristic procedural rules only.",
    electricCounterpoint: [
      "Stacked canons: same underlying pattern, staggered entries → interlocking texture.",
      "Solo or lead function: melodic interest from the composite counterpoint, not only one line.",
      "Harmonic rhythm: repeating/pulsing layers under canonic strands.",
    ],
    processMusic: [
      "Repeating figure + process (rotation / entry delay) drives note-to-note detail.",
      "Change unfolds gradually; keep motion mostly stepwise within the scale.",
      "Structure should remain audible — repetition is a feature.",
    ],
    counterpoint: { sharedMasterCell: true, cellLengthSixteenths: CP_CELL_LEN, voiceRotations: CP_ROTATIONS },
    hocket: { sharedMasterCell: true, cellLengthSixteenths: HK_CELL_LEN, voiceRotations: HK_ROTATIONS },
  };
}
