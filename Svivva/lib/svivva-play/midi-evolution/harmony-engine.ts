import type { NormalizedMidiEvent } from "../midi-normalize";
import type { StylePreset } from "./style-presets";

const ROOT_TO_PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

function pc(note: number): number {
  return ((note % 12) + 12) % 12;
}

function midiFromPc(pitchClass: number, octave: number): number {
  return (octave + 1) * 12 + pitchClass;
}

function parseSymbolRoot(symbol: string): number {
  const m = symbol.split("/")[0]?.match(/^([A-G][#b]?)/);
  if (!m) return 0;
  return ROOT_TO_PC[m[1]!] ?? 0;
}

/** Extended chord tone sets for sophisticated voicings. */
function chordTonesForSymbol(symbol: string): number[] {
  const root = parseSymbolRoot(symbol);
  const s = symbol.toLowerCase();
  const tones = new Set<number>([root, pc(root + 7)]);
  const minor = /m(?!aj)/.test(s);
  const sus = /sus/.test(s);
  const major = /maj/.test(s) && !/mmaj/.test(s);

  if (sus) tones.add(pc(root + 5));
  else tones.add(pc(root + (minor ? 3 : 4)));
  if (/mmaj/.test(s) || major) tones.add(pc(root + 11));
  else if (/7|9|11|13|alt/.test(s)) tones.add(pc(root + 10));
  if (/9|11|13|add|6\/9/.test(s)) tones.add(pc(root + 2));
  if (/11|13/.test(s)) tones.add(pc(root + 5));
  if (/#11|lyd/.test(s)) tones.add(pc(root + 6));
  if (/13|6/.test(s)) tones.add(pc(root + 9));
  if (/b9/.test(s)) tones.add(pc(root + 1));
  if (/#9/.test(s)) tones.add(pc(root + 3));
  if (/b13/.test(s)) tones.add(pc(root + 8));
  if (sus) tones.delete(pc(root + 4));
  return [...tones];
}

function chordScaleForSymbol(symbol: string): {
  scale: number[];
  color: Set<number>;
  avoid: Set<number>;
} {
  const root = parseSymbolRoot(symbol);
  const s = symbol.toLowerCase();
  const minor = /m(?!aj)/.test(s);
  const major = /maj/.test(s);
  const dominant = /13|7|sus|alt/.test(s) && !major;
  const sus = /sus/.test(s);
  const alt = /alt|b9|#9|b13/.test(s);

  const scale = new Set<number>();
  const color = new Set<number>();
  const avoid = new Set<number>();
  const add = (interval: number, isColor = false) => {
    const pitchClass = pc(root + interval);
    scale.add(pitchClass);
    if (isColor) color.add(pitchClass);
  };

  add(0);
  if (sus) add(5);
  else add(minor ? 3 : 4);
  add(7);

  if (minor) {
    add(/mmaj/.test(s) ? 11 : 10);
    add(2, true); // 9
    add(5, true); // 11
    add(9, true); // 13
  } else if (major) {
    add(11);
    add(2, true); // 9
    add(/#11/.test(s) ? 6 : 5, true);
    add(9, true); // 13
  } else if (dominant) {
    add(10);
    add(2, true); // 9
    add(sus ? 5 : 4);
    add(/#11/.test(s) ? 6 : 5, true);
    add(9, true); // 13
    if (alt) {
      add(1, true); // b9
      add(3, true); // #9
      add(8, true); // b13
    }
  }
  if (/add|9|11|13|6\/9/.test(s)) add(2, true);
  if (/11/.test(s)) add(5, true);
  if (/#11|lyd/.test(s)) add(6, true);
  if (/13|6/.test(s)) add(9, true);
  if (/b9/.test(s)) add(1, true);
  if (/#9/.test(s)) add(3, true);
  if (/b13/.test(s)) add(8, true);

  // Glasper-style writing keeps the color tones, but avoids leaning too hard on
  // roots in upper-register melody/voicing material.
  avoid.add(root);
  return { scale: [...scale], color, avoid };
}

function candidatesNear(note: number, pitchClasses: number[]): number[] {
  const out: number[] = [];
  const baseOctave = Math.floor(note / 12);
  for (const pitchClass of pitchClasses) {
    for (let octave = baseOctave - 1; octave <= baseOctave + 1; octave++) {
      const candidate = octave * 12 + pitchClass;
      if (candidate >= 0 && candidate <= 127) out.push(candidate);
    }
  }
  return out;
}

function pickGlasperNote(
  event: NormalizedMidiEvent,
  previousOut: number | null,
  previousSource: NormalizedMidiEvent | null,
  symbol: string,
  preset: StylePreset,
): number {
  const { scale, color, avoid } = chordScaleForSymbol(symbol);
  const candidates = candidatesNear(event.note, scale);
  if (!candidates.length) return event.note;

  const sourceInterval = previousSource ? event.note - previousSource.note : 0;
  let best = event.note;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const pitchClass = pc(candidate);
    const distanceScore = Math.abs(candidate - event.note);
    const contourScore =
      previousOut == null ? 0 : Math.abs(candidate - previousOut - sourceInterval) * 0.38;
    const bigLeapPenalty =
      previousOut != null && Math.abs(candidate - previousOut) > 9
        ? (Math.abs(candidate - previousOut) - 9) * 0.55
        : 0;
    const colorBonus = color.has(pitchClass) ? -0.9 : 0;
    const rootPenalty =
      preset.id === "glasper" && avoid.has(pitchClass) && event.note > 48 ? 1.6 : 0;
    const unchangedPenalty = preset.id === "glasper" && candidate === event.note ? 2.8 : 0;

    const score =
      distanceScore + contourScore + bigLeapPenalty + colorBonus + rootPenalty + unchangedPenalty;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (preset.id === "glasper" && best === event.note && candidates.some((n) => n !== event.note)) {
    const colorCandidates = candidates.filter((n) => n !== event.note && color.has(pc(n)));
    const fallbackCandidates = colorCandidates.length
      ? colorCandidates
      : candidates.filter((n) => n !== event.note);
    best = fallbackCandidates.reduce((closest, candidate) =>
      Math.abs(candidate - event.note) < Math.abs(closest - event.note) ? candidate : closest,
    );
  }

  return Math.max(0, Math.min(127, best));
}

function voicingSpread(
  tonePcs: number[],
  strategy: StylePreset["voicingStrategy"],
  octave = 4,
): number[] {
  const sorted = [...tonePcs].sort((a, b) => a - b);
  if (strategy === "rootless" && sorted.length > 2) sorted.shift();
  if (strategy === "drop2" && sorted.length >= 4) {
    const top = sorted.pop()!;
    sorted.splice(1, 0, top);
  }
  if (strategy === "drop2and4" && sorted.length >= 5) {
    const fourth = sorted.splice(3, 1)[0]!;
    sorted.unshift(fourth);
  }
  if (strategy === "quartal") {
    return [0, 5, 10, 3].map((i, idx) => midiFromPc((sorted[0]! + i) % 12, octave + idx));
  }
  if (strategy === "quintal") {
    return [0, 7, 2, 9].map((i, idx) => midiFromPc((sorted[0]! + i) % 12, octave + idx));
  }
  if (strategy === "polychord") {
    return [0, 4, 7, 11, 2, 5].map((i, idx) =>
      midiFromPc((sorted[0]! + i) % 12, octave + Math.floor(idx / 3)),
    );
  }
  return sorted.map((t, i) => midiFromPc(t, octave + Math.floor(i / 3)));
}

export function buildHarmonyVoicing(
  symbol: string,
  startBeat: number,
  duration: number,
  preset: StylePreset,
): NormalizedMidiEvent[] {
  const tones = chordTonesForSymbol(symbol);
  const notes = voicingSpread(tones, preset.voicingStrategy, 4);
  return notes.map((note, i) => ({
    note,
    velocity: 58 + i * 4,
    startBeat,
    duration,
    channel: 1,
  }));
}

export function reharmonizeMelodyLine(
  events: NormalizedMidiEvent[],
  preset: StylePreset,
  chordSymbols: string[],
  barLength = 4,
): NormalizedMidiEvent[] {
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat || a.note - b.note);
  let previousOut: number | null = null;
  let previousSource: NormalizedMidiEvent | null = null;

  return sorted.map((e) => {
    const bar = Math.floor(e.startBeat / barLength);
    const symbol =
      chordSymbols[bar % chordSymbols.length] ??
      preset.chordPalette[bar % preset.chordPalette.length]!;
    const note = pickGlasperNote(e, previousOut, previousSource, symbol, preset);
    const out = { ...e, note };
    previousOut = note;
    previousSource = e;
    return out;
  });
}

export function transformBassLine(
  events: NormalizedMidiEvent[],
  preset: StylePreset,
  chordSymbols: string[],
  barLength = 4,
  bassAvoidsRoots = false,
): NormalizedMidiEvent[] {
  if (!events.length) return [];
  const out: NormalizedMidiEvent[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    const bar = Math.floor(e.startBeat / barLength);
    const symbol = chordSymbols[bar % chordSymbols.length] ?? "Cm11";
    const root = parseSymbolRoot(symbol);
    let note = e.note;

    if (bassAvoidsRoots) {
      note = midiFromPc((root + 7 + (i % 2) * 2) % 12, 2);
    } else if (preset.bassStrategy === "chromatic_slip") {
      note = midiFromPc((root + (i % 2 === 0 ? 0 : 1)) % 12, 2);
    } else if (preset.bassStrategy === "minor_third_displace") {
      note = midiFromPc((root + (i % 3 === 0 ? 0 : 3)) % 12, 2);
    } else if (preset.bassStrategy === "pedal") {
      note = midiFromPc(root, 2);
    } else if (preset.bassStrategy === "melodic") {
      const prev = out[i - 1]?.note ?? note;
      const target = midiFromPc((root + 7) % 12, 2);
      note = Math.round((prev + target) / 2);
    } else {
      note = midiFromPc(root, 2);
    }

    out.push({ ...e, note: Math.max(28, Math.min(60, note)) });
  }
  return out;
}

export function pickChordTimeline(
  preset: StylePreset,
  bars: number,
  overridePalette?: string[],
): string[] {
  const palette = overridePalette?.length ? overridePalette : preset.chordPalette;
  const out: string[] = [];
  for (let b = 0; b < bars; b++) out.push(palette[b % palette.length]!);
  return out;
}

export function buildHarmonyVoicingWithStrategy(
  symbol: string,
  startBeat: number,
  duration: number,
  voicingStrategy: StylePreset["voicingStrategy"],
): NormalizedMidiEvent[] {
  const preset = { voicingStrategy } as StylePreset;
  return buildHarmonyVoicing(symbol, startBeat, duration, preset);
}
