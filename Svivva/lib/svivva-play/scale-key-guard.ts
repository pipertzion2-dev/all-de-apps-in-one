/**
 * Locks generated MIDI to the session key and chord map — no out-of-key notes from compose/LLM.
 */
import type { ChordSegment } from "./chord-from-chroma";
import { normalizeKeyLabel } from "./analysis-utils";
import type { NormalizedMidiEvent } from "./midi-normalize";
import type { GeneratedStemResult } from "./generate-helpers";

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
  const norm = normalizeKeyLabel(key);
  const m = norm.match(/^([A-G][#b]?)\s+(major|minor)$/i);
  const rootName = m?.[1] ?? "C";
  const isMinor = (m?.[2] ?? "major").toLowerCase() === "minor";
  const rootPc = NOTE_NAMES.findIndex((n) => n === rootName);
  const rel = isMinor ? MINOR_SCALE : MAJOR_SCALE;
  const scalePcs = new Set(rel.map((s) => (rootPc + s + 12) % 12));
  return {
    keyLabel: norm,
    rootPc: rootPc >= 0 ? rootPc : 0,
    isMinor,
    scalePcs,
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
  const snapSec = (t: number) => Math.max(0, Math.round(t / (beatSec * gridBeats)) * beatSec * gridBeats);

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

  return {
    ...evt,
    note,
    startBeat,
    duration,
  };
}

export function constrainGeneratedStems(
  stems: GeneratedStemResult[],
  key: string,
  chords: ChordSegment[] = [],
  bpm = 120,
): GeneratedStemResult[] {
  const scale = parseScaleFromKey(key);
  return stems.map((stem) => ({
    ...stem,
    midiEvents: stem.midiEvents.map((evt) =>
      constrainMidiEvent(evt, scale, stem.role, chords, bpm),
    ),
  }));
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
