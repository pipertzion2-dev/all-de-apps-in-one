import type { NormalizedMidiEvent } from "../midi-normalize";

function sortedMono(events: NormalizedMidiEvent[]): NormalizedMidiEvent[] {
  return [...events].sort((a, b) => a.startBeat - b.startBeat || a.note - b.note);
}

/**
 * Change pitch only — every note keeps its original startBeat, duration, velocity, and channel.
 */
export function repitchPreservingPhrase(
  source: NormalizedMidiEvent[],
  repitched: NormalizedMidiEvent[],
): NormalizedMidiEvent[] {
  const src = sortedMono(source);
  const rep = sortedMono(repitched);
  return src.map((e, i) => ({
    ...e,
    note: rep[i]?.note ?? e.note,
  }));
}

export function repitchWithFn(
  source: NormalizedMidiEvent[],
  pitchFn: (event: NormalizedMidiEvent, index: number) => number,
): NormalizedMidiEvent[] {
  const src = sortedMono(source);
  return src.map((e, i) => ({
    ...e,
    note: Math.max(0, Math.min(127, Math.round(pitchFn(e, i)))),
  }));
}

/** @deprecated Use repitchPreservingPhrase for strict 1:1 phrasing lock. */
export function preserveRhythmicDna(
  source: NormalizedMidiEvent[],
  repitched: NormalizedMidiEvent[],
  _preserveRatio = 1,
): NormalizedMidiEvent[] {
  return repitchPreservingPhrase(source, repitched);
}

export function extractRhythmicFingerprint(events: NormalizedMidiEvent[]): {
  phraseLengths: number[];
  accentBeats: number[];
  syncopationRatio: number;
  grooveGrid: number[];
} {
  const mono = sortedMono(events);
  const gaps: number[] = [];
  const accents: number[] = [];
  let offbeat = 0;

  for (let i = 1; i < mono.length; i++) {
    gaps.push(Number((mono[i]!.startBeat - mono[i - 1]!.startBeat).toFixed(3)));
    const beat = mono[i]!.startBeat % 1;
    if (beat > 0.1 && beat < 0.9) offbeat++;
    if (mono[i]!.velocity > 90) accents.push(mono[i]!.startBeat);
  }

  const phraseLengths: number[] = [];
  let phraseStart = mono[0]?.startBeat ?? 0;
  for (let i = 1; i < mono.length; i++) {
    const gap = mono[i]!.startBeat - (mono[i - 1]!.startBeat + mono[i - 1]!.duration);
    if (gap > 0.5) {
      phraseLengths.push(
        Number((mono[i - 1]!.startBeat + mono[i - 1]!.duration - phraseStart).toFixed(2)),
      );
      phraseStart = mono[i]!.startBeat;
    }
  }
  if (mono.length) {
    const last = mono[mono.length - 1]!;
    phraseLengths.push(Number((last.startBeat + last.duration - phraseStart).toFixed(2)));
  }

  return {
    phraseLengths,
    accentBeats: accents.slice(0, 16),
    syncopationRatio: mono.length ? offbeat / mono.length : 0,
    grooveGrid: gaps.slice(0, 12),
  };
}
