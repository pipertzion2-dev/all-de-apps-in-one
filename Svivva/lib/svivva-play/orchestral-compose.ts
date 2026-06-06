/**
 * Björk × Ivan Lins procedural orchestral strings — interlocking Brazilian melodies
 * mapped to Ableton Orchestral instrument names.
 */
import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { chordSegmentPitchClasses } from "./scale-key-guard";
import { buildV2HocketSlotPattern } from "./hocket-groove-v2";
import { resolvePatternCellLengths, type PatternLength } from "./pattern-length";
import type { ScaleResolution } from "./reich-engine";
import type { MidiNote, VoicePart } from "./reich-engine";

export const BJORK_LINS_ORCHESTRAL_PRESET = "bjork_lins_orchestral";

/** Ableton Orchestral pack — use these names when assigning stems in Live. */
export const ABLETON_ORCHESTRAL_STEMS: {
  name: string;
  hint: string;
  role: string;
  register: string;
  baseOctave: number;
  pan: number;
}[] = [
  { name: "Violin 1", hint: "violin", role: "melody", register: "high", baseOctave: 5, pan: -55 },
  { name: "Violin 2", hint: "violin", role: "harmony", register: "high", baseOctave: 5, pan: -35 },
  { name: "Viola", hint: "viola", role: "harmony", register: "mid", baseOctave: 4, pan: -15 },
  { name: "Cello", hint: "cello", role: "harmony", register: "mid", baseOctave: 3, pan: 15 },
  { name: "Contrabass", hint: "contrabass", role: "bass", register: "low", baseOctave: 2, pan: 35 },
  { name: "Solo Violin", hint: "solo violin", role: "melody", register: "high", baseOctave: 5, pan: -70 },
  { name: "Harp", hint: "harp", role: "harmony", register: "mid", baseOctave: 4, pan: 25 },
  { name: "Flute", hint: "flute", role: "melody", register: "high", baseOctave: 5, pan: 45 },
  { name: "Oboe", hint: "oboe", role: "melody", register: "mid", baseOctave: 4, pan: 50 },
  { name: "Timpani", hint: "timpani", role: "percussion", register: "low", baseOctave: 2, pan: 0 },
  { name: "Percussion", hint: "orchestral percussion", role: "percussion", register: "mid", baseOctave: 3, pan: 60 },
];

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

function relativeSteps(absPcs: number[], rootPc: number): number[] {
  return [...new Set(absPcs.map((p) => (((p - rootPc) % 12) + 12) % 12))].sort((a, b) => a - b);
}

function clampMidi(note: number, min = 36, max = 88): number {
  return Math.max(min, Math.min(max, Math.round(note)));
}

function midiForPc(pc: number, octave: number): number {
  return clampMidi(12 * (octave + 1) + pc);
}

/** Brazilian MPB leaning steps — seconds/thirds with occasional leap. */
function brazilianMelodicCell(
  rootPc: number,
  absPcs: number[],
  length: number,
  rng: Rng,
  startDeg = 0,
): number[] {
  const rel = relativeSteps(absPcs, rootPc);
  const n = rel.length || 1;
  let deg = startDeg % (n * 4);
  const out: number[] = [];
  const weights: [number, number][] = [
    [0, 0.25],
    [1, 0.28],
    [-1, 0.28],
    [2, 0.1],
    [-2, 0.07],
    [3, 0.02],
  ];
  for (let i = 0; i < length; i++) {
    if (rng.next() < 0.06) {
      out.push(deg);
      continue;
    }
    let t = rng.next() * weights.reduce((s, w) => s + w[1], 0);
    let delta = 0;
    for (const [d, w] of weights) {
      t -= w;
      if (t <= 0) {
        delta = d;
        break;
      }
    }
    deg = Math.max(0, Math.min(n * 6, deg + delta));
    out.push(deg);
  }
  return out;
}

function degreesToMidis(
  rootPc: number,
  absPcs: number[],
  degrees: number[],
  baseOctave: number,
): number[] {
  const rel = relativeSteps(absPcs, rootPc);
  const n = rel.length || 1;
  return degrees.map((d) => {
    const octJump = Math.floor(d / n);
    const idx = ((d % n) + n) % n;
    return clampMidi(12 * (baseOctave + octJump) + rootPc + rel[idx]!);
  });
}

function rotateCell<T>(cell: T[], offset: number): T[] {
  if (!cell.length) return cell;
  const o = ((offset % cell.length) + cell.length) % cell.length;
  return [...cell.slice(o), ...cell.slice(0, o)];
}

function sixteenthsForDuration(durationSec: number, bpm: number): number {
  return Math.max(16, Math.round(durationSec * (bpm / 60) * 4));
}

function noteAtSec(notes: TranscribedNote[], tSec: number): number | null {
  for (const n of notes) {
    if (tSec >= n.startSec && tSec < n.endSec) return n.midi;
  }
  let best: TranscribedNote | null = null;
  let bestDist = Infinity;
  for (const n of notes) {
    const mid = (n.startSec + n.endSec) / 2;
    const dist = Math.abs(mid - tSec);
    if (dist < bestDist) {
      bestDist = dist;
      best = n;
    }
  }
  return best?.midi ?? null;
}

function buildTimpaniPart(
  durationSec: number,
  bpm: number,
  seed: number,
  chords: ChordSegment[],
): VoicePart {
  const rng = new Rng(seed ^ 0xbeef);
  const beatSec = 60 / bpm;
  const totalBeats = (durationSec / beatSec) | 0;
  const notes: MidiNote[] = [];
  const rootPc = chords.length ? chordSegmentPitchClasses(chords[0]!)[0] ?? 0 : 0;
  const low = midiForPc(rootPc, 2);

  for (let b = 0; b < totalBeats; b++) {
    const isDownbeat = b % 4 === 0;
    const syncopated = b % 4 === 2 || (b % 8 === 5);
    if (!isDownbeat && !syncopated) continue;
    if (rng.next() < 0.15) continue;
    notes.push({
      note: low,
      velocity: isDownbeat ? 95 + Math.floor(rng.next() * 8) : 72 + Math.floor(rng.next() * 12),
      startBeat: b,
      duration: isDownbeat ? 0.35 : 0.2,
    });
  }
  if (notes.length === 0) {
    notes.push({ note: low, velocity: 90, startBeat: 0, duration: 0.4 });
  }
  return { voiceIndex: 9, notes, name: "Timpani" };
}

function buildHarpArpeggios(chords: ChordSegment[], bpm: number, seed: number): MidiNote[] {
  const rng = new Rng(seed ^ 0xface);
  const beatSec = 60 / bpm;
  const notes: MidiNote[] = [];
  for (const chord of chords) {
    const pcs = chord.pitchClasses?.length
      ? chord.pitchClasses
      : chordSegmentPitchClasses(chord);
    const startBeat = chord.t0 / beatSec;
    const endBeat = chord.t1 / beatSec;
    const span = Math.max(0.5, endBeat - startBeat);
    const step = 0.25;
    let t = startBeat;
    let vi = 0;
    while (t < endBeat - 0.1) {
      const pc = pcs[vi % pcs.length] ?? 0;
      notes.push({
        note: midiForPc(pc, 4),
        velocity: 58 + Math.floor(rng.next() * 18),
        startBeat: t,
        duration: step * 0.85,
      });
      t += step;
      vi++;
      if (t - startBeat > span) break;
    }
  }
  return notes;
}

function buildPercussionAccent(durationSec: number, bpm: number, seed: number): MidiNote[] {
  const rng = new Rng(seed ^ 0xcafe);
  const beatSec = 60 / bpm;
  const totalBeats = (durationSec / beatSec) | 0;
  const notes: MidiNote[] = [];
  for (let b = 0; b < totalBeats; b++) {
    if (b % 2 !== 1 && b % 4 !== 3) continue;
    if (rng.next() < 0.35) continue;
    notes.push({
      note: 60,
      velocity: 48 + Math.floor(rng.next() * 20),
      startBeat: b + (rng.next() < 0.4 ? 0.5 : 0),
      duration: 0.12,
    });
  }
  return notes;
}

export function composeBjorkLinsOrchestral(opts: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  seed?: number;
  patternLength?: PatternLength;
  melodyneNotes?: TranscribedNote[];
  audioNotes?: TranscribedNote[];
  chords?: ChordSegment[];
}): VoicePart[] {
  const {
    durationSec,
    bpm,
    scale,
    seed = 42,
    patternLength = "extended",
    melodyneNotes = [],
    audioNotes = [],
    chords = [],
  } = opts;

  const rng = new Rng(seed);
  const { hkCellLen, hkRotations } = resolvePatternCellLengths(patternLength);
  const total = sixteenthsForDuration(durationSec, bpm);
  const sixteenthBeats = 0.25;
  const guideNotes = melodyneNotes.length ? melodyneNotes : audioNotes;

  const masterDegrees = brazilianMelodicCell(
    scale.rootPc,
    scale.pitchClasses,
    hkCellLen,
    rng,
    2,
  );
  const stringStemCount = 8;
  const parts: VoicePart[] = [];

  const slotPattern = buildV2HocketSlotPattern(total, stringStemCount, seed, "reich_interlock");

  for (let v = 0; v < stringStemCount; v++) {
    const meta = ABLETON_ORCHESTRAL_STEMS[v]!;
    const rotated = rotateCell(masterDegrees, hkRotations[v % hkRotations.length] ?? 0);
    const seqMidis = degreesToMidis(
      scale.rootPc,
      scale.pitchClasses,
      rotated,
      meta.baseOctave,
    );
    const notes: MidiNote[] = [];
    const slots = slotPattern[v] ?? [];

    for (const s of slots) {
      if (rng.next() < 0.1) continue;
      const beatSec = 60 / bpm;
      const tSec = s * sixteenthBeats * beatSec;
      const guided = guideNotes.length ? noteAtSec(guideNotes, tSec) : null;
      let pitch = seqMidis[s % seqMidis.length]!;
      if (guided && v >= 4 && rng.next() < 0.55) {
        const pc = ((guided % 12) + 12) % 12;
        pitch = clampMidi(12 * (meta.baseOctave + 1) + pc, 48, 84);
      }
      const syncopated = s % 4 === 1 || s % 4 === 3;
      notes.push({
        note: pitch,
        velocity: syncopated
          ? 62 + Math.floor(rng.next() * 16)
          : 70 + Math.floor(rng.next() * 18),
        startBeat: s * sixteenthBeats,
        duration: sixteenthBeats * (v === 4 ? 1.1 : 0.85),
      });
    }

    if (notes.length === 0) {
      notes.push({
        note: seqMidis[0]!,
        velocity: 72,
        startBeat: v * 0.25,
        duration: 0.5,
      });
    }

    parts.push({ voiceIndex: v, notes, name: meta.name });
  }

  const harpNotes = buildHarpArpeggios(chords, bpm, seed);
  if (harpNotes.length) {
    const harpIdx = parts.findIndex((p) => p.name === "Harp");
    if (harpIdx >= 0) {
      parts[harpIdx] = { ...parts[harpIdx]!, notes: [...parts[harpIdx]!.notes, ...harpNotes] };
    }
  }

  parts.push(buildTimpaniPart(durationSec, bpm, seed, chords));
  parts.push({
    voiceIndex: 10,
    name: "Percussion",
    notes: buildPercussionAccent(durationSec, bpm, seed),
  });

  return parts;
}

export function orchestralStemHints(): string[] {
  return ABLETON_ORCHESTRAL_STEMS.map((s) => s.hint);
}

export function voicePartsToOrchestralStems(voices: VoicePart[]) {
  return voices.map((v, i) => {
    const meta = ABLETON_ORCHESTRAL_STEMS[i] ?? ABLETON_ORCHESTRAL_STEMS[0]!;
    return {
      id: `orch-${i}`,
      name: v.name,
      role: meta.role,
      register: meta.register,
      instrumentHint: meta.hint,
      muted: false,
      soloed: false,
      pan: meta.pan,
      gainDb: 0,
      midiEvents: v.notes.map((n) => ({
        note: n.note,
        velocity: n.velocity,
        startBeat: n.startBeat,
        duration: n.duration,
      })),
      expression: {},
      articulations: v.name.includes("Violin") ? ["legato"] : [],
      qualityTier: "professional",
    };
  });
}
