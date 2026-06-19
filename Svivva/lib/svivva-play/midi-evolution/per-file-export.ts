import type { NormalizedMidiEvent } from "../midi-normalize";
import { maxContentEndBeat, shiftEventsByBeat, shiftPitchBendsByBeat } from "../midi-beat-align";
import type {
  CompositionMemory,
  GeneratedPart,
  ImportedMidiTrack,
  PerFileMidiOutput,
} from "./types";
import type { TransformOptions } from "./types";
import { evolutionExportFilename, repitchSourceFileEvents } from "./per-file-transform";

function alignForExport<
  T extends { events: NormalizedMidiEvent[]; pitchBends?: { beat: number; value: number }[] },
>(layer: T, timelineStartBeat: number): T {
  return {
    ...layer,
    events: shiftEventsByBeat(layer.events, timelineStartBeat),
    pitchBends: layer.pitchBends
      ? shiftPitchBendsByBeat(layer.pitchBends, timelineStartBeat)
      : undefined,
  };
}

/** Build one repitched output per uploaded MIDI file (same count, renamed with section tag). */
export function buildPerFileOutputs(
  tracks: ImportedMidiTrack[],
  memory: CompositionMemory,
  options: TransformOptions,
  sectionId?: GeneratedPart["sectionId"],
  fallbackLabel?: string,
): PerFileMidiOutput[] {
  const timelineStartBeat = memory.timelineStartBeat ?? 0;

  return tracks.map((track) => {
    const sourceLayers =
      track.layers?.length && track.layers.length > 1
        ? track.layers
        : [{ name: track.filename.replace(/\.[^.]+$/, ""), events: track.events }];

    const transformedLayers = sourceLayers.map((layer) => {
      const { events, pitchBends } = repitchSourceFileEvents(layer.events, memory, options);
      return alignForExport(
        {
          name: layer.name,
          events,
          pitchBends: pitchBends.length ? pitchBends : undefined,
        },
        timelineStartBeat,
      );
    });

    const transformedEvents = transformedLayers.flatMap((l) => l.events);
    const pitchBends = transformedLayers.flatMap((l) => l.pitchBends ?? []);

    return {
      sourceFileId: track.id,
      sourceFilename: track.filename,
      bpm: memory.globalBpm,
      originalEvents: track.events,
      transformedEvents,
      exportFilename: evolutionExportFilename(
        track.filename,
        sectionId,
        fallbackLabel,
        memory.globalBpm,
        memory.key,
      ),
      pitchBends: pitchBends.length ? pitchBends : undefined,
      ticksPerBeat: track.ticksPerBeat,
      contentEndBeat: maxContentEndBeat(transformedEvents),
      layers: transformedLayers.length > 1 ? transformedLayers : undefined,
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
