import type { NormalizedMidiEvent } from "../midi-normalize";
import type { CompositionMemory, GeneratedPart, TransformOptions } from "./types";
import { pickMotifFamily } from "./motif-genealogy";
import { transformComposition } from "./transform-engine";

function cloneEvents(events: NormalizedMidiEvent[], offsetBeats = 0): NormalizedMidiEvent[] {
  return events.map((e) => ({
    ...e,
    startBeat: e.startBeat + offsetBeats,
    note: e.note,
  }));
}

function evolveMotifContour(events: NormalizedMidiEvent[], motifIntervals: number[]): NormalizedMidiEvent[] {
  if (!events.length || !motifIntervals.length) return events;
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  const out: NormalizedMidiEvent[] = [];
  let cursor = sorted[0]!.note;
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i]!;
    if (i > 0) cursor += motifIntervals[(i - 1) % motifIntervals.length]!;
    out.push({ ...e, note: Math.max(36, Math.min(88, cursor)) });
  }
  return out;
}

/** Generate the next connected section using motif genealogy + prior memory. */
export function generateContinuation(
  previousPart: GeneratedPart,
  memory: CompositionMemory,
  options: TransformOptions,
  baseFilename: string,
): ReturnType<typeof transformComposition> {
  const offset = previousPart.events.reduce(
    (m, e) => Math.max(m, e.startBeat + e.duration),
    0,
  );
  const family = pickMotifFamily(memory.motifs);
  const motifIntervals = family[0]?.intervalPattern ?? [2, -1, 3];

  const seed = evolveMotifContour(cloneEvents(previousPart.melodyEvents, 0), motifIntervals);
  const continuationPrompt = options.prompt.trim()
    ? `${options.prompt} — continuation`
    : "continuation with dramatic evolution";

  const contOptions: TransformOptions = {
    ...options,
    prompt: continuationPrompt,
    preserveRhythm: true,
    preservePhraseLength: true,
    preservePhraseExactly: true,
  };

  const transformed = transformComposition(seed, memory, contOptions, baseFilename);
  const shiftedEvents = cloneEvents(transformed.part.events, offset + 1);
  transformed.part.events = shiftedEvents;
  transformed.part.melodyEvents = cloneEvents(transformed.part.melodyEvents, offset + 1);
  transformed.part.bassEvents = cloneEvents(transformed.part.bassEvents, offset + 1);
  transformed.part.harmonyEvents = cloneEvents(transformed.part.harmonyEvents, offset + 1);
  transformed.part.label = `${transformed.part.label}_cont`;
  transformed.part.filename = transformed.part.filename.replace(".mid", "_cont.mid");

  return transformed;
}
