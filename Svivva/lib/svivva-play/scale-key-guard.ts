/**
 * Locks generated MIDI to the session key and chord map — no out-of-key notes from compose/LLM.
 */
import type { ChordSegment } from "./chord-from-chroma";
import { normalizeKeyLabel, parseRootFromKeyLabel, isMinorKeyLabel } from "./analysis-utils";
import type { NormalizedMidiEvent } from "./midi-normalize";
import { resolveScale, type ScaleResolution } from "./reich-engine";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

export type ScaleInfo = {
  keyLabel: string;
  rootPc: number;
  isMinor: boolean;
  scalePcs: Set<number>;
};

export function parseScaleFromKey(key: string): ScaleInfo {
  return resolveCompositionScale(key, "major").scaleInfo;
}

const MINOR_SCALE_NAMES = new Set([
  "minor",
  "natural_minor",
  "harmonic_minor",
  "melodic_minor_asc",
  "pentatonic_minor",
  "blues_minor",
  "raga_bhairavi",
  "raga_todi",
]);

/** Guess major vs minor from chord symbols when key detection is ambiguous. */
export function inferKeyModeFromChords(chords: ChordSegment[]): "major" | "minor" | null {
  if (!chords.length) return null;
  let minorish = 0;
  let majorish = 0;
  for (const c of chords) {
    const s = c.symbol.replace(/\s+/g, "");
    if (!s) continue;
    if (/^[A-G][#b]?m(?!aj)/i.test(s) || /\bmin/i.test(s) || /dim|°/i.test(s)) minorish++;
    else majorish++;
  }
  if (majorish >= minorish + 2) return "major";
  if (minorish >= majorish + 2) return "minor";
  return null;
}

function modeFromScaleName(scaleName: string, fallback: "major" | "minor"): "major" | "minor" {
  const sn = scaleName.toLowerCase().replace(/ /g, "_");
  if (MINOR_SCALE_NAMES.has(sn)) return "minor";
  if (
    sn === "major" ||
    sn === "ionian" ||
    sn === "pentatonic_major" ||
    sn === "lydian" ||
    sn === "mixolydian" ||
    sn === "whole_tone" ||
    sn.startsWith("raga_")
  ) {
    if (sn === "raga_bhairavi" || sn === "raga_todi") return "minor";
    return "major";
  }
  return fallback;
}

/** Authoritative scale for compose + constrain (matches reich-engine lookup). */
export function resolveCompositionScale(
  key: string,
  scaleName = "major",
  manualKey?: string | null,
  chords: ChordSegment[] = [],
): { scaleInfo: ScaleInfo; resolution: ScaleResolution } {
  const effectiveKey = normalizeKeyLabel(manualKey?.trim() || key);
  const root = parseRootFromKeyLabel(effectiveKey);
  const sn = scaleName.toLowerCase().replace(/ /g, "_");
  const scaleLocksMode =
    sn === "major" ||
    sn === "ionian" ||
    sn === "minor" ||
    sn === "natural_minor" ||
    sn === "pentatonic_major" ||
    sn === "pentatonic_minor";

  let mode: "major" | "minor" = isMinorKeyLabel(effectiveKey) ? "minor" : "major";
  if (scaleLocksMode) {
    mode = modeFromScaleName(scaleName, mode);
  } else {
    if (!manualKey?.trim()) {
      const fromChords = inferKeyModeFromChords(chords);
      if (fromChords) mode = fromChords;
    }
    mode = modeFromScaleName(scaleName, mode);
  }

  const resolution = resolveScale(mode, root, scaleName);
  return {
    resolution,
    scaleInfo: {
      keyLabel: `${root} ${mode}`,
      rootPc: resolution.rootPc,
      isMinor: mode === "minor",
      scalePcs: new Set(resolution.pitchClasses),
    },
  };
}

function parseChordRoot(symbol: string): number {
  const m = symbol.match(/^([A-G][#b]?)/i);
  if (!m) return 0;
  const idx = NOTE_NAMES.findIndex((n) => n.toLowerCase() === m[1]!.toLowerCase());
  return idx >= 0 ? idx : 0;
}

function chordPcsAtBeat(
  chords: ChordSegment[],
  beat: number,
  bpm: number,
): { rootPc: number; pcs: number[] } | null {
  if (!chords.length || bpm <= 0) return null;
  const tSec = (beat * 60) / bpm;
  for (const c of chords) {
    if (tSec >= c.t0 && tSec < c.t1) {
      const rootPc = parseChordRoot(c.symbol);
      const pcs =
        c.pitchClasses?.length > 0
          ? c.pitchClasses.map((p) => (rootPc + p) % 12)
          : defaultTriadPcs(c.symbol, rootPc);
      return { rootPc, pcs };
    }
  }
  const last = chords[chords.length - 1]!;
  const rootPc = parseChordRoot(last.symbol);
  return {
    rootPc,
    pcs:
      last.pitchClasses?.length > 0
        ? last.pitchClasses.map((p) => (rootPc + p) % 12)
        : defaultTriadPcs(last.symbol, rootPc),
  };
}

function defaultTriadPcs(symbol: string, rootPc: number): number[] {
  const s = symbol.toLowerCase();
  if (s.includes("m") && !s.includes("maj")) {
    return [0, 3, 7].map((p) => (rootPc + p) % 12);
  }
  return [0, 4, 7].map((p) => (rootPc + p) % 12);
}

/** Nearest pitch class in allowed set, preserving octave. */
export function snapNoteToPitchClasses(note: number, allowed: Set<number>): number {
  const pc = ((note % 12) + 12) % 12;
  if (allowed.has(pc)) return note;
  let best = note;
  let bestDist = 99;
  for (const target of allowed) {
    for (const delta of [-12, 0, 12]) {
      const candidate = note + ((target - pc + 12) % 12) + delta;
      if (candidate < 24 || candidate > 108) continue;
      const dist = Math.abs(candidate - note);
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
  }
  return Math.max(24, Math.min(108, best));
}

export function snapNoteToScale(note: number, scale: ScaleInfo): number {
  return snapNoteToPitchClasses(note, scale.scalePcs);
}

/** Keep generated notes in a musical register (anchored to source melody when known). */
export function clampNoteToRegister(
  note: number,
  role: string,
  opts?: { anchorMidi?: number },
): number {
  const roleNorm = role.toLowerCase();
  if (roleNorm === "bass") return Math.max(36, Math.min(55, note));
  if (roleNorm === "harmony" || roleNorm === "pad") return Math.max(48, Math.min(72, note));
  const anchor = opts?.anchorMidi ?? 67;
  const min = Math.max(55, anchor - 14);
  const max = Math.min(84, anchor + 10);
  return Math.max(min, Math.min(max, note));
}

function normalizeChordSymbol(symbol: string): string {
  return symbol.replace(/\s+/g, "").replace(/\/.*$/, "").toUpperCase();
}

function chordRootPc(symbol: string): number {
  return parseChordRoot(symbol);
}

function mergeAdjacentSameChords(chords: ChordSegment[]): ChordSegment[] {
  if (!chords.length) return chords;
  const sorted = [...chords].sort((a, b) => a.t0 - b.t0);
  const out: ChordSegment[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i++) {
    const c = sorted[i]!;
    const prev = out[out.length - 1]!;
    if (normalizeChordSymbol(prev.symbol) === normalizeChordSymbol(c.symbol)) {
      prev.t1 = Math.max(prev.t1, c.t1);
      prev.confidence = Math.max(prev.confidence ?? 0, c.confidence ?? 0);
    } else {
      out.push({ ...c });
    }
  }
  return out;
}

/**
 * When import harmony is static (one chord / one root), do not invent progressions.
 */
export function stabilizeHarmonicTimeline(
  chords: ChordSegment[],
  durationSec: number,
  bpm: number,
): ChordSegment[] {
  if (!chords.length) return chords;
  const aligned = alignChordTimelineToBeatGrid(chords, bpm);
  const merged = mergeAdjacentSameChords(aligned);
  const end = Math.max(durationSec, merged[merged.length - 1]?.t1 ?? durationSec);

  const uniqueSymbols = [...new Set(merged.map((c) => normalizeChordSymbol(c.symbol)))];
  if (uniqueSymbols.length <= 1) {
    const c = merged[0]!;
    return [{ ...c, t0: 0, t1: end, symbol: c.symbol }];
  }

  const uniqueRoots = [...new Set(merged.map((c) => chordRootPc(c.symbol)))];
  if (uniqueRoots.length <= 1) {
    let best = merged[0]!;
    let bestSpan = 0;
    for (const c of merged) {
      const span = c.t1 - c.t0;
      if (span > bestSpan) {
        bestSpan = span;
        best = c;
      }
    }
    return [{ ...best, t0: 0, t1: end }];
  }

  return merged.map((c, i) => (i === merged.length - 1 ? { ...c, t1: Math.max(c.t1, end) } : c));
}

export function melodicAnchorMidi(notes: { midi: number }[]): number | undefined {
  if (!notes.length) return undefined;
  const sorted = [...notes].map((n) => n.midi).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

/** MIDI pitch wheel (-8192…8191) → cents (±200 ≈ ±2 semitones). */
export function midiPitchWheelToCents(wheel: number): number {
  return (wheel / 8192) * 200;
}

/** Longer sustains so preview meend (portamento + pitch wheel) is audible on hocket lines. */
export function prepareMeendPreviewEvents<T extends { startBeat: number; duration: number }>(
  events: T[],
  minDurationBeats = 1.15,
): T[] {
  return events.map((e) => ({
    ...e,
    duration: Math.max(e.duration || 0.25, minDurationBeats),
  }));
}

/** V-1 INDIAN: S-curve meend mapped to MIDI pitch wheel (audible in preview + export). */
export function meendPitchbendForEvents(
  events: { startBeat: number; duration: number }[],
): { beat: number; value: number }[] {
  const out: { beat: number; value: number }[] = [];
  const peakBend = 8191;
  for (const e of events) {
    const d = Math.max(0.08, e.duration || 0.25);
    const t0 = e.startBeat;
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const beat = t0 + d * (0.2 + t * 0.72);
      const sigmoid = 1 / (1 + Math.exp(-5 * (t - 0.5))) - 0.5;
      const value = Math.round(peakBend * sigmoid * 2);
      out.push({ beat, value });
    }
    out.push({ beat: t0 + d * 0.97, value: 0 });
  }
  out.sort((a, b) => a.beat - b.beat);
  const dedup: typeof out = [];
  for (const p of out) {
    const last = dedup[dedup.length - 1];
    if (!last || Math.abs(last.beat - p.beat) > 1e-4) dedup.push(p);
  }
  return dedup;
}

export function quantizeBeat(beat: number, grid = 0.25): number {
  return Math.max(0, Math.round(beat / grid) * grid);
}

/** Snap chord region boundaries to beat grid (keeps Melodyne harmony aligned for compose). */
export function alignChordTimelineToBeatGrid(
  chords: ChordSegment[],
  bpm: number,
  gridBeats = 0.25,
): ChordSegment[] {
  if (!chords.length || bpm <= 0) return chords;
  const beatSec = 60 / bpm;
  const snapSec = (t: number) =>
    Math.max(0, Math.round(t / (beatSec * gridBeats)) * beatSec * gridBeats);

  const sorted = [...chords].sort((a, b) => a.t0 - b.t0);
  const out: ChordSegment[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i]!;
    const t0 = snapSec(c.t0);
    const t1 = snapSec(i < sorted.length - 1 ? sorted[i + 1]!.t0 : c.t1);
    if (t1 <= t0) continue;
    out.push({ ...c, t0, t1: Math.max(t1, t0 + beatSec * gridBeats) });
  }
  return out.length ? out : chords;
}

export function constrainMidiEvent(
  evt: NormalizedMidiEvent,
  scale: ScaleInfo,
  role: string,
  chords: ChordSegment[],
  bpm: number,
  anchorMidi?: number,
): NormalizedMidiEvent {
  const grid = bpm >= 140 ? 0.125 : 0.25;
  const startBeat = quantizeBeat(evt.startBeat, grid);
  const duration = Math.max(grid * 0.5, quantizeBeat(evt.duration, grid));

  const roleNorm = role.toLowerCase();
  const chordCtx = chordPcsAtBeat(chords, startBeat, bpm);
  let note = evt.note;

  if (chordCtx && (roleNorm === "bass" || roleNorm === "harmony" || roleNorm === "pad")) {
    const allowed = new Set(chordCtx.pcs);
    note = snapNoteToPitchClasses(note, allowed);
    if (roleNorm === "bass") {
      const oct = Math.floor(note / 12);
      note = Math.max(36, Math.min(55, oct * 12 + (note % 12)));
    }
  } else if (chordCtx && (roleNorm === "melody" || roleNorm === "lead" || roleNorm === "solo")) {
    const chordTones = new Set(chordCtx.pcs);
    const pc = note % 12;
    if (!chordTones.has(pc) && !scale.scalePcs.has(pc)) {
      note = snapNoteToPitchClasses(note, chordTones);
    } else if (!scale.scalePcs.has(pc)) {
      note = snapNoteToScale(note, scale);
    }
  } else {
    note = snapNoteToScale(note, scale);
  }

  note = clampNoteToRegister(note, roleNorm, { anchorMidi });

  return {
    ...evt,
    note,
    startBeat,
    duration,
  };
}

export type ConstrainableStem = {
  role: string;
  midiEvents: NormalizedMidiEvent[];
  expression?: { meend?: boolean; pitchbend?: { beat: number; value: number }[] };
};

export function refreshMeendExpression<T extends ConstrainableStem>(stem: T): T {
  const expr = stem.expression;
  if (!expr?.meend && !(expr?.pitchbend?.length ?? 0)) return stem;
  const meendEvents = prepareMeendPreviewEvents(stem.midiEvents);
  return {
    ...stem,
    midiEvents: meendEvents,
    expression: {
      ...expr,
      meend: true,
      pitchbend: meendPitchbendForEvents(meendEvents),
    },
  };
}

export function constrainGeneratedStems<T extends ConstrainableStem>(
  stems: T[],
  key: string,
  chords: ChordSegment[] = [],
  bpm = 120,
  opts?: { anchorMidi?: number; scaleName?: string; scaleInfo?: ScaleInfo },
): T[] {
  const scale =
    opts?.scaleInfo ??
    resolveCompositionScale(key, opts?.scaleName ?? "major", null, chords).scaleInfo;
  return stems.map((stem) => {
    const constrained = {
      ...stem,
      midiEvents: stem.midiEvents.map((evt) =>
        constrainMidiEvent(evt, scale, stem.role, chords, bpm, opts?.anchorMidi),
      ),
    };
    return refreshMeendExpression(constrained);
  });
}

export type HarmonicContextKeyInput = {
  key?: string;
  keySource?: "midi" | "audio" | "hint";
  sources?: { melodyneMidi?: boolean };
};

/** Single authoritative key for all generation paths. */
export function resolveLockedGenerationKey(options: {
  manualKey?: string | null;
  analysisKey: string;
  audioAnchorKey?: string | null;
  harmonicContext?: HarmonicContextKeyInput | null;
}): string {
  const { manualKey, analysisKey, audioAnchorKey, harmonicContext } = options;

  if (manualKey?.trim()) return normalizeKeyLabel(manualKey);

  const anchor = audioAnchorKey?.trim() ? normalizeKeyLabel(audioAnchorKey) : null;
  const analysisNorm = normalizeKeyLabel(analysisKey);

  if (!harmonicContext?.key) {
    return anchor ?? analysisNorm;
  }

  const hcKey = normalizeKeyLabel(harmonicContext.key);

  if (harmonicContext.keySource === "audio" || harmonicContext.keySource === "hint") {
    return hcKey;
  }

  if (anchor && harmonicContext.sources?.melodyneMidi) {
    const anchorScale = parseScaleFromKey(anchor);
    const hcScale = parseScaleFromKey(hcKey);
    const sameTonic =
      anchorScale.rootPc === hcScale.rootPc && anchorScale.isMinor === hcScale.isMinor;
    if (!sameTonic) return anchor;
  }

  return hcKey;
}
