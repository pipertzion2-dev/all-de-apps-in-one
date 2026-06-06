import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Analysis } from "./schemas";
import { generateNeoSoulChords, getProgressionLabels, type ChordStem } from "./chord-engine";
import { normalizeMidiEvents } from "./midi-normalize";
import { buildMeendStemExpression, constrainGeneratedStems, prepareMeendPreviewEvents, stemHasOverlappingNotes } from "./scale-key-guard";
import { prepareMeendLegatoMidiEvents } from "./meend-midi";
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
  return stems.map((stem) => meendStemIfMonophonic(stem));
}

function meendStemIfMonophonic(stem: GeneratedStemResult): GeneratedStemResult {
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
}

/** Meend on lyrical orchestral stems when explicitly enabled — legato for audible glides. */
export function applyMeendToOrchestralMelodyStems(
  stems: GeneratedStemResult[],
): GeneratedStemResult[] {
  return stems.map((stem) => {
    if (!/violin 1|solo violin|flute|oboe/i.test(stem.name)) return stem;
    if (stem.midiEvents.length === 0) return stem;
    const sorted = [...stem.midiEvents].sort((a, b) => a.startBeat - b.startBeat);
    const monoReady = prepareMeendPreviewEvents(sorted, 0.5, 2.6);
    const legato = prepareMeendLegatoMidiEvents(monoReady);
    const built = buildMeendStemExpression(legato, false, { peakSemitones: 0.95 });
    return {
      ...stem,
      midiEvents: built.midiEvents as GeneratedStemResult["midiEvents"],
      expression: {
        ...stem.expression,
        meend: true,
        pitchbend: built.pitchbend,
        monophonic: true,
      },
    };
  });
}

export function orchestralMeendStemNames(stems: { name: string }[]): string[] {
  return stems.filter((s) => /violin 1|solo violin|flute|oboe/i.test(s.name)).map((s) => s.name);
}

export function meendApplicableStemNames(stems: { name: string; midiEvents: unknown[] }[]): string[] {
  return stems.filter((s) => s.midiEvents.length > 0).map((s) => s.name);
}

// ─── Correct Jazz/Neo-Soul Chord Engine ─────────────────────────────────────

interface ChordMidiEvent {
  note: number; velocity: number; startBeat: number; duration: number; channel: number;
}

/**
 * Map a raw chord suffix to the best ChordKit id.
 * Ordered longest→shortest to avoid "m" swallowing "maj7" etc.
 */
function matchChordKitId(symbol: string): string {
  const raw = symbol.replace(/^[A-Ga-g][b#♭♯]?/, "").trim();
  const lo = raw.toLowerCase();
  const candidates: [string, string][] = [
    ["mmaj9","mM9"],["mmaj7","mM7"],
    ["m13","min13"],["m11","min11"],["m9","min9"],
    ["m7b5","min7b5"],["m7♭5","min7b5"],["ø7","min7b5"],["ø","min7b5"],
    ["m6/9","min69"],["m6","min6"],["m7","min7"],
    ["maj13#11","maj13sharp11"],["maj13","maj13"],
    ["maj9#11","maj9sharp11"],["maj9","maj9"],
    ["maj7sus4","maj7sus4"],["maj7#11","maj7sharp11"],
    ["maj7add2","maj7add2"],["maj7","maj7"],
    ["6/9","maj69"],["maj6","maj6"],
    ["13sus4","13sus4"],["13","dom13"],
    ["11","dom11"],["9sus4","9sus4"],["9","dom9"],
    ["7#11","7sharp11"],["7♯11","7sharp11"],
    ["7#9","7sharp9"],["7♯9","7sharp9"],
    ["7b9","7b9"],["7♭9","7b9"],
    ["7sus4","7sus4"],["7b5","dom7b5"],["7#5","dom7sharp5"],
    ["7","dom7"],
    ["dim7","dim7"],["°7","dim7"],
    ["dim","dim"],["°","dim"],
    ["aug7","aug7"],["aug","aug"],["+","aug"],
    ["add9","add9"],["add2","mu_major"],
    ["sus4","sus4"],["sus2","sus2"],
    ["alt","alt"],
    ["m","min"],
    ["6","maj6"],
    ["5","power5"],
    ["","maj"],
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
 * Upgrade simple chord qualities to richer jazz/neo-soul extensions.
 * Only a single step so the sound stays musical and coherent.
 */
function upgradeChordId(id: string): string {
  const map: Record<string,string> = {
    maj:"maj9", min:"min9",
    dom7:"dom9", maj7:"maj9", min7:"min9",
    dom9:"dom13",
    sus4:"9sus4", dim:"dim7", aug:"aug7",
  };
  return map[id] ?? id;
}

/**
 * Build a correct jazz piano shell voicing using midiVoicing (correct root-position
 * intervals) rather than the buggy ChordKit.voicing (which sorts PCs 0-11 and produces
 * wrong root notes for chords whose root > F).
 *
 * Shell strategy: root+3rd+7th+extension = 4 clear notes
 *   - Root goes in bass stem; upper voices hold 3rd, 7th, and best extension
 *   - 5th dropped (least important in jazz harmony)
 *   - Target register: MIDI 57–81 (A3–A5)
 *   - Voice leading: shift whole cluster ±12 toward previous voicing center
 */
function buildJazzShellVoicing(
  symbol: string,
  prevUpper: number[],
  inversion: number,
): { bass: number; upper: number[] } {
  const rootMatch = symbol.match(/^([A-Ga-g][b#♭♯]?)/);
  const rootStr = rootMatch?.[1] ?? "C";
  const rootPc = ChordKit.parseRoot(rootStr);

  const rawId = matchChordKitId(symbol);
  const chordId = upgradeChordId(rawId);

  // midiVoicing builds notes from root upward using intervals — always correct.
  // base octave 3 → root starts around MIDI 48-59 (one below middle C).
  let allNotes = ChordKit.midiVoicing(rootStr, chordId, 3);
  if (allNotes.length < 2) allNotes = ChordKit.midiVoicing(rootStr, rawId, 3);
  if (allNotes.length < 2) allNotes = ChordKit.midiVoicing(rootStr, "maj7", 3);
  if (allNotes.length < 2) {
    // Hard fallback: build basic triad manually
    const r = 48 + rootPc;
    return { bass: r - 12, upper: [r, r + 4, r + 7] };
  }

  // Bass: root at octave 2 (MIDI 24-35 range, then clamp 28-50)
  const bass = Math.max(28, Math.min(50, 24 + rootPc));

  // Build shell voicing: skip root (index 0), skip 5th (interval = 7)
  const def = ChordKit.get(chordId) ?? ChordKit.get(rawId);
  const intervals = def?.intervals ?? [];
  const fifthIdx = intervals.indexOf(7); // perfect 5th at 7 semitones

  const shell: number[] = [];
  for (let i = 1; i < allNotes.length && shell.length < 4; i++) {
    if (i === fifthIdx) continue; // drop 5th
    shell.push(allNotes[i]!);
  }
  // If stripping the 5th left us with fewer than 2 notes, add it back
  if (shell.length < 2 && fifthIdx > 0 && fifthIdx < allNotes.length) {
    shell.push(allNotes[fifthIdx]!);
  }
  if (shell.length === 0) shell.push(...allNotes.slice(1, 4));

  // Shift the whole cluster into target register 57–79 (A3–G5)
  let upper = [...shell].sort((a, b) => a - b);
  const center = (upper[0]! + upper[upper.length - 1]!) / 2;
  const target = 68; // E4 — sweet spot for comp piano
  const octShift = Math.round((target - center) / 12) * 12;
  upper = upper.map(n => n + octShift);

  // Final range clamp: keep every note inside 52–84
  upper = upper.map(n => {
    while (n < 52) n += 12;
    while (n > 84) n -= 12;
    return n;
  });
  upper = [...new Set(upper)].sort((a, b) => a - b).filter(n => n >= 52 && n <= 84);
  if (upper.length === 0) upper = [60 + rootPc % 12, 64 + rootPc % 12, 67 + rootPc % 12];

  // Apply inversion: rotate bottom note to top
  for (let i = 0; i < (inversion % upper.length); i++) {
    const first = upper.shift()!;
    let top = first + 12;
    while (top > 84) top -= 12;
    upper.push(top);
  }
  upper.sort((a, b) => a - b);

  // Voice leading: shift whole cluster by ±12 to stay close to previous voicing
  if (prevUpper.length >= 2) {
    const prevCenter = prevUpper.reduce((s, n) => s + n, 0) / prevUpper.length;
    const curCenter = upper.reduce((s, n) => s + n, 0) / upper.length;
    const shift = Math.round((prevCenter - curCenter) / 12) * 12;
    if (Math.abs(shift) <= 12) {
      const shifted = upper.map(n => n + shift);
      if (shifted.every(n => n >= 48 && n <= 88)) upper = shifted.sort((a,b)=>a-b);
    }
  }

  return { bass, upper };
}

/**
 * Quarter-note jazz/R&B comp hits.
 * One clean chord event per beat — no offbeat clutters.
 * Beat 1 = full chord (strongest), beat 2 = top voices, beat 3 = full, beat 4 = fragment.
 */
function generateQuarterNoteComp(
  upper: number[],
  startBeat: number,
  spanBeats: number,
  repeatCount: number,
): ChordMidiEvent[] {
  const events: ChordMidiEvent[] = [];
  const velBase = Math.max(58, 76 - Math.min(10, repeatCount * 2));

  for (let beatOff = 0; beatOff < spanBeats - 0.01; beatOff += 1) {
    const b = startBeat + beatOff;
    const beatInBar = Math.round(beatOff) % 4;
    const maxDur = Math.min(0.88, spanBeats - beatOff - 0.04);
    if (maxDur <= 0) break;

    let notes: number[];
    let vel: number;
    let dur: number;

    if (beatInBar === 0) {
      // Downbeat: full chord, loudest
      notes = upper;
      vel = velBase + 8;
      dur = Math.min(0.88, maxDur);
    } else if (beatInBar === 1) {
      // Beat 2: top half of voicing, lighter
      notes = upper.slice(Math.max(0, upper.length - 2));
      vel = velBase - 8;
      dur = Math.min(0.70, maxDur);
    } else if (beatInBar === 2) {
      // Beat 3 (backbeat): full chord, medium
      notes = upper;
      vel = velBase + 2;
      dur = Math.min(0.82, maxDur);
    } else {
      // Beat 4: anticipation fragment — bottom + top note only
      notes = upper.length >= 2 ? [upper[0]!, upper[upper.length - 1]!] : upper;
      vel = velBase - 14;
      dur = Math.min(0.55, maxDur);
    }

    for (const note of notes) {
      events.push({
        note,
        velocity: Math.max(30, Math.min(110, vel)),
        startBeat: b,
        duration: dur,
        channel: 0,
      });
    }
  }

  return events;
}

/**
 * Solid jazz/R&B bass line:
 *   Beat 1 — root (strong)
 *   Beat 2 — root (softer, pedal)
 *   Beat 3 — 5th or 4th
 *   Beat 4 — chromatic approach into next chord root
 */
function generateJazzBassLine(
  bassNote: number,
  nextBassNote: number | null,
  startBeat: number,
  spanBeats: number,
): ChordMidiEvent[] {
  const events: ChordMidiEvent[] = [];
  const root = Math.max(28, Math.min(50, bassNote));
  const fifth = root + 7 <= 52 ? root + 7 : root - 5;

  events.push({ note: root, velocity: 90, startBeat, duration: Math.min(0.88, spanBeats * 0.4), channel: 1 });

  if (spanBeats >= 2) {
    events.push({ note: root, velocity: 70, startBeat: startBeat + 1, duration: 0.75, channel: 1 });
  }
  if (spanBeats >= 3) {
    events.push({ note: fifth, velocity: 78, startBeat: startBeat + 2, duration: 0.80, channel: 1 });
  }
  if (spanBeats >= 4 && nextBassNote !== null) {
    // Approach: half-step below target on beat 4
    const approach = Math.max(28, Math.min(52, nextBassNote - 1));
    events.push({ note: approach, velocity: 64, startBeat: startBeat + 3, duration: 0.50, channel: 1 });
  }

  return events;
}

/**
 * Full advanced chord arrangement from analyzed input chords.
 *
 * Uses ChordKit.midiVoicing (correct root-position intervals) to build voicings.
 * Quarter-note comping: one clean chord hit per beat, no offbeat clutter.
 * Shell voicings: 3rd + 7th + extension (5th dropped, root in bass stem).
 * Voice leading: cluster shifts by ±12 to minimise movement between chords.
 */
export function generateSmartChordStems(
  sessionChords: ChordSegment[],
  analysis: Analysis,
  quality: "preview" | "full",
  _seed: number,
  _pattern: "sustained_pads" | "rhythmic_stabs" | "arpeggiated" = "sustained_pads",
): { stems: GeneratedStemResult[]; plan: Record<string, unknown>; pipeline: { stage: string; stages: string[] } } {
  const bpm = analysis.bpm || 120;
  const beatSec = 60 / bpm;
  const totalBars = quality === "full" ? 32 : 16;
  const maxBeat = totalBars * 4;

  const chordEvents: ChordMidiEvent[] = [];
  const bassEvents: ChordMidiEvent[] = [];

  let prevUpper: number[] = [];
  const symbolsSeen = new Map<string, number>();

  const keyRoot = (analysis.key.split(" ")[0] ?? "C");
  const srcChords: ChordSegment[] = sessionChords.length > 0 ? sessionChords : [{
    t0: 0, t1: (maxBeat * 60) / bpm,
    symbol: keyRoot + "maj9", confidence: 70, pitchClasses: [],
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

    const { bass, upper } = buildJazzShellVoicing(src.symbol, prevUpper, timesSeenBefore % 3);
    prevUpper = upper;

    chordEvents.push(...generateQuarterNoteComp(upper, beat, spanBeats, timesSeenBefore));

    const nextBass = nextSrc
      ? Math.max(28, Math.min(50, 24 + ChordKit.parseRoot(nextSrc.symbol.match(/^([A-Ga-g][b#♭♯]?)/)?.[1] ?? "C")))
      : null;
    bassEvents.push(...generateJazzBassLine(bass, nextBass, beat, spanBeats));

    beat += spanBeats;
    srcIdx++;
  }

  const uniqueChords = [...symbolsSeen.keys()];

  const harmStem = chordStemsToResults([{
    name: "Piano Chords",
    role: "harmony",
    instrumentHint: "comp piano",
    midiEvents: chordEvents,
    pan: -10,
    gainDb: 1,
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
      chordProgression: uniqueChords,
      key: analysis.key,
      bpm,
      form: { total_bars: totalBars },
      harmonyRules: `Jazz shell voicings — ${uniqueChords.length} chords, correct root-position, quarter-note comp`,
    },
    pipeline: { stage: "complete", stages: ["jazz_chord_engine_v2"] },
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
