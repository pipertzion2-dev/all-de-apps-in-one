import type { TranscribedNote } from "../audio-transcription";
import type { NormalizedMidiEvent } from "../midi-normalize";
import type { ImportedMidiTrack } from "./types";

export function notesToMidiEvents(notes: TranscribedNote[], bpm: number): NormalizedMidiEvent[] {
  const bps = bpm / 60;
  return notes
    .map((n) => ({
      note: n.midi,
      velocity: Math.max(1, Math.min(127, n.velocity || 80)),
      startBeat: n.startSec * bps,
      duration: Math.max(0.01, (n.endSec - n.startSec) * bps),
    }))
    .sort((a, b) => a.startBeat - b.startBeat);
}

export function midiEventsToNotes(events: NormalizedMidiEvent[], bpm: number): TranscribedNote[] {
  const spb = 60 / bpm;
  return events.map((e) => ({
    midi: e.note,
    startSec: e.startBeat * spb,
    endSec: (e.startBeat + e.duration) * spb,
    velocity: e.velocity,
    cents: 0,
  }));
}

export function inferTrackRole(events: NormalizedMidiEvent[]): ImportedMidiTrack["role"] {
  if (!events.length) return "mixed";
  const mean = events.reduce((s, e) => s + e.note, 0) / events.length;
  if (mean < 48) return "bass";
  if (mean > 67) return "melody";
  if (events.length > 24) return "harmony";
  return "mixed";
}

export function splitEventsByRole(events: NormalizedMidiEvent[]): {
  bass: NormalizedMidiEvent[];
  melody: NormalizedMidiEvent[];
  harmony: NormalizedMidiEvent[];
} {
  const bass: NormalizedMidiEvent[] = [];
  const melody: NormalizedMidiEvent[] = [];
  const harmony: NormalizedMidiEvent[] = [];
  for (const e of events) {
    if (e.note < 48) bass.push(e);
    else if (e.note >= 67) melody.push(e);
    else harmony.push(e);
  }
  return { bass, melody, harmony };
}
