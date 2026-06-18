import type { NormalizedMidiEvent } from "../midi-normalize";
import type { StylePreset } from "./style-presets";

const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

function pc(note: number): number {
  return ((note % 12) + 12) % 12;
}

function midiFromPc(pitchClass: number, octave: number): number {
  return (octave + 1) * 12 + pitchClass;
}

function parseSymbolRoot(symbol: string): number {
  const m = symbol.match(/^([A-G][#b]?)/);
  if (!m) return 0;
  const idx = NOTE_NAMES.indexOf(m[1] as (typeof NOTE_NAMES)[number]);
  return idx >= 0 ? idx : 0;
}

/** Extended chord tone sets for sophisticated voicings. */
function chordTonesForSymbol(symbol: string): number[] {
  const root = parseSymbolRoot(symbol);
  const s = symbol.toLowerCase();
  const tones = new Set<number>([root, (root + 4) % 12, (root + 7) % 12]);
  if (/m(?!aj)/.test(s) || symbol.includes("m") && !/maj|m7|M7/.test(symbol)) tones.add((root + 3) % 12);
  if (/maj7|maj9|#11|13/.test(s)) tones.add((root + 11) % 12);
  if (/9|11|13|add/.test(s)) tones.add((root + 2) % 12);
  if (/11|13|#11/.test(s)) tones.add((root + 5) % 12);
  if (/13|6/.test(s)) tones.add((root + 9) % 12);
  if (/sus/.test(s)) {
    tones.delete((root + 4) % 12);
    tones.add((root + 5) % 12);
  }
  if (/alt|7/.test(s)) tones.add((root + 10) % 12);
  return [...tones];
}

function voicingSpread(tonePcs: number[], strategy: StylePreset["voicingStrategy"], octave = 4): number[] {
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
    return [0, 4, 7, 11, 2, 5].map((i, idx) => midiFromPc((sorted[0]! + i) % 12, octave + Math.floor(idx / 3)));
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
  return events.map((e) => {
    const bar = Math.floor(e.startBeat / barLength);
    const symbol = chordSymbols[bar % chordSymbols.length] ?? preset.chordPalette[bar % preset.chordPalette.length]!;
    const tones = chordTonesForSymbol(symbol);
    const currentPc = pc(e.note);
    if (tones.includes(currentPc)) return { ...e };

    let best = tones[0]!;
    let bestDist = 99;
    for (const t of tones) {
      const dist = Math.min(Math.abs(t - currentPc), 12 - Math.abs(t - currentPc));
      if (dist < bestDist) {
        bestDist = dist;
        best = t;
      }
    }
    const octave = Math.floor(e.note / 12) - 1;
    return { ...e, note: midiFromPc(best, octave) };
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
