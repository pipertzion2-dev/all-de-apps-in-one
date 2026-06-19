import type { NormalizedMidiEvent } from "../midi-normalize";
import type { CompositionMemory, GeneratedPart, ImportedMidiTrack } from "./types";
import {
  LONG_FORM_SECTIONS,
  type LongFormSectionId,
  nextSuggestedSection,
  sectionSpecToTransformOptions,
} from "./long-form-sections";
import { transformFromSectionSpec } from "./transform-engine";
import { attachFileOutputsToPart, buildPerFileOutputs } from "./per-file-export";
import { evolutionExportFilename } from "./per-file-transform";

function cloneEvents(events: NormalizedMidiEvent[], offsetBeats = 0): NormalizedMidiEvent[] {
  return events.map((e) => ({ ...e, startBeat: e.startBeat + offsetBeats }));
}

/**
 * Generate the next long-form narrative section (B–J).
 * Section A = uploaded source material; output is appended after prior material.
 */
export function generateLongFormSection(
  sourceEvents: NormalizedMidiEvent[],
  memory: CompositionMemory,
  sectionId: LongFormSectionId,
  baseFilename: string,
  appendAfterPart?: GeneratedPart | null,
  expressionOverrides?: { meendLevel?: import("./types").MeendLevel; stevieSlides?: boolean },
  sourceTracks?: ImportedMidiTrack[],
): ReturnType<typeof transformFromSectionSpec> {
  const spec = LONG_FORM_SECTIONS[sectionId];
  const result = transformFromSectionSpec(
    sourceEvents,
    memory,
    spec,
    baseFilename,
    expressionOverrides,
  );

  if (sourceTracks?.length) {
    const options = sectionSpecToTransformOptions(spec);
    if (expressionOverrides?.meendLevel !== undefined)
      options.meendLevel = expressionOverrides.meendLevel;
    if (expressionOverrides?.stevieSlides !== undefined)
      options.stevieSlides = expressionOverrides.stevieSlides;
    const fileOutputs = buildPerFileOutputs(sourceTracks, memory, options, sectionId);
    result.part = attachFileOutputsToPart(result.part, fileOutputs);
  }

  if (appendAfterPart?.events?.length) {
    const offset =
      appendAfterPart.events.reduce((m, e) => Math.max(m, e.startBeat + e.duration), 0) + 1;
    result.part.events = cloneEvents(result.part.events, offset);
    if (result.part.fileOutputs?.length) {
      result.part.fileOutputs = result.part.fileOutputs.map((f) => ({
        ...f,
        transformedEvents: cloneEvents(f.transformedEvents, offset),
      }));
    }
  }

  result.part.label = `Section ${sectionId} — ${spec.title}`;
  result.part.filename =
    sourceTracks?.length === 1
      ? evolutionExportFilename(sourceTracks[0]!.filename, sectionId)
      : evolutionExportFilename(baseFilename, sectionId);

  return result;
}

export function suggestNextSection(memory: CompositionMemory): LongFormSectionId | null {
  return nextSuggestedSection(memory.completedSections ?? []);
}
