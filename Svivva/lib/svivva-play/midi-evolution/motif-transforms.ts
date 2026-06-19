import type { NormalizedMidiEvent } from "../midi-normalize";
import type { MotifRecord } from "./types";
import type { MotifTransformMode } from "./long-form-sections";
import { repitchWithFn } from "./rhythmic-dna";

function sortedMono(events: NormalizedMidiEvent[]): NormalizedMidiEvent[] {
  return [...events].sort((a, b) => a.startBeat - b.startBeat);
}

export function invertMotifContour(
  events: NormalizedMidiEvent[],
  axis = 60,
): NormalizedMidiEvent[] {
  return events.map((e) => ({
    ...e,
    note: Math.max(36, Math.min(88, axis - (e.note - axis))),
  }));
}

export function mirrorIntervalMotif(events: NormalizedMidiEvent[]): NormalizedMidiEvent[] {
  const mono = sortedMono(events);
  if (mono.length < 2) return events;
  const intervals = mono.slice(1).map((e, i) => e.note - mono[i]!.note);
  const mirrored = intervals.map((iv) => -iv);
  const out: NormalizedMidiEvent[] = [{ ...mono[0]! }];
  let cursor = mono[0]!.note;
  for (let i = 0; i < mirrored.length; i++) {
    cursor += mirrored[i]!;
    out.push({ ...mono[i + 1]!, note: Math.max(36, Math.min(88, cursor)) });
  }
  return out;
}

export function fragmentMotif(events: NormalizedMidiEvent[], ratio = 0.55): NormalizedMidiEvent[] {
  const mono = sortedMono(events);
  const keep = Math.max(2, Math.floor(mono.length * ratio));
  const step = Math.max(1, Math.floor(mono.length / keep));
  return mono.filter((_, i) => i % step === 0);
}

export function expandMotif(events: NormalizedMidiEvent[]): NormalizedMidiEvent[] {
  const mono = sortedMono(events);
  const out: NormalizedMidiEvent[] = [];
  for (let i = 0; i < mono.length; i++) {
    const e = mono[i]!;
    out.push(e);
    if (i < mono.length - 1) {
      const next = mono[i + 1]!;
      const gap = next.startBeat - (e.startBeat + e.duration);
      if (gap > 0.05) {
        out.push({
          ...e,
          startBeat: e.startBeat + e.duration + gap * 0.35,
          duration: Math.min(e.duration, gap * 0.5),
          note: e.note + (next.note - e.note) / 2,
          velocity: Math.max(40, e.velocity - 12),
        });
      }
    }
  }
  return out;
}

export function compressMotif(events: NormalizedMidiEvent[]): NormalizedMidiEvent[] {
  const mono = sortedMono(events);
  if (mono.length <= 3) return mono;
  return mono.filter((_, i) => i === 0 || i === mono.length - 1 || i % 2 === 0);
}

export function applyMotifTransform(
  events: NormalizedMidiEvent[],
  mode: MotifTransformMode,
  pitchOnly = true,
): NormalizedMidiEvent[] {
  if (pitchOnly) {
    switch (mode) {
      case "invert":
        return invertMotifContour(events);
      case "mirror":
        return mirrorIntervalMotif(events);
      case "fragment":
        return repitchWithFn(events, (e, i) =>
          i % 2 === 0 ? e.note : e.note + (i % 3 === 0 ? 2 : -2),
        );
      case "expand":
        return repitchWithFn(events, (e, i) => e.note + (i % 2 === 0 ? 2 : -1));
      case "compress":
        return repitchWithFn(events, (e, i) => Math.round(e.note * 0.92 + 60 * 0.08));
      case "layer_all":
        return repitchWithFn(events, (e, i) =>
          i % 3 === 0 ? e.note + 12 : i % 3 === 1 ? 120 - e.note + 60 : e.note,
        );
      default:
        return events;
    }
  }

  switch (mode) {
    case "invert":
      return invertMotifContour(events);
    case "mirror":
      return mirrorIntervalMotif(events);
    case "fragment":
      return fragmentMotif(events);
    case "expand":
      return expandMotif(events);
    case "compress":
      return compressMotif(events);
    case "layer_all":
      return [
        ...events,
        ...invertMotifContour(events).map((e) => ({
          ...e,
          velocity: Math.max(35, e.velocity - 18),
          startBeat: e.startBeat + 0.02,
        })),
        ...fragmentMotif(events, 0.4).map((e) => ({
          ...e,
          note: e.note + 12,
          velocity: Math.max(30, e.velocity - 22),
        })),
      ].sort((a, b) => a.startBeat - b.startBeat);
    default:
      return events;
  }
}

export function interweaveMotifTraces(
  events: NormalizedMidiEvent[],
  motifs: MotifRecord[],
  preserveRatio = 0.85,
): NormalizedMidiEvent[] {
  if (!motifs.length) return events;
  const mono = sortedMono(events);
  const primary = motifs.find((m) => m.kind === "primary") ?? motifs[0]!;
  const secondary = motifs.find((m) => m.kind === "secondary");
  const hidden = motifs.find((m) => m.kind === "hidden");

  const out = mono.map((e, i) => {
    const motif = i % 5 === 0 && hidden ? hidden : i % 3 === 0 && secondary ? secondary : primary;
    const iv = motif.intervalPattern[i % motif.intervalPattern.length] ?? 0;
    const blend = (i % 7) / 10 < preserveRatio ? 1 : 0.35;
    return { ...e, note: Math.max(36, Math.min(88, Math.round(e.note + iv * blend))) };
  });

  return out;
}

export function evolveFromMotifFamily(
  events: NormalizedMidiEvent[],
  family: MotifRecord[],
): NormalizedMidiEvent[] {
  if (!family.length) return events;
  const mono = sortedMono(events);
  let cursor = mono[0]?.note ?? 60;
  return mono.map((e, i) => {
    const motif = family[i % family.length]!;
    if (i > 0) {
      cursor += motif.intervalPattern[(i - 1) % motif.intervalPattern.length] ?? 0;
    }
    return {
      ...e,
      startBeat: e.startBeat,
      duration: e.duration,
      note: Math.max(36, Math.min(88, Math.round(cursor * 0.65 + e.note * 0.35))),
    };
  });
}
