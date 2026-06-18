import type { ImportedMidiTrack } from "./types";
import type { NormalizedMidiEvent } from "../midi-normalize";

export const DEFAULT_INPUT_BPM = 120;

/** User-supplied tempo — always used for beat grid (never auto-detected from MIDI). */
export function resolveInputBpm(manualBpm?: number | null): number {
  if (manualBpm == null || manualBpm <= 0 || !Number.isFinite(manualBpm)) {
    return DEFAULT_INPUT_BPM;
  }
  return clampBpm(manualBpm);
}

/** Average tempo markers embedded in MIDI files — informational only. */
export function averageDetectedBpm(trackBpms: number[]): number {
  if (!trackBpms.length) return DEFAULT_INPUT_BPM;
  return Math.round(trackBpms.reduce((s, b) => s + b, 0) / trackBpms.length);
}

/** Rescale beat positions while preserving wall-clock seconds. */
export function rescaleEventsToBpm(
  events: NormalizedMidiEvent[],
  fromBpm: number,
  toBpm: number,
): NormalizedMidiEvent[] {
  if (!events.length || fromBpm <= 0 || toBpm <= 0 || fromBpm === toBpm) return events;
  const ratio = toBpm / fromBpm;
  return events.map((e) => ({
    ...e,
    startBeat: e.startBeat * ratio,
    duration: e.duration * ratio,
  }));
}

export function applyGlobalBpmToTracks(tracks: ImportedMidiTrack[], globalBpm: number): void {
  for (const track of tracks) {
    if (track.bpm === globalBpm) continue;
    track.events = rescaleEventsToBpm(track.events, track.bpm, globalBpm);
    track.bpm = globalBpm;
  }
}

export function clampBpm(value: number): number {
  return Math.max(20, Math.min(400, Math.round(value)));
}
