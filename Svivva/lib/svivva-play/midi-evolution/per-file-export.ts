import type { NormalizedMidiEvent } from "../midi-normalize";
import type {
  CompositionMemory,
  GeneratedPart,
  ImportedMidiTrack,
  PerFileMidiOutput,
} from "./types";
import type { TransformOptions } from "./types";
import { evolutionExportFilename, repitchSourceFileEvents } from "./per-file-transform";

/** Build one repitched output per uploaded MIDI file (same count, renamed with section tag). */
export function buildPerFileOutputs(
  tracks: ImportedMidiTrack[],
  memory: CompositionMemory,
  options: TransformOptions,
  sectionId?: GeneratedPart["sectionId"],
  fallbackLabel?: string,
): PerFileMidiOutput[] {
  return tracks.map((track) => {
    const { events, pitchBends } = repitchSourceFileEvents(track.events, memory, options);
    return {
      sourceFileId: track.id,
      sourceFilename: track.filename,
      bpm: memory.globalBpm,
      originalEvents: track.events,
      transformedEvents: events,
      exportFilename: evolutionExportFilename(track.filename, sectionId, fallbackLabel),
      pitchBends: pitchBends.length ? pitchBends : undefined,
    };
  });
}

export function attachFileOutputsToPart(
  part: GeneratedPart,
  fileOutputs: PerFileMidiOutput[],
): GeneratedPart {
  if (!fileOutputs.length) return part;
  return {
    ...part,
    fileOutputs,
    events: fileOutputs.flatMap((f) => f.transformedEvents),
    originalEvents: fileOutputs.flatMap((f) => f.originalEvents),
    pitchBends: fileOutputs.flatMap((f) => f.pitchBends ?? []),
    filename: fileOutputs.length === 1 ? fileOutputs[0]!.exportFilename : part.filename,
  };
}

export function fileOutputsFromMemoryAndTracks(
  memory: CompositionMemory,
  tracks: ImportedMidiTrack[],
  part: GeneratedPart,
  options: TransformOptions,
): PerFileMidiOutput[] {
  if (part.fileOutputs?.length) return part.fileOutputs;
  return buildPerFileOutputs(
    tracks,
    memory,
    options,
    part.sectionId,
    part.sectionId ? undefined : part.label,
  );
}

export function mergeTracksToEventsFromOutputs(
  outputs: PerFileMidiOutput[],
): NormalizedMidiEvent[] {
  return outputs
    .flatMap((o) => o.transformedEvents)
    .sort((a, b) => a.startBeat - b.startBeat || a.note - b.note);
}
