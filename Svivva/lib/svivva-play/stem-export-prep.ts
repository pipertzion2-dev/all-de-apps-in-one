import { applyMeendToStems, applyMeendToOrchestralMelodyStems } from "./generate-helpers";
import { buildMeendAccentPlaybacks, buildOrchestralMeendAccentPlaybacks } from "./meend-showcase-stem";
import { normalizeMidiEvents } from "./midi-normalize";
import type { StemExportInput } from "./play-export-pack";

export type MidiExportStemLike = {
  name: string;
  role: string;
  instrumentHint?: string;
  midiEvents: unknown[];
  expression?: Record<string, unknown>;
  pan?: number;
};

/**
 * Mirror preview playback prep for MIDI export:
 * - normalize events
 * - meend pitch bends (short note lengths — preview legato is audio-only)
 * - optionally include Meend accent layers
 */
export function prepareStemsForMidiExport(
  stems: MidiExportStemLike[],
  options?: { meend?: boolean; includeAccentLayers?: boolean; ensembleOrchestral?: boolean },
): StemExportInput[] {
  const meend = Boolean(options?.meend);
  const ensembleOrchestral = Boolean(options?.ensembleOrchestral);
  const includeAccents =
    options?.includeAccentLayers ?? (meend && !ensembleOrchestral);
  const includeOrchestralAccents = meend && ensembleOrchestral;

  let prepared = stems.map((s) => ({
    ...s,
    midiEvents: normalizeMidiEvents(s.midiEvents),
  }));

  if (meend && prepared.some((s) => s.midiEvents.length > 0)) {
    const applyMeend = ensembleOrchestral
      ? applyMeendToOrchestralMelodyStems
      : applyMeendToStems;
    prepared = applyMeend(
      prepared as Parameters<typeof applyMeendToStems>[0],
    ) as typeof prepared;
  }

  const out: StemExportInput[] = prepared.map((s) => ({
    name: s.name,
    role: s.role,
    midiEvents: s.midiEvents,
    expression: s.expression as StemExportInput["expression"],
  }));

  if (includeAccents && meend) {
    const accents = buildMeendAccentPlaybacks(
      prepared.map((s) => ({
        name: s.name,
        role: s.role,
        instrumentHint: s.instrumentHint ?? "synth",
        midiEvents: s.midiEvents,
        pan: s.pan,
      })),
    );
    for (const a of accents) {
      out.push({
        name: a.name,
        role: a.role,
        midiEvents: a.midiEvents,
        expression: a.expression as StemExportInput["expression"],
      });
    }
  }

  if (includeOrchestralAccents) {
    const accents = buildOrchestralMeendAccentPlaybacks(
      prepared.map((s) => ({
        name: s.name,
        role: s.role,
        instrumentHint: s.instrumentHint ?? "synth",
        midiEvents: s.midiEvents,
        pan: s.pan,
      })),
    );
    for (const a of accents) {
      out.push({
        name: a.name,
        role: a.role,
        midiEvents: a.midiEvents,
        expression: a.expression as StemExportInput["expression"],
      });
    }
  }

  return out;
}
