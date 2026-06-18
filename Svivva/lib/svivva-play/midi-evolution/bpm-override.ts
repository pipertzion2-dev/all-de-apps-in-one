import type { ImportedMidiTrack } from "./types";
import type { NormalizedMidiEvent } from "../midi-normalize";

/** Rescale beat positions when user overrides tempo (wall-clock seconds unchanged). */
export function rescaleEventsToBpm(
  events: NormalizedMidiEvent[],
  fromBpm: number,
  toBpm: number,
): NormalizedMidiEvent[] {
  if (!events.length || fromBpm <= 0 || toBpm <= 0 || fromBpm === toBpm) return events;
  const ratio = fromBpm / toBpm;
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

export function resolveGlobalBpm(
  trackBpms: number[],
  manualBpm?: number | null,
): { globalBpm: number; detectedBpm: number } {
  const detectedBpm =
    trackBpms.length > 0
      ? Math.round(trackBpms.reduce((s, b) => s + b, 0) / trackBpms.length)
      : 120;
  const globalBpm =
    manualBpm != null && manualBpm > 0 ? clampBpm(manualBpm) : detectedBpm;
  return { globalBpm, detectedBpm };
}
