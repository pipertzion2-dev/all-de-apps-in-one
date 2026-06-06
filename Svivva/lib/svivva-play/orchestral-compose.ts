/**
 * Procedural orchestral ensemble — Reich/Shaw canon structure, Brazilian elegance,
 * Juilliard voice-leading. Tempo-aware: slower grid at fast BPM (e.g. 134).
 */
import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import { chordSegmentPitchClasses } from "./scale-key-guard";
import { resolvePatternCellLengths, type PatternLength } from "./pattern-length";
import type { ScaleResolution } from "./reich-engine";
import type { MidiNote, VoicePart } from "./reich-engine";

export const BJORK_LINS_ORCHESTRAL_PRESET = "bjork_lins_orchestral";
export const CINEMATIC_ORCHESTRA_PRESET = "cinematic_orchestra";
export const HYPERREAL_ORCHESTRAL_PRESET = "hyperreal_orchestral";

export const ENSEMBLE_ORCHESTRAL_PRESETS = [
  BJORK_LINS_ORCHESTRAL_PRESET,
  HYPERREAL_ORCHESTRAL_PRESET,
  CINEMATIC_ORCHESTRA_PRESET,
] as const;

export type EnsembleOrchestralPreset = (typeof ENSEMBLE_ORCHESTRAL_PRESETS)[number];

export function isEnsembleOrchestralPreset(
  stylePreset?: string,
): stylePreset is EnsembleOrchestralPreset {
  return (ENSEMBLE_ORCHESTRAL_PRESETS as readonly string[]).includes(stylePreset ?? "");
}

/** Stems that receive Indian Meend when enabled. */
export const ORCHESTRAL_MEEND_STEM_NAMES = [
  "Violin 1",
  "Solo Violin",
  "Flute",
  "Oboe",
] as const;

export function isOrchestralMeendStem(name: string): boolean {
  return ORCHESTRAL_MEEND_STEM_NAMES.some((n) => n === name);
}

type VoiceRole =
  | "lead"
  | "counter"
  | "inner"
  | "cello"
  | "bass"
  | "solo"
  | "harp"
  | "flute"
  | "oboe"
  | "timpani"
  | "percussion";

type StemDef = {
  name: string;
  hint: string;
  role: string;
  register: string;
  baseOctave: number;
  pan: number;
  voiceRole: VoiceRole;
  canonEntryBeats: number;
  stepMul: number;
  restChance: number;
  durMul: number;
  velBase: number;
};

export const ABLETON_ORCHESTRAL_STEMS: Omit<
  StemDef,
  "voiceRole" | "canonEntryBeats" | "stepMul" | "restChance" | "durMul" | "velBase"
>[] = [
  { name: "Violin 1", hint: "violin", role: "melody", register: "high", baseOctave: 4, pan: -55 },
  { name: "Violin 2", hint: "violin", role: "harmony", register: "high", baseOctave: 4, pan: -35 },
  { name: "Viola", hint: "viola", role: "harmony", register: "mid", baseOctave: 3, pan: -15 },
  { name: "Cello", hint: "cello", role: "harmony", register: "mid", baseOctave: 2, pan: 15 },
  { name: "Contrabass", hint: "contrabass", role: "bass", register: "low", baseOctave: 1, pan: 35 },
  { name: "Solo Violin", hint: "solo violin", role: "melody", register: "high", baseOctave: 4, pan: -70 },
  { name: "Harp", hint: "harp", role: "harmony", register: "mid", baseOctave: 3, pan: 25 },
  { name: "Flute", hint: "flute", role: "melody", register: "high", baseOctave: 4, pan: 45 },
  { name: "Oboe", hint: "oboe", role: "melody", register: "mid", baseOctave: 3, pan: 50 },
  { name: "Timpani", hint: "timpani", role: "percussion", register: "low", baseOctave: 2, pan: 0 },
  {
    name: "Percussion",
    hint: "orchestral percussion",
    role: "percussion",
    register: "mid",
    baseOctave: 3,
    pan: 60,
  },
];

/** Reich staggered canon entries (beats) + Shaw sparse woodwinds. */
const STEM_PROFILES: StemDef[] = [
  {
    ...ABLETON_ORCHESTRAL_STEMS[0]!,
    voiceRole: "lead",
    canonEntryBeats: 0,
    stepMul: 1,
    restChance: 0.04,
    durMul: 1.15,
    velBase: 74,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[1]!,
    voiceRole: "counter",
    canonEntryBeats: 1,
    stepMul: 1,
    restChance: 0.08,
    durMul: 1.08,
    velBase: 68,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[2]!,
    voiceRole: "inner",
    canonEntryBeats: 2,
    stepMul: 2,
    restChance: 0.12,
    durMul: 1.2,
    velBase: 64,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[3]!,
    voiceRole: "cello",
    canonEntryBeats: 1.5,
    stepMul: 2,
    restChance: 0.06,
    durMul: 1.35,
    velBase: 70,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[4]!,
    voiceRole: "bass",
    canonEntryBeats: 0,
    stepMul: 4,
    restChance: 0.15,
    durMul: 1.5,
    velBase: 66,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[5]!,
    voiceRole: "solo",
    canonEntryBeats: 4,
    stepMul: 1.5,
    restChance: 0.18,
    durMul: 1.4,
    velBase: 76,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[6]!,
    voiceRole: "harp",
    canonEntryBeats: 0,
    stepMul: 0.5,
    restChance: 0,
    durMul: 0.9,
    velBase: 54,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[7]!,
    voiceRole: "flute",
    canonEntryBeats: 6,
    stepMul: 3,
    restChance: 0.2,
    durMul: 1.6,
    velBase: 58,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[8]!,
    voiceRole: "oboe",
    canonEntryBeats: 8,
    stepMul: 3,
    restChance: 0.16,
    durMul: 1.55,
    velBase: 60,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[9]!,
    voiceRole: "timpani",
    canonEntryBeats: 0,
    stepMul: 4,
    restChance: 0.1,
    durMul: 0.45,
    velBase: 82,
  },
  {
    ...ABLETON_ORCHESTRAL_STEMS[10]!,
    voiceRole: "percussion",
    canonEntryBeats: 2,
    stepMul: 4,
    restChance: 0.2,
    durMul: 0.12,
    velBase: 48,
  },
];

type ThemeEvent = { startBeat: number; degree: number; duration: number; accent: boolean };

type StyleTuning = {
  syncopation: number;
  phraseBars: number;
  sustainBias: number;
  counterInterval: 3 | 4 | 6;
  cellRotations: number[];
};

type TempoFeel = {
  themeStepBeats: number;
  themeDurBeats: number;
  voiceStepBeats: number;
  legatoOverlap: number;
};

/** Orchestral register limits (MIDI) — keeps timbres idiomatic. */
const VOICE_REGISTER: Record<VoiceRole, { min: number; max: number }> = {
  lead: { min: 55, max: 76 },
  counter: { min: 53, max: 74 },
  inner: { min: 48, max: 67 },
  cello: { min: 36, max: 60 },
  bass: { min: 28, max: 50 },
  solo: { min: 58, max: 79 },
  harp: { min: 48, max: 72 },
  flute: { min: 62, max: 81 },
  oboe: { min: 55, max: 77 },
  timpani: { min: 28, max: 48 },
  percussion: { min: 48, max: 72 },
};

const VOICE_MIN_NOTES: Partial<Record<VoiceRole, number>> = {
  lead: 6,
  counter: 5,
  inner: 4,
  cello: 4,
  bass: 2,
  solo: 4,
  flute: 3,
  oboe: 3,
  timpani: 2,
  percussion: 2,
};

const VOICE_DYNAMICS: Record<VoiceRole, { floor: number; ceiling: number; accent: number }> = {
  lead: { floor: 58, ceiling: 96, accent: 10 },
  counter: { floor: 52, ceiling: 88, accent: 7 },
  inner: { floor: 48, ceiling: 78, accent: 5 },
  cello: { floor: 50, ceiling: 82, accent: 6 },
  bass: { floor: 44, ceiling: 72, accent: 4 },
  solo: { floor: 60, ceiling: 98, accent: 12 },
  harp: { floor: 40, ceiling: 68, accent: 3 },
  flute: { floor: 50, ceiling: 84, accent: 8 },
  oboe: { floor: 52, ceiling: 86, accent: 7 },
  timpani: { floor: 72, ceiling: 112, accent: 14 },
  percussion: { floor: 38, ceiling: 76, accent: 10 },
};

class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed || 1;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

function relativeSteps(absPcs: number[], rootPc: number): number[] {
  return [...new Set(absPcs.map((p) => (((p - rootPc) % 12) + 12) % 12))].sort((a, b) => a - b);
}

function clampMidi(note: number, min = 36, max = 92): number {
  return Math.max(min, Math.min(max, Math.round(note)));
}

function clampForVoice(note: number, role: VoiceRole): number {
  const { min, max } = VOICE_REGISTER[role];
  return clampMidi(note, min, max);
}

function midiFromDegree(
  rootPc: number,
  absPcs: number[],
  degree: number,
  baseOctave: number,
): number {
  const rel = relativeSteps(absPcs, rootPc);
  const n = rel.length || 1;
  const cappedDegree = Math.max(0, Math.min(n * 3, degree));
  const octJump = Math.floor(cappedDegree / n);
  const idx = ((cappedDegree % n) + n) % n;
  return clampMidi(12 * (baseOctave + octJump) + rootPc + rel[idx]!);
}

function chordAtBeat(chords: ChordSegment[], beat: number, bpm: number): ChordSegment | null {
  const t = (beat * 60) / bpm;
  for (const c of chords) {
    if (t >= c.t0 && t < c.t1) return c;
  }
  return chords[chords.length - 1] ?? null;
}

/** Half-time elegant grid when BPM is fast (134 → ~1 beat steps, ~2 beat sustains). */
export function tempoFeelForOrchestra(bpm: number): TempoFeel {
  if (bpm >= 128) {
    return { themeStepBeats: 1, themeDurBeats: 2.5, voiceStepBeats: 1, legatoOverlap: 0.18 };
  }
  if (bpm >= 108) {
    return { themeStepBeats: 0.75, themeDurBeats: 2, voiceStepBeats: 0.75, legatoOverlap: 0.15 };
  }
  if (bpm >= 88) {
    return { themeStepBeats: 0.5, themeDurBeats: 1.5, voiceStepBeats: 0.5, legatoOverlap: 0.12 };
  }
  return { themeStepBeats: 0.5, themeDurBeats: 1.25, voiceStepBeats: 0.5, legatoOverlap: 0.1 };
}

function styleTuning(preset: EnsembleOrchestralPreset): StyleTuning {
  switch (preset) {
    case BJORK_LINS_ORCHESTRAL_PRESET:
      return {
        syncopation: 0.1,
        phraseBars: 8,
        sustainBias: 0.9,
        counterInterval: 3,
        cellRotations: [0, 2, 4, 6, 3, 5],
      };
    case CINEMATIC_ORCHESTRA_PRESET:
      return {
        syncopation: 0.06,
        phraseBars: 8,
        sustainBias: 1.1,
        counterInterval: 6,
        cellRotations: [0, 4, 8, 12],
      };
    default:
      return {
        syncopation: 0.14,
        phraseBars: 4,
        sustainBias: 0.75,
        counterInterval: 4,
        cellRotations: [0, 1, 2, 3, 4, 5],
      };
  }
}

function buildMelodicCell(
  scale: ScaleResolution,
  cellLen: number,
  seed: number,
  tuning: StyleTuning,
): number[] {
  const rng = new Rng(seed ^ 0xce11);
  const rel = relativeSteps(scale.pitchClasses, scale.rootPc);
  const n = rel.length || 1;
  let deg = rng.int(1, n + 2);
  const out: number[] = [];
  const weights: [number, number][] = [
    [0, 0.18],
    [1, 0.26],
    [-1, 0.26],
    [2, 0.12],
    [-2, 0.1],
    [3, 0.05],
    [-3, 0.03],
  ];
  for (let i = 0; i < cellLen; i++) {
    if (rng.next() < 0.08) {
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
    deg = Math.max(0, Math.min(n * 3, deg + delta));
    out.push(deg);
  }
  return out;
}

function rotateDegrees(degrees: number[], offset: number): number[] {
  if (!degrees.length) return degrees;
  const o = ((offset % degrees.length) + degrees.length) % degrees.length;
  return [...degrees.slice(o), ...degrees.slice(0, o)];
}

/** Phrase-structured theme on a slow beat grid (not sixteenth hocket). */
function buildPrimaryTheme(
  scale: ScaleResolution,
  chords: ChordSegment[],
  bpm: number,
  durationSec: number,
  seed: number,
  patternLength: PatternLength,
  guideNotes: TranscribedNote[],
  tuning: StyleTuning,
  feel: TempoFeel,
): ThemeEvent[] {
  const rng = new Rng(seed ^ 0x7e4e);
  const beatSec = 60 / bpm;
  const totalBeats = Math.max(16, Math.round(durationSec / beatSec));
  const { cpCellLen } = resolvePatternCellLengths(patternLength);
  const cell = buildMelodicCell(scale, cpCellLen, seed, tuning);
  const phraseBeats = tuning.phraseBars * 4;
  const events: ThemeEvent[] = [];

  let beat = 0;
  let cellIdx = 0;

  while (beat < totalBeats - 0.5) {
    const phrasePos = beat % phraseBeats;
    const isCadence = phrasePos >= phraseBeats - 2;
    const isSyncopated = !isCadence && rng.next() < tuning.syncopation;

    if (guideNotes.length && rng.next() < 0.4) {
      const guided = nearestGuideMidi(guideNotes, beat * beatSec);
      if (guided != null) {
        cell[cellIdx % cell.length] = midiToNearestDegree(guided, scale, cell[cellIdx % cell.length]!);
      }
    }

    const degree = cell[cellIdx % cell.length]!;
    cellIdx++;

    const dur =
      feel.themeDurBeats * (1 + tuning.sustainBias * 0.15) * (isCadence ? 1.15 : 1);
    const accent = beat % 4 === 0;

    events.push({ startBeat: beat, degree, duration: dur, accent });
    beat += isSyncopated
      ? feel.themeStepBeats + 0.5
      : feel.themeStepBeats + (rng.next() < 0.2 ? 0.5 : 0);
  }

  return events.length >= 4
    ? events
    : Array.from({ length: 8 }, (_, i) => ({
        startBeat: i * feel.themeStepBeats,
        degree: 2 + i,
        duration: feel.themeDurBeats,
        accent: i % 2 === 0,
      }));
}

function nearestGuideMidi(notes: TranscribedNote[], tSec: number): number | null {
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

function midiToNearestDegree(midi: number, scale: ScaleResolution, fallback: number): number {
  let bestDeg = fallback;
  let bestDist = Infinity;
  for (let d = 0; d < 21; d++) {
    const m = clampForVoice(midiFromDegree(scale.rootPc, scale.pitchClasses, d, 4), "lead");
    const dist = Math.abs(m - midi);
    if (dist < bestDist) {
      bestDist = dist;
      bestDeg = d;
    }
  }
  return bestDeg;
}

function nearestScaleMidi(
  note: number,
  scale: ScaleResolution,
  baseOctave: number,
  role: VoiceRole,
): number {
  const { min, max } = VOICE_REGISTER[role];
  let best = clampForVoice(midiFromDegree(scale.rootPc, scale.pitchClasses, 0, baseOctave), role);
  let bestDist = Infinity;
  for (let o = baseOctave - 1; o <= baseOctave + 1; o++) {
    for (const step of relativeSteps(scale.pitchClasses, scale.rootPc)) {
      const m = clampForVoice(12 * (o + 1) + scale.rootPc + step, role);
      if (m < min || m > max) continue;
      const dist = Math.abs(m - note);
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
  }
  return best;
}

function voiceLeadForRole(
  leadMidi: number,
  role: VoiceRole,
  chord: ChordSegment | null,
  scale: ScaleResolution,
  baseOctave: number,
  tuning: StyleTuning,
  rng: Rng,
  eventIdx: number,
): number {
  const chordPcs = chord ? chordSegmentPitchClasses(chord) : scale.pitchClasses;

  switch (role) {
    case "lead":
    case "solo":
      return nearestScaleMidi(leadMidi, scale, baseOctave, role);
    case "counter": {
      const interval = tuning.counterInterval + (rng.next() < 0.25 ? 1 : 0);
      const dir = eventIdx % 2 === 0 ? -1 : 1;
      return nearestScaleMidi(leadMidi + dir * interval, scale, baseOctave, role);
    }
    case "inner": {
      const third = chordPcs[1] ?? chordPcs[0] ?? scale.rootPc;
      return clampForVoice(12 * (baseOctave + 1) + third, role);
    }
    case "cello": {
      const root = chordPcs[0] ?? scale.rootPc;
      const fifth = chordPcs[Math.min(2, chordPcs.length - 1)] ?? root;
      return clampForVoice(12 * (baseOctave + 1) + (eventIdx % 4 === 0 ? fifth : root), role);
    }
    case "bass": {
      const root = chordPcs[0] ?? scale.rootPc;
      return clampForVoice(12 * (baseOctave + 1) + root, role);
    }
    case "flute":
      return nearestScaleMidi(leadMidi + (eventIdx % 3 === 0 ? 7 : 4), scale, baseOctave, role);
    case "oboe":
      return nearestScaleMidi(leadMidi - 3, scale, baseOctave, role);
    default:
      return clampForVoice(leadMidi, role);
  }
}

function buildHarpArpeggios(
  chords: ChordSegment[],
  bpm: number,
  seed: number,
  feel: TempoFeel,
): MidiNote[] {
  const rng = new Rng(seed ^ 0xface);
  const beatSec = 60 / bpm;
  const notes: MidiNote[] = [];
  for (const chord of chords) {
    const pcs = chord.pitchClasses?.length
      ? chord.pitchClasses
      : chordSegmentPitchClasses(chord);
    const startBeat = chord.t0 / beatSec;
    const endBeat = chord.t1 / beatSec;
    const step = Math.max(0.5, feel.voiceStepBeats);
    let t = startBeat;
    let vi = 0;
    while (t < endBeat - step * 0.5) {
      const pc = pcs[vi % pcs.length] ?? 0;
      notes.push({
        note: clampForVoice(12 * 4 + pc, "harp"),
        velocity: 48 + rng.int(0, 18),
        startBeat: t,
        duration: step * 0.85,
      });
      t += step;
      vi++;
    }
  }
  return notes;
}

function buildTimpaniHits(
  durationSec: number,
  bpm: number,
  seed: number,
  chords: ChordSegment[],
): MidiNote[] {
  const rng = new Rng(seed ^ 0xbeef);
  const beatSec = 60 / bpm;
  const totalBeats = Math.max(8, Math.round(durationSec / beatSec));
  const notes: MidiNote[] = [];
  for (let b = 0; b < totalBeats; b++) {
    if (b % 4 !== 0) continue;
    const chord = chordAtBeat(chords, b, bpm);
    const root = chord ? (chordSegmentPitchClasses(chord)[0] ?? 0) : 0;
    notes.push({
      note: clampForVoice(clampMidi(12 * 3 + root, 28, 48), "timpani"),
      velocity: 88 + rng.int(0, 8),
      startBeat: b,
      duration: 0.5,
    });
  }
  return notes;
}

function buildPercussionHits(durationSec: number, bpm: number, seed: number): MidiNote[] {
  const rng = new Rng(seed ^ 0xcafe);
  const beatSec = 60 / bpm;
  const totalBeats = Math.max(8, Math.round(durationSec / beatSec));
  const notes: MidiNote[] = [];
  for (let b = 0; b < totalBeats; b++) {
    if (b % 4 !== 2) continue;
    if (rng.next() < 0.45) continue;
    notes.push({
      note: clampForVoice(60, "percussion"),
      velocity: 42 + rng.int(0, 16),
      startBeat: b + 0.5,
      duration: 0.08,
    });
  }
  return notes;
}

/** Reich canon: each voice enters late, shares cell but own rhythm grid. */
function composeStemLine(
  profile: StemDef,
  theme: ThemeEvent[],
  cell: number[],
  cellRotation: number,
  scale: ScaleResolution,
  chords: ChordSegment[],
  bpm: number,
  totalBeats: number,
  tuning: StyleTuning,
  feel: TempoFeel,
  seed: number,
): MidiNote[] {
  const rng = new Rng((seed || 1) + profile.name.length * 131);
  const rotatedCell = rotateDegrees(cell, cellRotation);
  const notes: MidiNote[] = [];
  const step = feel.voiceStepBeats * profile.stepMul;
  let themeIdx = 0;

  for (
    let beat = profile.canonEntryBeats;
    beat < totalBeats - 0.25;
    beat += step
  ) {
    if (rng.next() < profile.restChance) continue;

    const event = theme[themeIdx % theme.length]!;
    themeIdx++;
    const degree = rotatedCell[themeIdx % rotatedCell.length] ?? event.degree;

    const leadMidi = clampForVoice(
      midiFromDegree(scale.rootPc, scale.pitchClasses, degree, profile.baseOctave),
      profile.voiceRole,
    );

    const chord = chordAtBeat(chords, beat, bpm);
    const pitch = voiceLeadForRole(
      leadMidi,
      profile.voiceRole,
      chord,
      scale,
      profile.baseOctave,
      tuning,
      rng,
      themeIdx,
    );

    const dur = Math.max(
      step * profile.durMul * (1 + tuning.sustainBias * 0.2),
      feel.themeDurBeats * 0.85,
    );

    notes.push({
      note: clampForVoice(pitch, profile.voiceRole),
      velocity: Math.min(
        118,
        profile.velBase + (event.accent ? 6 : 0) + rng.int(-3, 5),
      ),
      startBeat: beat,
      duration: dur + feel.legatoOverlap,
    });
  }

  return notes;
}

function ensureVoiceMinimum(
  notes: MidiNote[],
  profile: StemDef,
  scale: ScaleResolution,
  feel: TempoFeel,
): MidiNote[] {
  const min = VOICE_MIN_NOTES[profile.voiceRole] ?? 2;
  if (notes.length >= min) return notes;
  const out = [...notes];
  const rootDeg = 2;
  for (let i = notes.length; i < min; i++) {
    const beat = profile.canonEntryBeats + i * feel.voiceStepBeats * profile.stepMul;
    const pitch = clampForVoice(
      midiFromDegree(scale.rootPc, scale.pitchClasses, rootDeg + i, profile.baseOctave),
      profile.voiceRole,
    );
    out.push({
      note: pitch,
      velocity: profile.velBase,
      startBeat: beat,
      duration: feel.themeDurBeats,
    });
  }
  return out;
}

function phraseDynamicArc(beat: number, phraseBars: number): number {
  const phraseLen = Math.max(4, phraseBars * 4);
  const pos = beat % phraseLen;
  if (pos >= phraseLen - 1) return 0.78;
  return 0.68 + 0.32 * Math.sin((pos / phraseLen) * Math.PI);
}

function applyOrchestralDynamics(
  notes: MidiNote[],
  profile: StemDef,
  tuning: StyleTuning,
): MidiNote[] {
  if (!notes.length) return notes;
  const dyn = VOICE_DYNAMICS[profile.voiceRole];
  return notes.map((n, idx) => {
    const arc = phraseDynamicArc(n.startBeat, tuning.phraseBars);
    const barPos = n.startBeat % 4;
    const downbeatBoost = barPos < 0.2 ? dyn.accent : barPos > 2.75 ? -5 : 0;
    const prev = idx > 0 ? notes[idx - 1]! : null;
    const leap = prev ? Math.abs(n.note - prev.note) : 0;
    const leapSoft = leap > 7 ? -6 : leap > 4 ? -3 : 0;
    const sustainSoft = n.duration > 2.5 ? -4 : 0;
    const target = dyn.floor + (dyn.ceiling - dyn.floor) * arc;
    const velocity = Math.round(
      Math.min(118, Math.max(28, target + downbeatBoost + leapSoft + sustainSoft)),
    );
    return { ...n, velocity };
  });
}

function buildOrchestralExpression(notes: MidiNote[]): Record<string, unknown> {
  const cc1 = notes.map((n) => ({
    beat: n.startBeat,
    value: Math.round((n.velocity / 127) * 127),
  }));
  return {
    cc1,
    cc11: cc1.map((c) => ({ beat: c.beat, value: Math.round(c.value * 0.88) })),
  };
}

export function composeOrchestralEnsemble(opts: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  seed?: number;
  patternLength?: PatternLength;
  preset?: EnsembleOrchestralPreset;
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
    preset = BJORK_LINS_ORCHESTRAL_PRESET,
    melodyneNotes = [],
    audioNotes = [],
    chords = [],
  } = opts;

  const tuning = styleTuning(preset);
  const feel = tempoFeelForOrchestra(bpm);
  const guideNotes = melodyneNotes;
  const beatSec = 60 / bpm;
  const totalBeats = Math.max(16, Math.round(durationSec / beatSec));
  const { cpCellLen } = resolvePatternCellLengths(patternLength);
  const cell = buildMelodicCell(scale, cpCellLen, seed, tuning);

  const theme = buildPrimaryTheme(
    scale,
    chords,
    bpm,
    durationSec,
    seed,
    patternLength,
    guideNotes,
    tuning,
    feel,
  );

  const parts: VoicePart[] = [];

  for (let i = 0; i < STEM_PROFILES.length; i++) {
    const profile = STEM_PROFILES[i]!;
    const rotation = tuning.cellRotations[i % tuning.cellRotations.length] ?? 0;
    let notes: MidiNote[] = [];

    if (profile.voiceRole === "harp") {
      notes = buildHarpArpeggios(chords, bpm, seed, feel);
    } else if (profile.voiceRole === "timpani") {
      notes = buildTimpaniHits(durationSec, bpm, seed, chords);
    } else if (profile.voiceRole === "percussion") {
      notes = buildPercussionHits(durationSec, bpm, seed);
    } else {
      notes = composeStemLine(
        profile,
        theme,
        cell,
        rotation,
        scale,
        chords,
        bpm,
        totalBeats,
        tuning,
        feel,
        seed + i * 997,
      );
      notes = ensureVoiceMinimum(notes, profile, scale, feel);
    }

    if (notes.length === 0) {
      notes.push({
        note: clampForVoice(
          midiFromDegree(scale.rootPc, scale.pitchClasses, 2, profile.baseOctave),
          profile.voiceRole,
        ),
        velocity: profile.velBase,
        startBeat: profile.canonEntryBeats,
        duration: feel.themeDurBeats,
      });
    }

    notes = applyOrchestralDynamics(notes, profile, tuning);

    parts.push({ voiceIndex: i, notes, name: profile.name });
  }

  return parts;
}

const STEM_EXPRESSION_CACHE = new WeakMap<MidiNote[], Record<string, unknown>>();

function expressionForNotes(notes: MidiNote[]): Record<string, unknown> {
  let cached = STEM_EXPRESSION_CACHE.get(notes);
  if (!cached) {
    cached = buildOrchestralExpression(notes);
    STEM_EXPRESSION_CACHE.set(notes, cached);
  }
  return cached;
}

export function composeBjorkLinsOrchestral(
  opts: Parameters<typeof composeOrchestralEnsemble>[0],
): VoicePart[] {
  return composeOrchestralEnsemble({ ...opts, preset: BJORK_LINS_ORCHESTRAL_PRESET });
}

export function orchestralStemHints(): string[] {
  return ABLETON_ORCHESTRAL_STEMS.map((s) => s.hint);
}

export function voicePartsToOrchestralStems(voices: VoicePart[]) {
  return voices.map((v, i) => {
    const meta = ABLETON_ORCHESTRAL_STEMS[i] ?? ABLETON_ORCHESTRAL_STEMS[0]!;
    const profile = STEM_PROFILES[i];
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
      expression: expressionForNotes(v.notes),
      articulations:
        profile?.voiceRole === "lead" || profile?.voiceRole === "solo"
          ? ["legato"]
          : profile?.voiceRole === "flute" || profile?.voiceRole === "oboe"
            ? ["expressivo"]
            : [],
      qualityTier: "professional",
    };
  });
}
