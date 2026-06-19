import type { NormalizedMidiEvent } from "./midi-normalize";

export function minStartBeat(events: NormalizedMidiEvent[]): number {
  if (!events.length) return 0;
  return events.reduce((m, e) => Math.min(m, e.startBeat), Number.POSITIVE_INFINITY);
}

export function maxContentEndBeat(events: NormalizedMidiEvent[]): number {
  if (!events.length) return 0;
  return events.reduce((m, e) => Math.max(m, e.startBeat + e.duration), 0);
}

export function shiftEventsByBeat(
  events: NormalizedMidiEvent[],
  offsetBeat: number,
): NormalizedMidiEvent[] {
  if (offsetBeat <= 0) return events;
  return events.map((e) => ({
    ...e,
    startBeat: Math.max(0, e.startBeat - offsetBeat),
  }));
}

export function shiftPitchBendsByBeat(
  bends: { beat: number; value: number }[],
  offsetBeat: number,
): { beat: number; value: number }[] {
  if (offsetBeat <= 0) return bends;
  return bends.map((b) => ({ ...b, beat: b.beat - offsetBeat })).filter((b) => b.beat >= 0);
}

/** Earliest note across all uploaded stems — trim this on export so clips start at bar 1. */
export function sessionTimelineStartBeat(
  tracks: {
    events: NormalizedMidiEvent[];
    layers?: { events: NormalizedMidiEvent[] }[];
  }[],
): number {
  let min = Number.POSITIVE_INFINITY;
  for (const track of tracks) {
    min = Math.min(min, minStartBeat(track.events));
    for (const layer of track.layers ?? []) {
      min = Math.min(min, minStartBeat(layer.events));
    }
  }
  return Number.isFinite(min) ? min : 0;
}
