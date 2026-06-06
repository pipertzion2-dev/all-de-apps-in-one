/**
 * Procedural orchestral ensemble — Juilliard voice-leading, jazz harmony,
 * Björk fragility (woodwinds) × Ivan Lins Brazilian phrasing (strings).
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

export function isEnsembleOrchestralPreset(stylePreset?: string): stylePreset is EnsembleOrchestralPreset {
  return (ENSEMBLE_ORCHESTRAL_PRESETS as readonly string[]).includes(stylePreset ?? "");
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
  phase: number;
  stride: number;
  restChance: number;
  durMul: number;
  velBase: number;
};

export const ABLETON_ORCHESTRAL_STEMS: Omit<StemDef, "voiceRole" | "phase" | "stride" | "restChance" | "durMul" | "velBase">[] = [
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

const STEM_PROFILES: StemDef[] = [
  { ...ABLETON_ORCHESTRAL_STEMS[0]!, voiceRole: "lead", phase: 0, stride: 2, restChance: 0.06, durMul: 0.95, velBase: 78 },
  { ...ABLETON_ORCHESTRAL_STEMS[1]!, voiceRole: "counter", phase: 2, stride: 2, restChance: 0.1, durMul: 0.88, velBase: 72 },
  { ...ABLETON_ORCHESTRAL_STEMS[2]!, voiceRole: "inner", phase: 1, stride: 3, restChance: 0.14, durMul: 0.82, velBase: 68 },
  { ...ABLETON_ORCHESTRAL_STEMS[3]!, voiceRole: "cello", phase: 0, stride: 4, restChance: 0.08, durMul: 1.05, velBase: 74 },
  { ...ABLETON_ORCHESTRAL_STEMS[4]!, voiceRole: "bass", phase: 0, stride: 8, restChance: 0.2, durMul: 1.2, velBase: 70 },
  { ...ABLETON_ORCHESTRAL_STEMS[5]!, voiceRole: "solo", phase: 4, stride: 3, restChance: 0.12, durMul: 1.1, velBase: 80 },
  { ...ABLETON_ORCHESTRAL_STEMS[6]!, voiceRole: "harp", phase: 0, stride: 1, restChance: 0, durMul: 0.75, velBase: 58 },
  { ...ABLETON_ORCHESTRAL_STEMS[7]!, voiceRole: "flute", phase: 3, stride: 6, restChance: 0.35, durMul: 1.15, velBase: 64 },
  { ...ABLETON_ORCHESTRAL_STEMS[8]!, voiceRole: "oboe", phase: 5, stride: 6, restChance: 0.32, durMul: 1.08, velBase: 66 },
  { ...ABLETON_ORCHESTRAL_STEMS[9]!, voiceRole: "timpani", phase: 0, stride: 16, restChance: 0.5, durMul: 0.4, velBase: 88 },
  { ...ABLETON_ORCHESTRAL_STEMS[10]!, voiceRole: "percussion", phase: 2, stride: 8, restChance: 0.45, durMul: 0.15, velBase: 52 },
];

type ThemeEvent = { startBeat: number; degree: number; duration: number; accent: boolean };

type StyleTuning = {
  syncopation: number;
  phraseBars: number;
  hocketDensity: number;
  sustainBias: number;
  counterInterval: 3 | 4 | 6;
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

function midiFromDegree(
  rootPc: number,
  absPcs: number[],
  degree: number,
  baseOctave: number,
): number {
  const rel = relativeSteps(absPcs, rootPc);
  const n = rel.length || 1;
  const octJump = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return clampMidi(12 * (baseOctave + octJump) + rootPc + rel[idx]!);
}

function chordAtBeat(chords: ChordSegment[], beat: number, bpm: number): ChordSegment | null {
  const t = (beat * 60) / bpm;
  for (const c of chords) {
    if (t >= c.t0 && t < c.t1) return c;
  }
  return chords[chords.length - 1] ?? null;
}

function styleTuning(preset: EnsembleOrchestralPreset): StyleTuning {
  switch (preset) {
    case BJORK_LINS_ORCHESTRAL_PRESET:
      return { syncopation: 0.35, phraseBars: 4, hocketDensity: 0.72, sustainBias: 0.15, counterInterval: 3 };
    case CINEMATIC_ORCHESTRA_PRESET:
      return { syncopation: 0.12, phraseBars: 8, hocketDensity: 0.55, sustainBias: 0.45, counterInterval: 6 };
    default:
      return { syncopation: 0.22, phraseBars: 4, hocketDensity: 0.65, sustainBias: 0.25, counterInterval: 4 };
  }
}

/** Primary theme — antecedent/consequent phrases with jazz approach tones. */
function buildPrimaryTheme(
  scale: ScaleResolution,
  chords: ChordSegment[],
  bpm: number,
  durationSec: number,
  seed: number,
  patternLength: PatternLength,
  guideNotes: TranscribedNote[],
  tuning: StyleTuning,
): ThemeEvent[] {
  const rng = new Rng(seed ^ 0x7e4e);
  const beatSec = 60 / bpm;
  const totalBeats = Math.max(16, Math.round(durationSec / beatSec));
  const { cpCellLen } = resolvePatternCellLengths(patternLength);
  const phraseBeats = tuning.phraseBars * 4;
  const events: ThemeEvent[] = [];

  let degree = rng.int(2, 5);
  let beat = 0;

  while (beat < totalBeats - 0.5) {
    const chord = chordAtBeat(chords, beat, bpm);
    const phrasePos = beat % phraseBeats;
    const isCadence = phrasePos >= phraseBeats - 2;
    const isSyncopated = rng.next() < tuning.syncopation;

    if (guideNotes.length && rng.next() < 0.45) {
      const tSec = beat * beatSec;
      const guided = nearestGuideMidi(guideNotes, tSec);
      if (guided != null) {
        degree = midiToNearestDegree(guided, scale, degree);
      }
    }

    const weights: [number, number][] = isCadence
      ? [
          [-1, 0.35],
          [0, 0.25],
          [1, 0.25],
          [-2, 0.15],
        ]
      : [
          [0, 0.12],
          [1, 0.28],
          [-1, 0.28],
          [2, 0.14],
          [-2, 0.1],
          [3, 0.05],
          [-3, 0.03],
        ];
    let t = rng.next() * weights.reduce((s, w) => s + w[1], 0);
    let delta = 0;
    for (const [d, w] of weights) {
      t -= w;
      if (t <= 0) {
        delta = d;
        break;
      }
    }
    degree = Math.max(0, Math.min(cpCellLen * 2, degree + delta));

    const dur = isSyncopated
      ? 0.35 + tuning.sustainBias * 0.4
      : 0.5 + tuning.sustainBias * 0.55 + rng.next() * 0.15;
    const accent = beat % 4 === 0 || (isSyncopated && beat % 1 === 0.5);

    events.push({ startBeat: beat, degree, duration: dur, accent });
    beat += isSyncopated ? 0.5 + rng.next() * 0.5 : 0.25 + rng.int(0, 2) * 0.25;
  }

  if (events.length < 8) {
    for (let i = 0; i < 8; i++) {
      events.push({ startBeat: i * 0.5, degree: 2 + i, duration: 0.5, accent: i % 2 === 0 });
    }
  }
  return events;
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
  const rel = relativeSteps(scale.pitchClasses, scale.rootPc);
  const targetPc = ((midi % 12) + 12) % 12;
  let bestDeg = fallback;
  let bestDist = Infinity;
  for (let d = 0; d < rel.length * 4; d++) {
    const m = midiFromDegree(scale.rootPc, scale.pitchClasses, d, 4);
    const dist = Math.abs(m - midi);
    if (dist < bestDist) {
      bestDist = dist;
      bestDeg = d;
    }
  }
  return bestDeg;
}

function nearestScaleMidi(note: number, scale: ScaleResolution, baseOctave: number): number {
  const rel = relativeSteps(scale.pitchClasses, scale.rootPc);
  const pc = ((note % 12) + 12) % 12;
  let best = midiFromDegree(scale.rootPc, scale.pitchClasses, 0, baseOctave);
  let bestDist = Infinity;
  for (let o = baseOctave - 1; o <= baseOctave + 2; o++) {
    for (const step of rel) {
      const m = clampMidi(12 * (o + 1) + scale.rootPc + step);
      const dist = Math.abs(m - note);
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
  }
  if (!rel.includes(((pc - scale.rootPc + 12) % 12))) {
    return best;
  }
  return clampMidi(12 * (baseOctave + 1) + pc);
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
      return nearestScaleMidi(leadMidi, scale, baseOctave);
    case "counter": {
      const interval = tuning.counterInterval + (rng.next() < 0.3 ? 1 : 0);
      const dir = rng.next() < 0.5 ? -1 : 1;
      return nearestScaleMidi(leadMidi + dir * interval, scale, baseOctave);
    }
    case "inner": {
      const mid = chordPcs[1] ?? chordPcs[0] ?? scale.rootPc;
      return clampMidi(12 * (baseOctave + 1) + mid);
    }
    case "cello": {
      const root = chordPcs[0] ?? scale.rootPc;
      const fifth = chordPcs[2] ?? chordPcs[1] ?? root;
      const pick = eventIdx % 3 === 0 ? fifth : root;
      return clampMidi(12 * (baseOctave + 1) + pick);
    }
    case "bass": {
      const root = chordPcs[0] ?? scale.rootPc;
      return clampMidi(12 * (baseOctave + 1) + root, 28, 55);
    }
    case "flute":
      return eventIdx % 4 === 0
        ? nearestScaleMidi(leadMidi + 12, scale, baseOctave)
        : nearestScaleMidi(leadMidi + 7, scale, baseOctave);
    case "oboe":
      return eventIdx % 5 === 2
        ? nearestScaleMidi(leadMidi - 5, scale, baseOctave)
        : nearestScaleMidi(leadMidi - 3, scale, baseOctave);
    default:
      return leadMidi;
  }
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
    const patterns = [
      [0, 1, 2, 1],
      [0, 2, 1, 2],
      [2, 1, 0, 1],
    ];
    const pat = patterns[rng.int(0, patterns.length - 1)]!;
    let t = startBeat;
    let vi = 0;
    while (t < endBeat - 0.08) {
      const pc = pcs[pat[vi % pat.length]! % pcs.length] ?? 0;
      notes.push({
        note: clampMidi(12 * 5 + pc),
        velocity: 52 + Math.floor(rng.next() * 22),
        startBeat: t,
        duration: 0.2,
      });
      t += 0.25;
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
    const chord = chordAtBeat(chords, b, bpm);
    const root = chord ? (chordSegmentPitchClasses(chord)[0] ?? 0) : 0;
    const low = clampMidi(12 * 3 + root, 28, 48);
    if (b % 4 === 0) {
      notes.push({ note: low, velocity: 92 + rng.int(0, 6), startBeat: b, duration: 0.35 });
    } else if (b % 4 === 2 && rng.next() < 0.55) {
      notes.push({ note: low, velocity: 70 + rng.int(0, 12), startBeat: b + 0.5, duration: 0.18 });
    }
  }
  return notes;
}

function buildPercussionHits(durationSec: number, bpm: number, seed: number): MidiNote[] {
  const rng = new Rng(seed ^ 0xcafe);
  const beatSec = 60 / bpm;
  const totalBeats = Math.max(8, Math.round(durationSec / beatSec));
  const notes: MidiNote[] = [];
  for (let b = 0; b < totalBeats; b++) {
    if (b % 2 !== 1 && b % 4 !== 3) continue;
    if (rng.next() < 0.4) continue;
    notes.push({
      note: 60 + rng.int(0, 3),
      velocity: 44 + rng.int(0, 22),
      startBeat: b + (rng.next() < 0.35 ? 0.5 : 0),
      duration: 0.1,
    });
  }
  return notes;
}

function composeStemLine(
  profile: StemDef,
  theme: ThemeEvent[],
  scale: ScaleResolution,
  chords: ChordSegment[],
  bpm: number,
  totalSixteenths: number,
  tuning: StyleTuning,
  seed: number,
): MidiNote[] {
  const rng = new Rng((seed || 1) + profile.name.length * 131);
  const sixteenth = 0.25;
  const notes: MidiNote[] = [];
  let themeCursor = profile.phase;

  for (let s = profile.phase; s < totalSixteenths; s += profile.stride) {
    if (rng.next() < profile.restChance * (1 - tuning.hocketDensity)) continue;

    const beat = s * sixteenth;
    const event = theme[themeCursor % theme.length]!;
    themeCursor += 1;

    const leadMidi = midiFromDegree(
      scale.rootPc,
      scale.pitchClasses,
      event.degree + profile.phase,
      profile.baseOctave + (profile.voiceRole === "solo" ? 0 : -1),
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
      themeCursor,
    );

    const syncBoost = beat % 1 === 0.5 ? 4 : 0;
    notes.push({
      note: pitch,
      velocity: Math.min(
        127,
        profile.velBase + syncBoost + (event.accent ? 8 : 0) + rng.int(-4, 6),
      ),
      startBeat: beat,
      duration: sixteenth * profile.durMul * (1 + tuning.sustainBias),
    });
  }

  return notes;
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
  const guideNotes = melodyneNotes.length ? melodyneNotes : audioNotes;
  const totalSixteenths = Math.max(16, Math.round(durationSec * (bpm / 60) * 4));

  const theme = buildPrimaryTheme(
    scale,
    chords,
    bpm,
    durationSec,
    seed,
    patternLength,
    guideNotes,
    tuning,
  );

  const parts: VoicePart[] = [];

  for (let i = 0; i < STEM_PROFILES.length; i++) {
    const profile = STEM_PROFILES[i]!;
    let notes: MidiNote[] = [];

    if (profile.voiceRole === "harp") {
      notes = buildHarpArpeggios(chords, bpm, seed);
    } else if (profile.voiceRole === "timpani") {
      notes = buildTimpaniHits(durationSec, bpm, seed, chords);
    } else if (profile.voiceRole === "percussion") {
      notes = buildPercussionHits(durationSec, bpm, seed);
    } else {
      notes = composeStemLine(
        profile,
        theme,
        scale,
        chords,
        bpm,
        totalSixteenths,
        tuning,
        seed + i * 997,
      );
    }

    if (notes.length === 0) {
      notes.push({
        note: midiFromDegree(scale.rootPc, scale.pitchClasses, 2, profile.baseOctave),
        velocity: profile.velBase,
        startBeat: i * 0.25,
        duration: 0.5,
      });
    }

    parts.push({ voiceIndex: i, notes, name: profile.name });
  }

  return parts;
}

/** @deprecated use composeOrchestralEnsemble */
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
      expression: {},
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
