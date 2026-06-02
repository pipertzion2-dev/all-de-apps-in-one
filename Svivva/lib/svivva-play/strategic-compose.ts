/**
 * Strategic composition — listens to harmonic session data (audio + Melodyne + chords)
 * and makes voice-leading, register, and rhythmic choices before generating MIDI.
 */
import type { ChordSegment } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";
import type { Analysis } from "./schemas";
import type { ChordMidiEvent, ChordStem } from "./chord-engine";
import { composeWithChordProgression } from "./compose-from-chords";
import type { VoicePart, ScaleResolution } from "./reich-engine";
import { chordStemsToResults, type GeneratedStemResult } from "./generate-helpers";
import { normalizeMidiEvents } from "./midi-normalize";

export type HarmonicContextInput = {
  chords: ChordSegment[];
  audioNotes: TranscribedNote[];
  melodyneNotes: TranscribedNote[];
  durationSec: number;
  key?: string;
  keySource?: "midi" | "audio" | "hint";
  sources?: { audioTranscription?: boolean; melodyneMidi?: boolean };
};

export type StrategicComposeSettings = {
  seed?: number;
  density?: number;
  complexity?: number;
  compingPattern?: string;
  harmonyMode?: "match" | "reharmonize";
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function parseRoot(symbol: string): number {
  const m = symbol.match(/^([A-G][#b]?)/i);
  if (!m) return 0;
  const idx = NOTE_NAMES.findIndex((n) => n.toLowerCase() === m[1].replace(/b/g, "b"));
  return idx >= 0 ? idx : 0;
}

function pcsForSymbol(symbol: string): number[] {
  const root = parseRoot(symbol);
  const s = symbol.toLowerCase();
  if (s.includes("dim")) return [0, 3, 6].map((p) => (root + p) % 12);
  if (s.includes("m7") && !s.includes("maj")) return [0, 3, 7, 10].map((p) => (root + p) % 12);
  if (s.includes("maj7") || s.includes("ma7")) return [0, 4, 7, 11].map((p) => (root + p) % 12);
  if (s.includes("7")) return [0, 4, 7, 10].map((p) => (root + p) % 12);
  if (s.includes("m")) return [0, 3, 7].map((p) => (root + p) % 12);
  return [0, 4, 7].map((p) => (root + p) % 12);
}

function midiFromPc(pc: number, octave: number): number {
  return Math.max(36, Math.min(96, octave * 12 + pc));
}

function chordAt(chords: ChordSegment[], tSec: number): ChordSegment | null {
  for (const c of chords) {
    if (tSec >= c.t0 && tSec < c.t1) return c;
  }
  return chords[chords.length - 1] ?? null;
}

type ListeningProfile = {
  onsetDensity: number;
  melodicRegister: number;
  hasMelodyne: boolean;
  hasAudioMelody: boolean;
  peakActivityBars: number[];
  chordChangeBeats: number[];
};

function analyzeListening(
  ctx: HarmonicContextInput,
  bpm: number,
  chords: ChordSegment[],
): ListeningProfile {
  const barSec = (60 / bpm) * 4;
  const bars = Math.max(1, Math.ceil(ctx.durationSec / barSec));
  const allNotes = [...ctx.melodyneNotes, ...ctx.audioNotes];
  const onsetsPerBar = new Array(bars).fill(0);
  for (const n of allNotes) {
    const bar = Math.min(bars - 1, Math.floor(n.startSec / barSec));
    onsetsPerBar[bar]++;
  }
  const avg = onsetsPerBar.reduce((a, b) => a + b, 0) / bars;
  const peakActivityBars = onsetsPerBar
    .map((c, i) => ({ i, c }))
    .filter((x) => x.c > avg * 1.2)
    .map((x) => x.i);

  const melodyPool = ctx.melodyneNotes.length ? ctx.melodyneNotes : ctx.audioNotes;
  const melodicRegister =
    melodyPool.length > 0 ? melodyPool.reduce((s, n) => s + n.midi, 0) / melodyPool.length : 67;

  const chordChangeBeats = chords.map((c) => (c.t0 / barSec) * 4);

  return {
    onsetDensity: avg,
    melodicRegister,
    hasMelodyne: ctx.melodyneNotes.length > 4,
    hasAudioMelody: ctx.audioNotes.length > 4,
    peakActivityBars,
    chordChangeBeats,
  };
}

function voiceLeadVoicing(
  chord: ChordSegment,
  prevVoicing: number[],
  register: "low" | "mid" | "high",
): number[] {
  const pcs = chord.pitchClasses?.length > 0 ? chord.pitchClasses : pcsForSymbol(chord.symbol);
  const root = parseRoot(chord.symbol);
  const baseOct = register === "low" ? 2 : register === "high" ? 4 : 3;

  if (!prevVoicing.length) {
    return pcs.map((pc, i) => midiFromPc((root + pc) % 12, baseOct + (i > 2 ? 1 : 0)));
  }

  const candidates: number[][] = [];
  for (let inv = 0; inv < pcs.length; inv++) {
    const rotated = [...pcs.slice(inv), ...pcs.slice(0, inv)];
    const voicing = rotated.map((pc, i) =>
      midiFromPc((root + pc) % 12, baseOct + Math.floor(i / 3)),
    );
    candidates.push(voicing);
  }

  let best = candidates[0];
  let bestCost = Infinity;
  for (const cand of candidates) {
    let cost = 0;
    for (let i = 0; i < Math.min(cand.length, prevVoicing.length); i++) {
      cost += Math.abs(cand[i] - prevVoicing[i]);
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = cand;
    }
  }
  return best;
}

function buildHarmonyEvents(
  chords: ChordSegment[],
  bpm: number,
  profile: ListeningProfile,
  pattern: string,
  density: number,
): ChordMidiEvent[] {
  const beatSec = 60 / bpm;
  const events: ChordMidiEvent[] = [];
  let prevVoicing: number[] = [];
  const useStabs = pattern === "rhythmic_stabs" || profile.onsetDensity > 6;
  const useArp = pattern === "arpeggiated";

  for (const chord of chords) {
    const voicing = voiceLeadVoicing(chord, prevVoicing, "mid");
    prevVoicing = voicing;
    const startBeat = chord.t0 / beatSec;
    const endBeat = chord.t1 / beatSec;
    const span = Math.max(0.5, endBeat - startBeat);

    if (useArp) {
      const step = 0.5;
      let t = startBeat;
      let vi = 0;
      while (t < endBeat - 0.1) {
        events.push({
          note: voicing[vi % voicing.length],
          velocity: 58 + (density % 25),
          startBeat: t,
          duration: step * 0.85,
          channel: 0,
        });
        t += step;
        vi++;
      }
    } else if (useStabs) {
      const hits = Math.max(2, Math.min(8, Math.round(span / 2)));
      for (let h = 0; h < hits; h++) {
        const t = startBeat + (h / hits) * span;
        for (const note of voicing) {
          events.push({
            note,
            velocity: 52 + (h === 0 ? 18 : 8),
            startBeat: t,
            duration: 0.35,
            channel: 0,
          });
        }
      }
    } else {
      for (const note of voicing) {
        events.push({
          note,
          velocity: 64 + (density % 20),
          startBeat,
          duration: Math.max(0.25, span - 0.08),
          channel: 0,
        });
      }
    }
  }
  return events;
}

function buildBassEvents(
  chords: ChordSegment[],
  bpm: number,
  profile: ListeningProfile,
): ChordMidiEvent[] {
  const beatSec = 60 / bpm;
  const events: ChordMidiEvent[] = [];
  for (const chord of chords) {
    const root = parseRoot(chord.symbol);
    const pcs = chord.pitchClasses?.length ? chord.pitchClasses : pcsForSymbol(chord.symbol);
    const rootMidi = midiFromPc(root, 2);
    const fifthPc = pcs.length > 2 ? (root + pcs[2]) % 12 : (root + 7) % 12;
    const fifthMidi = midiFromPc(fifthPc, 2);
    const startBeat = chord.t0 / beatSec;
    const endBeat = chord.t1 / beatSec;
    const span = endBeat - startBeat;

    events.push({
      note: rootMidi,
      velocity: 78,
      startBeat,
      duration: Math.min(1.9, span * 0.45),
      channel: 1,
    });
    if (span > 2 && profile.onsetDensity > 3) {
      events.push({
        note: fifthMidi,
        velocity: 68,
        startBeat: startBeat + 2,
        duration: 1.8,
        channel: 1,
      });
    }
    events.push({
      note: rootMidi,
      velocity: 62,
      startBeat: Math.max(startBeat, endBeat - 0.45),
      duration: 0.35,
      channel: 1,
    });
  }
  return events;
}

function buildMelodyEvents(
  chords: ChordSegment[],
  ctx: HarmonicContextInput,
  bpm: number,
  profile: ListeningProfile,
  seed: number,
): ChordMidiEvent[] {
  const beatSec = 60 / bpm;
  const pool = profile.hasMelodyne ? ctx.melodyneNotes : ctx.audioNotes;
  const events: ChordMidiEvent[] = [];

  if (pool.length >= 6) {
    const sorted = [...pool].sort((a, b) => a.startSec - b.startSec);
    const step = Math.max(1, Math.floor(sorted.length / (chords.length * 3)));
    for (let i = 0; i < sorted.length; i += step) {
      const n = sorted[i];
      const chord = chordAt(chords, n.startSec + 0.01);
      const pcs = chord
        ? chord.pitchClasses?.length
          ? chord.pitchClasses
          : pcsForSymbol(chord.symbol)
        : [0, 4, 7];
      const root = chord ? parseRoot(chord.symbol) : 0;
      let note = n.midi;
      const pc = note % 12;
      const chordTone = pcs.some((p) => (root + p) % 12 === pc);
      if (!chordTone && chord) {
        const targetPc = pcs[(i + seed) % pcs.length];
        const oct = Math.floor(note / 12);
        note = midiFromPc((root + targetPc) % 12, Math.min(6, Math.max(4, oct)));
      }
      events.push({
        note,
        velocity: Math.min(105, n.velocity + 8),
        startBeat: n.startSec / beatSec,
        duration: Math.max(0.12, (n.endSec - n.startSec) / beatSec),
        channel: 2,
      });
    }
    return events;
  }

  for (const chord of chords) {
    const pcs = chord.pitchClasses?.length ? chord.pitchClasses : pcsForSymbol(chord.symbol);
    const root = parseRoot(chord.symbol);
    const startBeat = chord.t0 / beatSec;
    const oct = Math.floor(profile.melodicRegister / 12);
    const note = midiFromPc((root + pcs[1 % pcs.length]) % 12, Math.min(6, oct));
    events.push({
      note,
      velocity: 72,
      startBeat: startBeat + 0.5,
      duration: Math.max(0.2, (chord.t1 - chord.t0) / beatSec - 0.6),
      channel: 2,
    });
  }
  return events;
}

function chordProgressionLabels(chords: ChordSegment[]): string[] {
  const out: string[] = [];
  for (const c of chords) {
    if (out[out.length - 1] !== c.symbol) out.push(c.symbol);
  }
  return out;
}

/** Full multi-stem strategic arrangement from listened harmonic context. */
export function generateStrategicStems(
  analysis: Analysis,
  ctx: HarmonicContextInput,
  quality: "preview" | "full",
  seed: number,
  settings: StrategicComposeSettings = {},
): {
  stems: GeneratedStemResult[];
  plan: Record<string, unknown>;
  pipeline: { stage: string; stages: string[] };
} {
  const bpm = analysis.bpm || 120;
  const chords =
    ctx.chords.length >= 2
      ? ctx.chords
      : (analysis.chords as ChordSegment[]).map((c) => ({
          t0: c.t0,
          t1: c.t1,
          symbol: c.symbol,
          confidence: c.confidence ?? 55,
          pitchClasses: pcsForSymbol(c.symbol),
        }));

  const profile = analyzeListening(ctx, bpm, chords);
  const density = settings.density ?? 55;
  const pattern = settings.compingPattern ?? "sustained_pads";
  const totalBars = quality === "full" ? 32 : 16;

  const trimmed = chords.filter((c) => c.t0 < (totalBars * 60 * 4) / bpm).slice(0, totalBars);

  const harmonyEvents = buildHarmonyEvents(trimmed, bpm, profile, pattern, density);
  const bassEvents = buildBassEvents(trimmed, bpm, profile);
  const melodyEvents = buildMelodyEvents(trimmed, ctx, bpm, profile, seed);

  const chordStems: ChordStem[] = [
    {
      name: "Strategic Harmony",
      role: "harmony",
      instrumentHint: profile.hasMelodyne ? "rhodes" : "electric piano",
      midiEvents: harmonyEvents,
      pan: -12,
      gainDb: 0,
      muted: false,
      soloed: false,
    },
    {
      name: "Strategic Bass",
      role: "bass",
      instrumentHint: "electric bass",
      midiEvents: bassEvents,
      pan: 0,
      gainDb: -1,
      muted: false,
      soloed: false,
    },
    {
      name: "Strategic Melody",
      role: "melody",
      instrumentHint: profile.hasMelodyne ? "lead synth" : "vibraphone",
      midiEvents: melodyEvents,
      pan: 18,
      gainDb: -2,
      muted: false,
      soloed: false,
    },
  ];

  if (density > 60 && profile.peakActivityBars.length > 0) {
    const padEvents: ChordMidiEvent[] = [];
    let prev: number[] = [];
    for (const chord of trimmed) {
      const v = voiceLeadVoicing(chord, prev, "mid");
      prev = v;
      const startBeat = chord.t0 / (60 / bpm);
      padEvents.push({
        note: v[0],
        velocity: 42,
        startBeat,
        duration: ((chord.t1 - chord.t0) / (60 / bpm)) * 0.9,
        channel: 3,
      });
    }
    chordStems.push({
      name: "Strategic Pad",
      role: "pad",
      instrumentHint: "strings",
      midiEvents: padEvents,
      pan: -28,
      gainDb: -4,
      muted: false,
      soloed: false,
    });
  }

  const labels = chordProgressionLabels(trimmed);

  return {
    stems: chordStemsToResults(chordStems),
    plan: {
      stemCount: chordStems.length,
      chordProgression: labels,
      key: analysis.key,
      bpm,
      form: { total_bars: totalBars },
      harmonyRules: `Strategic compose: voice-led harmony from ${
        profile.hasMelodyne ? "Melodyne + audio" : "audio"
      } chord map (${labels.join(" → ")})`,
      meendApplicableStems: [],
      strategicProfile: {
        onsetDensity: profile.onsetDensity,
        sources: ctx.sources,
      },
    },
    pipeline: { stage: "complete", stages: ["strategic_listen", "strategic_compose"] },
  };
}

/** Reich-style counterpoint using strategic chord + melodyne listening. */
export function composeStrategicReich(options: {
  durationSec: number;
  bpm: number;
  scale: ScaleResolution;
  style: "reich_electric" | "shaw_interlace" | "phase_canon";
  seed: number;
  type: "counterpoint" | "hocket";
  ctx: HarmonicContextInput;
}): VoicePart[] {
  const chords = options.ctx.chords.length >= 2 ? options.ctx.chords : options.ctx.chords;
  return composeWithChordProgression({
    durationSec: options.durationSec,
    bpm: options.bpm,
    scale: options.scale,
    style: options.style,
    seed: options.seed,
    type: options.type,
    chords,
    melodyneNotes: options.ctx.melodyneNotes,
  });
}

export function harmonicContextFromAnalysis(
  analysis: Analysis,
  ctx?: Partial<HarmonicContextInput>,
): HarmonicContextInput {
  return {
    chords: (ctx?.chords?.length ? ctx.chords : (analysis.chords as ChordSegment[])) ?? [],
    audioNotes: ctx?.audioNotes ?? [],
    melodyneNotes: ctx?.melodyneNotes ?? [],
    durationSec: ctx?.durationSec ?? 32,
    sources: ctx?.sources,
  };
}

export function voicePartsToStemResults(
  voices: VoicePart[],
  hints: string[],
): GeneratedStemResult[] {
  return voices.map((v, i) => ({
    id: `strategic-v-${i}`,
    name: v.name,
    role: i === 0 ? "melody" : "harmony",
    register: i < 2 ? "mid" : "high",
    instrumentHint: hints[i % hints.length],
    muted: false,
    soloed: false,
    pan: Math.round((i / Math.max(voices.length - 1, 1)) * 160 - 80),
    gainDb: 0,
    midiEvents: normalizeMidiEvents(
      v.notes.map((n) => ({
        note: n.note,
        velocity: n.velocity,
        startBeat: n.startBeat,
        duration: n.duration,
      })),
    ),
    expression: {},
    articulations: [],
    qualityTier: "professional",
  }));
}
