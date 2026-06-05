import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Analysis } from "./schemas";
import { generateNeoSoulChords, getProgressionLabels, type ChordStem } from "./chord-engine";
import { normalizeMidiEvents } from "./midi-normalize";
import { buildMeendStemExpression, constrainGeneratedStems, stemHasOverlappingNotes } from "./scale-key-guard";
import type { ChordSegment } from "./chord-from-chroma";
import * as ChordKit from "./chordkit";

type CompPattern = "sustained_pads" | "rhythmic_stabs" | "arpeggiated";

export interface GeneratedStemResult {
  id: string;
  name: string;
  role: string;
  register: string;
  instrumentHint: string;
  muted: boolean;
  soloed: boolean;
  pan: number;
  gainDb: number;
  midiEvents: ReturnType<typeof normalizeMidiEvents>;
  expression: Record<string, unknown>;
  articulations: string[];
  qualityTier: string;
}

export function chordStemsToResults(
  chordStems: ChordStem[],
  lock?: { key: string; chords?: ChordSegment[]; bpm?: number; anchorMidi?: number },
): GeneratedStemResult[] {
  const results = chordStems.map((stem) => ({
    id: uuidv4(),
    name: stem.name,
    role: stem.role,
    register: stem.role === "bass" ? "low" : "mid",
    instrumentHint: stem.instrumentHint,
    muted: stem.muted ?? false,
    soloed: stem.soloed ?? false,
    pan: stem.pan,
    gainDb: stem.gainDb,
    midiEvents: normalizeMidiEvents(stem.midiEvents),
    expression: {},
    articulations: [],
    qualityTier: "professional",
  }));
  if (!lock?.key) return results;
  return constrainGeneratedStems(results, lock.key, lock.chords ?? [], lock.bpm ?? 120, {
    anchorMidi: lock.anchorMidi,
  });
}

export function applyMeendToStems(stems: GeneratedStemResult[]): GeneratedStemResult[] {
  return stems.map((stem) => {
    if (stem.midiEvents.length === 0) return stem;
    const polyphonic = stemHasOverlappingNotes(stem.midiEvents);
    const built = buildMeendStemExpression(stem.midiEvents, polyphonic);
    return {
      ...stem,
      midiEvents: built.midiEvents as GeneratedStemResult["midiEvents"],
      expression: {
        ...stem.expression,
        meend: true,
        pitchbend: built.pitchbend,
        monophonic: !polyphonic,
      },
    };
  });
}

export function meendApplicableStemNames(stems: { name: string; midiEvents: unknown[] }[]): string[] {
  return stems.filter((s) => s.midiEvents.length > 0).map((s) => s.name);
}

// ─── Advanced Jazz/Neo-Soul Chord Engine ────────────────────────────────────

interface ChordMidiEvent {
  note: number; velocity: number; startBeat: number; duration: number; channel: number;
}

/**
 * Map a raw chord suffix to the best ChordKit id, ordered longest→shortest to avoid
 * "m" matching "maj7" etc.
 */
function matchChordKitId(symbol: string): string {
  const raw = symbol.replace(/^[A-Ga-g][b#♭♯]?/, "").trim();
  const lo = raw.toLowerCase();
  const candidates: [string, string][] = [
    ["mmaj9", "mM9"], ["mmaj7", "mM7"],
    ["m13", "min13"], ["m11", "min11"], ["m9", "min9"],
    ["m7b5", "min7b5"], ["m7♭5", "min7b5"], ["ø7", "min7b5"],
    ["m6/9", "min69"], ["m6", "min6"], ["m7", "min7"],
    ["maj13#11", "maj13sharp11"], ["maj13", "maj13"],
    ["maj9#11", "maj9sharp11"], ["maj9", "maj9"],
    ["maj7sus4", "maj7sus4"], ["maj7#11", "maj7sharp11"],
    ["maj7add2", "maj7add2"], ["maj7", "maj7"],
    ["6/9", "maj69"], ["maj6", "maj6"],
    ["13sus4", "13sus4"], ["13", "dom13"],
    ["11", "dom11"], ["9sus4", "9sus4"], ["9", "dom9"],
    ["7#11", "7sharp11"], ["7♯11", "7sharp11"],
    ["7#9", "7sharp9"], ["7♯9", "7sharp9"],
    ["7b9", "7b9"], ["7♭9", "7b9"],
    ["7sus4", "7sus4"], ["7b5", "dom7b5"], ["7#5", "dom7sharp5"],
    ["7", "dom7"],
    ["dim7", "dim7"], ["°7", "dim7"],
    ["dim", "dim"], ["°", "dim"],
    ["aug7", "aug7"], ["aug", "aug"], ["+", "aug"],
    ["add9", "add9"], ["add2", "mu_major"],
    ["sus4", "sus4"], ["sus2", "sus2"],
    ["alt", "alt"],
    ["m", "min"],
    ["6", "maj6"],
    ["5", "power5"],
    ["", "maj"],
  ];
  for (const [suffix, id] of candidates) {
    if (lo === suffix.toLowerCase()) return id;
  }
  if (lo.includes("alt")) return "alt";
  for (const [suffix, id] of candidates) {
    if (suffix && lo.startsWith(suffix.toLowerCase())) return id;
  }
  return "maj";
}

/**
 * Automatically upgrade a simple chord to a richer jazz/neo-soul variant
 * so plain "C" becomes "Cmaj9", "Am" → "Am11", "G7" → "G13" etc.
 */
function upgradeChordId(chordId: string): string {
  const upgrades: Record<string, string> = {
    maj:    "maj9",
    min:    "min9",
    dom7:   "dom9",
    maj7:   "maj9",
    min7:   "min9",
    dom9:   "dom13",
    min9:   "min11",
    sus4:   "9sus4",
    sus2:   "sus2",       // keep, already ambiguous
    add9:   "add9",
    power5: "power5",
    dim:    "dim7",
    aug:    "aug7",
  };
  return upgrades[chordId] ?? chordId;
}

/**
 * Build an advanced jazz piano voicing in a clean mid-register range.
 *
 * Strategy:
 *   Bass: root in octave 2 (MIDI 36-47)
 *   Shell: 3rd + 7th in octave 3-4 (48-65)  — defines the chord quality
 *   Color: 9th/11th/13th on top (62-84)    — adds sophistication
 *
 * Voice leading: shift the whole upper cluster by ±12 to stay close to the
 * previous voicing, minimising large jumps.
 */
function buildAdvancedVoicing(
  symbol: string,
  prevUpper: number[],
  inversion = 0,
): { bass: number; upper: number[] } {
  const rootMatch = symbol.match(/^([A-Ga-g][b#♭♯]?)/);
  const rootStr = rootMatch?.[1] ?? "C";
  const rawId = matchChordKitId(symbol);
  const chordId = upgradeChordId(rawId);

  // Try upgraded id first, fall back to raw if not in registry
  let v = ChordKit.voicing(rootStr, chordId, { inversion: 0, octave: 4 });
  if (!v || v.midi.length < 2) {
    v = ChordKit.voicing(rootStr, rawId, { inversion: 0, octave: 4 });
  }
  if (!v || v.midi.length < 2) {
    v = ChordKit.voicing(rootStr, "maj7", { inversion: 0, octave: 4 });
  }
  if (!v) return { bass: 48, upper: [60, 64, 67, 71] };

  // Bass: root two octaves below root of voicing, clamped 28-50
  const rootPc = ChordKit.parseRoot(rootStr);
  const bass = Math.max(28, Math.min(50, 36 + rootPc));

  // Upper voices: MIDI notes from voicing, clamped 57-84
  let upper = v.midi.map((n) => {
    while (n < 57) n += 12;
    while (n > 84) n -= 12;
    return n;
  });

  // Apply inversion by rotating upper voices
  if (inversion > 0 && upper.length > 1) {
    const inv = inversion % upper.length;
    upper = [...upper.slice(inv), ...upper.slice(0, inv).map((n) => {
      let shifted = n + 12;
      while (shifted > 84) shifted -= 12;
      return shifted;
    })];
  }

  // Deduplicate and sort
  upper = [...new Set(upper)].sort((a, b) => a - b).filter((n) => n >= 55 && n <= 84);
  if (upper.length === 0) upper = [60, 64, 67];

  // Voice lead: shift by whole octaves to stay close to previous voicing
  if (prevUpper.length > 0) {
    const prevCenter = prevUpper.reduce((s, n) => s + n, 0) / prevUpper.length;
    const curCenter = upper.reduce((s, n) => s + n, 0) / upper.length;
    const diff = Math.round((prevCenter - curCenter) / 12) * 12;
    if (Math.abs(diff) <= 12) {
      const shifted = upper.map((n) => n + diff);
      if (shifted.every((n) => n >= 52 && n <= 88)) upper = shifted;
    }
  }

  return { bass, upper };
}

/**
 * Quarter-note jazz/R&B comping on the given chord voicing.
 *
 * Each beat in the span gets a chord hit.  The rhythm is varied slightly
 * from beat to beat so it breathes rather than sounding mechanical:
 *   Beat 1    — full chord  (all upper voices + bass already in separate stem)
 *   Beat 2    — top 3 voices, slightly lighter
 *   Beat 2.5  — single-note interior pickup (Glasper-style between-beat touch)
 *   Beat 3    — full chord, slightly softer
 *   Beat 4    — 2-note fragment as anticipation into next chord
 * This pattern repeats every 4 beats, with slight velocity humanisation.
 */
function generateQuarterNoteComp(
  upper: number[],
  startBeat: number,
  spanBeats: number,
  repeatCount: number,
): ChordMidiEvent[] {
  const events: ChordMidiEvent[] = [];
  // Humanise velocity with a tiny deterministic offset per beat
  const velBase = 72 - Math.min(12, repeatCount * 2); // slightly softer on repeats

  let b = startBeat;
  while (b < startBeat + spanBeats - 0.01) {
    const offset = b - startBeat;
    const beatInBar = offset % 4;
    const fraction = offset - Math.floor(offset); // sub-beat
    const isBeat = fraction < 0.05;
    const isOffbeat = Math.abs(fraction - 0.5) < 0.05;

    if (!isBeat && !isOffbeat) {
      b += 0.25;
      continue;
    }

    let notes: number[] = [];
    let vel = velBase;
    let dur = 0.85; // slightly shorter than 1 beat so notes don't overlap

    if (isBeat) {
      if (beatInBar < 0.05) {
        // Beat 1: Full voicing
        notes = upper;
        vel = velBase + 8;
        dur = 0.9;
      } else if (Math.abs(beatInBar - 1) < 0.05) {
        // Beat 2: Top 3 voices
        notes = upper.slice(-Math.min(3, upper.length));
        vel = velBase - 4;
        dur = 0.7;
      } else if (Math.abs(beatInBar - 2) < 0.05) {
        // Beat 3: Full voicing, slightly different registration
        notes = upper.length > 3 ? [...upper.slice(0, 2), ...upper.slice(-1)] : upper;
        vel = velBase + 2;
        dur = 0.85;
      } else if (Math.abs(beatInBar - 3) < 0.05) {
        // Beat 4: 2-note fragment (top + a lower)
        notes = upper.length >= 2 ? [upper[0]!, upper[upper.length - 1]!] : upper;
        vel = velBase - 10;
        dur = 0.6;
      } else {
        notes = upper.slice(-2);
        vel = velBase - 6;
      }
    } else {
      // Offbeat (beat "and"): single inner voice, very light
      // Glasper-style: pick a middle note
      const midIdx = Math.floor(upper.length / 2);
      notes = [upper[midIdx] ?? upper[0]!];
      vel = velBase - 18;
      dur = 0.3;
    }

    // Clamp duration so it doesn't bleed past span end
    const maxDur = Math.max(0.1, (startBeat + spanBeats) - b - 0.04);
    dur = Math.min(dur, maxDur);

    for (const note of notes) {
      events.push({ note, velocity: Math.max(30, Math.min(110, vel)), startBeat: b, duration: dur, channel: 0 });
    }

    b += 0.5; // advance in 8th-note steps so we hit beats and offbeats
  }

  return events;
}

/**
 * Jazz/R&B bass line: root on 1, 5th on 3, chromatic approach a half-step
 * below the next chord root on beat 4, octave pedal on beat 2.
 */
function generateJazzBassLine(
  bass: number,
  nextBass: number | null,
  startBeat: number,
  spanBeats: number,
): ChordMidiEvent[] {
  const events: ChordMidiEvent[] = [];
  const bassNote = Math.max(28, Math.min(50, bass));
  const fifth = bassNote + 7 > 52 ? bassNote - 5 : bassNote + 7; // perfect 5th, keep low

  // Beat 1: root
  events.push({ note: bassNote, velocity: 88, startBeat, duration: Math.min(0.9, spanBeats * 0.4), channel: 1 });

  if (spanBeats >= 2) {
    // Beat 2: octave above root (pedal motion)
    const oct = Math.min(52, bassNote + 12);
    events.push({ note: oct, velocity: 68, startBeat: startBeat + 1, duration: 0.7, channel: 1 });
  }

  if (spanBeats >= 3) {
    // Beat 3: 5th
    events.push({ note: fifth, velocity: 76, startBeat: startBeat + 2, duration: 0.85, channel: 1 });
  }

  if (spanBeats >= 4) {
    // Beat 4: chromatic approach note into next chord
    const target = nextBass ?? bassNote;
    const approach = (target % 12 === 0) ? target - 1 : target - 1;
    const approachNote = Math.max(28, Math.min(52, approach));
    events.push({ note: approachNote, velocity: 62, startBeat: startBeat + 3, duration: 0.55, channel: 1 });
  }

  return events;
}

/**
 * Full advanced chord arrangement from analyzed input chords.
 *
 * - Upgrades simple chord qualities to jazz/neo-soul extensions (maj→maj9, min→min11, etc.)
 * - Generates quarter-note piano comping per beat (not slow pads)
 * - Proper mid-register voicing (MIDI 57–84) with bass separated (28–50)
 * - Piano-style voice leading between consecutive chords
 * - Walking/pedal jazz bass line with chromatic approach notes
 * - Voicing inversion rotates on every repeat for variation
 */
export function generateSmartChordStems(
  sessionChords: ChordSegment[],
  analysis: Analysis,
  quality: "preview" | "full",
  seed: number,
  _pattern: "sustained_pads" | "rhythmic_stabs" | "arpeggiated" = "sustained_pads",
): { stems: GeneratedStemResult[]; plan: Record<string, unknown>; pipeline: { stage: string; stages: string[] } } {
  const bpm = analysis.bpm || 120;
  const beatSec = 60 / bpm;
  const totalBars = quality === "full" ? 32 : 16;
  const maxBeat = totalBars * 4;

  const chordEvents: ChordMidiEvent[] = [];
  const bassEvents: ChordMidiEvent[] = [];

  let prevUpper: number[] = [];
  const symbolsSeen = new Map<string, number>(); // symbol → times seen

  const keyRoot = analysis.key.split(" ")[0] ?? "C";
  const srcChords: ChordSegment[] = sessionChords.length > 0 ? sessionChords : [{
    t0: 0,
    t1: (maxBeat * 60) / bpm,
    symbol: keyRoot + "maj9",
    confidence: 70,
    pitchClasses: [],
  }];

  let beat = 0;
  let srcIdx = 0;

  while (beat < maxBeat) {
    const src = srcChords[srcIdx % srcChords.length]!;
    const nextSrc = srcChords[(srcIdx + 1) % srcChords.length];

    const srcSpanBeats = Math.max(1, (src.t1 - src.t0) / beatSec);
    const spanBeats = Math.min(srcSpanBeats, maxBeat - beat);
    if (spanBeats <= 0) break;

    const timesSeenBefore = symbolsSeen.get(src.symbol) ?? 0;
    symbolsSeen.set(src.symbol, timesSeenBefore + 1);

    const inversion = timesSeenBefore % 3;
    const { bass, upper } = buildAdvancedVoicing(src.symbol, prevUpper, inversion);
    prevUpper = upper;

    // Quarter-note chord comping
    chordEvents.push(...generateQuarterNoteComp(upper, beat, spanBeats, timesSeenBefore));

    // Bass line
    const nextBassNote = nextSrc
      ? Math.max(28, Math.min(50, 36 + ChordKit.parseRoot(nextSrc.symbol.match(/^([A-Ga-g][b#♭♯]?)/)?.[1] ?? "C")))
      : null;
    bassEvents.push(...generateJazzBassLine(bass, nextBassNote, beat, spanBeats));

    beat += spanBeats;
    srcIdx++;
  }

  const uniqueChordNames = [...symbolsSeen.keys()];

  const harmStem = chordStemsToResults([{
    name: "Piano Chords",
    role: "harmony",
    instrumentHint: "electric piano",
    midiEvents: chordEvents,
    pan: -12,
    gainDb: 2,
    muted: false,
    soloed: false,
  }]);

  const bassStem = chordStemsToResults([{
    name: "Bass",
    role: "bass",
    instrumentHint: "electric bass",
    midiEvents: bassEvents,
    pan: 0,
    gainDb: 0,
    muted: false,
    soloed: false,
  }]);

  return {
    stems: [...harmStem, ...bassStem],
    plan: {
      stemCount: 2,
      chordProgression: uniqueChordNames,
      key: analysis.key,
      bpm,
      form: { total_bars: totalBars },
      harmonyRules: `Advanced jazz/neo-soul — ${uniqueChordNames.length} chords, quarter-note comping, voice-led`,
    },
    pipeline: { stage: "complete", stages: ["advanced_chord_engine"] },
  };
}

export function generateDeterministicChordStems(
  analysis: Analysis,
  quality: "preview" | "full",
  seed: number,
  pattern: CompPattern = "sustained_pads",
) {
  const progressionSeed = seed % 5;
  const totalBars = quality === "full" ? 16 : 8;

  // Convert analysis chords (seconds) → beats so the chord engine can use them directly.
  const inputChords =
    analysis.chords && analysis.chords.length >= 2
      ? analysis.chords.map((c) => ({
          symbol: c.symbol,
          startBeat: (c.t0 * analysis.bpm) / 60,
          endBeat: (c.t1 * analysis.bpm) / 60,
        }))
      : undefined;

  const chordStems = generateNeoSoulChords({
    key: analysis.key,
    bpm: analysis.bpm,
    barsPerChord: 2,
    totalBars,
    pattern,
    progressionSeed,
    includeBass: true,
    inputChords,
  });
  const chordNames = getProgressionLabels(analysis.key, progressionSeed);
  return {
    stems: chordStemsToResults(chordStems, {
      key: analysis.key,
      bpm: analysis.bpm,
    }),
    plan: {
      stemCount: chordStems.length,
      chordProgression: chordNames,
      key: analysis.key,
      bpm: analysis.bpm,
      form: { total_bars: totalBars },
      harmonyRules: `Neo-soul voicings in ${analysis.key} (Glasper/Lins style)`,
      meendApplicableStems: [] as string[],
    },
    pipeline: { stage: "complete", stages: ["chord_engine"] },
  };
}

export async function persistGenerationBundle(
  db: typeof import("@/lib/db").db,
  playGenerations: typeof import("@/lib/schema").playGenerations,
  playStems: typeof import("@/lib/schema").playStems,
  opts: {
    generationId: string;
    sessionId: string;
    mode: string;
    quality: string;
    seed: number;
    stems: GeneratedStemResult[];
    plan: Record<string, unknown>;
  },
): Promise<void> {
  const { generationId, sessionId, mode, quality, seed, stems, plan } = opts;

  await db.insert(playGenerations).values({
    id: generationId,
    sessionId,
    mode,
    status: "generating_midi",
    renderQuality: quality,
    seed,
  });

  for (const stem of stems) {
    await db.insert(playStems).values({
      id: stem.id,
      generationId,
      name: stem.name,
      role: stem.role,
      instrumentHint: stem.instrumentHint,
      midiEvents: stem.midiEvents as unknown[],
      expression: stem.expression as any,
      pan: stem.pan,
      gainDb: stem.gainDb,
      muted: stem.muted,
      soloed: stem.soloed,
    });
  }

  await db
    .update(playGenerations)
    .set({
      status: "complete",
      plan: plan as Record<string, unknown>,
      midiData: { stems } as Record<string, unknown>,
      completedAt: new Date(),
    })
    .where(eq(playGenerations.id, generationId));
}
