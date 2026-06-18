import type { NormalizedMidiEvent } from "../midi-normalize";
import type { CompositionMemory, GeneratedPart } from "./types";
import {
  LONG_FORM_SECTIONS,
  type LongFormSectionId,
  nextSuggestedSection,
} from "./long-form-sections";
import { transformFromSectionSpec } from "./transform-engine";

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
): ReturnType<typeof transformFromSectionSpec> {
  const spec = LONG_FORM_SECTIONS[sectionId];
  const result = transformFromSectionSpec(
    sourceEvents,
    memory,
    spec,
    baseFilename,
    expressionOverrides,
  );

  if (appendAfterPart?.events?.length) {
    const offset =
      appendAfterPart.events.reduce((m, e) => Math.max(m, e.startBeat + e.duration), 0) + 1;
    result.part.events = cloneEvents(result.part.events, offset);
    result.part.melodyEvents = cloneEvents(result.part.melodyEvents, offset);
    result.part.bassEvents = cloneEvents(result.part.bassEvents, offset);
    result.part.harmonyEvents = cloneEvents(result.part.harmonyEvents, offset);
  }

  result.part.label = `Section ${sectionId} — ${spec.title}`;
  result.part.filename = baseFilename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .concat(`_Section_${sectionId}_${spec.title.replace(/\s+/g, "")}.mid`);

  return result;
}

export function suggestNextSection(memory: CompositionMemory): LongFormSectionId | null {
  return nextSuggestedSection(memory.completedSections ?? []);
}
