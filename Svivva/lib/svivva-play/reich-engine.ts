import { getBuiltinOrDynamicSteps, listDynamicScales } from "./dynamic-scales";
import {
  buildV2HocketSlotPattern,
  type HocketGrooveStyle,
} from "./hocket-groove-v2";
import { addV2HocketRapidFire, buildV2HocketMelodyNotes } from "./hocket-melody-v2";
import { resolvePatternCellLengths, type PatternLength } from "./pattern-length";

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
  raga_bhairavi: [0, 1, 3, 5, 7, 8, 10],
  raga_marwa: [0, 1, 4, 6, 7, 9, 11],
  raga_purvi: [0, 1, 4, 6, 7, 8, 11],
  raga_todi: [0, 1, 3, 6, 7, 8, 11],
  arabic_hijaz: [0, 1, 4, 5, 7, 8, 11],
  japanese_in: [0, 1, 5, 7, 8],
};

const NOTE_NAMES: Record<string, number> = {
  c: 0,
  "c#": 1,
  db: 1,
  d: 2,
  "d#": 3,
  eb: 3,
  e: 4,
  f: 5,
  "f#": 6,
  gb: 6,
  g: 7,
  "g#": 8,
  ab: 8,
  a: 9,
  "a#": 10,
  bb: 10,
  b: 11,
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

export function resolveScale(
  detectedMode: "major" | "minor",
  keyRoot: string,
  scaleName?: string,
): ScaleResolution {
  const rootPc = parseRootNote(keyRoot);
  const sn = scaleName || (detectedMode === "major" ? "major" : "natural_minor");
  const snNorm = sn.toLowerCase().replace(/ /g, "_");
  const rel =
    SCALE_DEFS[snNorm] ||
    getBuiltinOrDynamicSteps(snNorm) ||
    SCALE_DEFS[detectedMode === "major" ? "major" : "natural_minor"];
  const absPcs = [...new Set(rel.map((p) => (rootPc + p) % 12))].sort((a, b) => a - b);
  return { rootPc, pitchClasses: absPcs, scaleName: sn, detectedMode, keyRoot };
}

export function listScales(): string[] {
  return [...new Set([...Object.keys(SCALE_DEFS), ...listDynamicScales()])].sort();
}

const SPELL_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Human-readable scale catalog for the Play UI. */
export function describeScaleLookup(): { name: string; label: string; pitchClasses: number[] }[] {
  return Object.entries(SCALE_DEFS)
    .map(([name, pitchClasses]) => ({
      name,
      label: name.replace(/_/g, " "),
      pitchClasses,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Spell scale degrees in a given root (e.g. major in A → A B C# …). */
export function scaleNoteNames(scaleName: string, root: string): string[] {
  const resolved = resolveScale("major", root, scaleName);
  return resolved.pitchClasses.map((pc) => SPELL_NAMES[pc] ?? "?");
}

function relativeSteps(absPcs: number[], rootPc: number): number[] {
  return [...new Set(absPcs.map((p) => (((p - rootPc) % 12) + 12) % 12))].sort((a, b) => a - b);
}

function clampMidi(note: number, max = 76): number {
  return Math.max(36, Math.min(max, Math.round(note)));
}

function clampMidiPreservePc(note: number, max = 76, min = 36): number {
  const pc = ((note % 12) + 12) % 12;
  let best = clampMidi(note, max);
  if (best % 12 === pc) return best;
  let bestDist = Infinity;
  let picked = best;
  for (let m = min; m <= max; m++) {
    if (m % 12 !== pc) continue;
    const dist = Math.abs(m - note);
    if (dist < bestDist) {
      bestDist = dist;
      picked = m;
    }
  }
  return picked;
}

function midiForDegree(rootPc: number, absPcs: number[], degree: number, baseOctave = 4): number {
  const rel = relativeSteps(absPcs, rootPc);
  const n = rel.length || 1;
  const safeDeg = Math.max(0, Math.min(degree, n * 4));
  const octJump = Math.floor(safeDeg / n);
  const idx = ((safeDeg % n) + n) % n;
  const raw = 12 * (baseOctave + octJump) + rootPc + rel[idx];
  return clampMidiPreservePc(raw);
}

class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed || 1;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }
}

const REICH_WEIGHTS: [number, number][] = [
  [0, 0.2],
  [1, 0.395],
  [-1, 0.395],
  [2, 0.01],
  [-2, 0.01],
];
const SHAW_WEIGHTS: [number, number][] = [
  [0, 0.15],
  [1, 0.3],
  [-1, 0.3],
  [2, 0.1],
  [-2, 0.1],
  [3, 0.03],
  [-3, 0.02],
];

function weightedDelta(rng: Rng, weights: [number, number][]): number {
  const total = weights.reduce((s, w) => s + w[1], 0);
  let t = rng.next() * total;
  for (const [d, w] of weights) {
    t -= w;
    if (t <= 0) return d;
  }
  return 0;
}

const CP_CELL_LEN = 12;
const HK_CELL_LEN = 24;
const CP_ROTATIONS = [0, 4, 8];
const HK_ROTATIONS = [0, 4, 8, 12, 16, 20];

export type { PatternLength };

function buildMelodicCell(
  rootPc: number,
  absPcs: number[],
  length: number,
  style: StyleName,
  rng: Rng,
  baseDeg = 0,
): number[] {
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
    deg = Math.max(n, Math.min(n * 4, deg));
    out.push(deg);
  }
  return out;
}

function rotateCell(cell: number[], k: number): number[] {
  if (!cell.length) return cell;
  const r = ((k % cell.length) + cell.length) % cell.length;
  return [...cell.slice(r), ...cell.slice(0, r)];
}

function cellToMidis(
  rootPc: number,
  absPcs: number[],
  degrees: number[],
  baseOctave: number,
): number[] {
  return degrees.map((d) => midiForDegree(rootPc, absPcs, d, baseOctave));
}

function voiceBaseOctave(vi: number, numVoices: number, base = 3): number {
  const spread = [0, 0, 1, 1, 2, 2].slice(0, numVoices);
  return vi < spread.length ? base + spread[vi] : base + Math.floor(vi / 2);
}

/** v2 Reich Composer: one shared melodic cell, random scale degrees + octave spread. */
function buildMasterMidiCell(
  rootPc: number,
  absPcs: number[],
  cellLen: number,
  style: StyleName,
  seed: number,
  baseOctave: number,
): number[] {
  const rng = new Rng(seed);
  const rel = relativeSteps(absPcs, rootPc);
  if (style === "reich_electric" || style === "phase_canon") {
    const out: number[] = [];
    for (let i = 0; i < cellLen; i++) {
      const deg = Math.floor(rng.next() * rel.length);
      const pc = (rootPc + rel[deg]) % 12;
      const octave = baseOctave + Math.floor(rng.next() * 2);
      out.push(clampMidiPreservePc(12 * (octave + 1) + pc));
    }
    return out;
  }
  const degrees = buildMelodicCell(rootPc, absPcs, cellLen, style, rng, 0);
  return cellToMidis(rootPc, absPcs, degrees, baseOctave);
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
  patternLength?: PatternLength;
}): VoicePart[] {
  const { durationSec, bpm, scale, style = "reich_electric", seed = 42, patternLength } = opts;
  const { cpCellLen, cpRotations } = resolvePatternCellLengths(patternLength);
  const rng = new Rng(seed);
  const total = sixteenthsForDuration(durationSec, bpm);
  const sixteenthBeats = 0.25;

  const baseCells: number[][] = [];
  if (style === "phase_canon") {
    const master = buildMelodicCell(
      scale.rootPc,
      scale.pitchClasses,
      cpCellLen,
      "reich_electric",
      rng,
      0,
    );
    for (let v = 0; v < 3; v++) baseCells.push(rotateCell(master, v * 4));
  } else if (style === "reich_electric") {
    const master = buildMelodicCell(
      scale.rootPc,
      scale.pitchClasses,
      cpCellLen,
      "reich_electric",
      rng,
      0,
    );
    for (let v = 0; v < 3; v++) baseCells.push(rotateCell(master, cpRotations[v] ?? 0));
  } else {
    for (let v = 0; v < 3; v++) {
      const vRng = new Rng((seed || 0) + v * 7919);
      baseCells.push(
        buildMelodicCell(scale.rootPc, scale.pitchClasses, cpCellLen, style, vRng, v * 2),
      );
    }
  }

  const parts: VoicePart[] = [];
  for (let v = 0; v < 3; v++) {
    const bo = voiceBaseOctave(v, 3, 3);
    const seqMidis = cellToMidis(scale.rootPc, scale.pitchClasses, baseCells[v], bo);
    const notes: MidiNote[] = [];
    let s = v % Math.max(1, Math.min(3, total));
    let i = 0;
    while (s < total) {
      if (style === "shaw_interlace" && rng.next() < 0.12) {
        s += 3;
        i++;
        continue;
      }
      const pitch = seqMidis[i % seqMidis.length];
      notes.push({
        note: pitch,
        velocity: 78 + Math.floor(rng.next() * 12),
        startBeat: s * sixteenthBeats,
        duration: sixteenthBeats * 0.9,
      });
      s += 3;
      i++;
    }
    if (notes.length === 0) {
      const fallback = clampMidiPreservePc(
        12 * bo + scale.rootPc + (scale.pitchClasses[0] ?? 0),
      );
      notes.push({
        note: fallback,
        velocity: 72,
        startBeat: v * sixteenthBeats * 0.5,
        duration: sixteenthBeats * 2,
      });
    }
    parts.push({ voiceIndex: v, notes, name: `Counterpoint Voice ${v + 1}` });
  }
  return parts;
}

function eighthSlotsForDuration(durationSec: number, bpm: number): number {
  return Math.max(1, Math.round(durationSec * (bpm / 60) * 2));
}

export function composeHocket(opts: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  style?: StyleName;
  seed?: number;
  patternLength?: PatternLength;
  /** AI V-2 groove variety vs strict Reich v2 i%6 interlock. */
  hocketGroove?: HocketGrooveStyle;
}): VoicePart[] {
  const {
    durationSec,
    bpm,
    scale,
    style = "reich_electric",
    seed = 42,
    hocketGroove,
    patternLength,
  } = opts;
  const { cpCellLen, hkCellLen } = resolvePatternCellLengths(patternLength);
  const rng = new Rng((seed || 0) ^ 0xc0ffee);
  const grooveStyle: HocketGrooveStyle =
    hocketGroove ??
    (style === "shaw_interlace" ? "shaw_interlock" : "reich_phase");

  if (grooveStyle === "reich_interlock") {
    const total = sixteenthsForDuration(durationSec, bpm);
    const sixteenthBeats = 0.25;
    const cellLen = style === "shaw_interlace" ? cpCellLen : hkCellLen;
    const masterMidis = buildMasterMidiCell(
      scale.rootPc,
      scale.pitchClasses,
      cellLen,
      style,
      seed || 42,
      3,
    );
    const slotPattern = buildV2HocketSlotPattern(total, 6, seed || 42, "reich_interlock");
    const parts: VoicePart[] = [];
    for (let v = 0; v < 6; v++) {
      const notes: MidiNote[] = [];
      const slots = slotPattern[v] ?? [];
      for (const s of slots) {
        if (style === "shaw_interlace" && rng.next() < 0.12) continue;
        const idx = s % masterMidis.length;
        notes.push({
          note: masterMidis[idx]!,
          velocity: 72 + Math.floor(rng.next() * 16),
          startBeat: s * sixteenthBeats,
          duration: sixteenthBeats * 0.75,
        });
      }
      if (notes.length === 0) {
        const idx = v % masterMidis.length;
        notes.push({
          note: masterMidis[idx]!,
          velocity: 70,
          startBeat: v * sixteenthBeats * 0.25,
          duration: sixteenthBeats * 2,
        });
      }
      parts.push({ voiceIndex: v, notes, name: `Hocket Voice ${v + 1}` });
    }
    return parts;
  }

  const numVoices = 8;
  const totalEighths = eighthSlotsForDuration(durationSec, bpm);
  const eighthBeats = 0.5;
  const slotPattern = buildV2HocketSlotPattern(totalEighths, numVoices, seed || 42, grooveStyle);
  let voiceNotes = buildV2HocketMelodyNotes(slotPattern, scale, eighthBeats, seed || 42);
  voiceNotes = addV2HocketRapidFire(voiceNotes, durationSec, bpm, scale, seed || 42);

  const parts: VoicePart[] = [];
  for (let v = 0; v < numVoices; v++) {
    let notes = voiceNotes[v] ?? [];
    if (style === "shaw_interlace" && notes.length > 1) {
      notes = notes.filter(() => rng.next() >= 0.08);
    }
    if (notes.length === 0) {
      const bo = voiceBaseOctave(v, 4, 4);
      notes = [
        {
          note: clampMidiPreservePc(12 * bo + scale.rootPc),
          velocity: 70,
          startBeat: v * eighthBeats * 0.25,
          duration: eighthBeats * 2,
        },
      ];
    }
    parts.push({ voiceIndex: v, notes, name: `Hocket Voice ${v + 1}` });
  }
  return parts;
}

export function strategiesInfo() {
  return {
    sourcesNote:
      "Paraphrase of Reich Electric Counterpoint program material and process-music principles; heuristic procedural rules only.",
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
    counterpoint: {
      sharedMasterCell: true,
      cellLengthSixteenths: CP_CELL_LEN,
      voiceRotations: CP_ROTATIONS,
    },
    hocket: {
      sharedMasterCell: true,
      cellLengthSixteenths: HK_CELL_LEN,
      interlock: "sixteenth_slot_mod_6",
      grooveStyles: [
        "reich_interlock",
        "reich_phase",
        "shaw_interlock",
        "minimalist_cells",
        "polyrhythmic",
        "asymmetric",
      ],
      note: "reich_interlock matches v2 Reich Composer (i%6===voice). Other styles follow AI V-2 variety with one voice per slot.",
    },
  };
}
