import type { NormalizedMidiEvent } from "../midi-normalize";
import type { CompositionMemory, GeneratedPart, TransformOptions } from "./types";
import { splitEventsByRole } from "./note-bridge";
import {
  buildHarmonyVoicing,
  pickChordTimeline,
  reharmonizeMelodyLine,
  transformBassLine,
} from "./harmony-engine";
import { buildEmotionalChordTimeline } from "./harmonic-evolution";
import {
  applyMotifTransform,
  evolveFromMotifFamily,
  interweaveMotifTraces,
} from "./motif-transforms";
import { pickMotifFamily } from "./motif-genealogy";
import { repitchPreservingPhrase } from "./rhythmic-dna";
import { buildExpressionBends } from "./expression-bends";
import { generationSuffix, resolvePresetFromPrompt, STYLE_PRESETS } from "./style-presets";
import type { LongFormSectionSpec } from "./long-form-sections";
import { sectionSpecToTransformOptions } from "./long-form-sections";

function maxBeat(events: NormalizedMidiEvent[]): number {
  return events.reduce((m, e) => Math.max(m, e.startBeat + e.duration), 0);
}

function mergePresetWithOptions(
  options: TransformOptions,
): ReturnType<typeof resolvePresetFromPrompt> {
  const base = resolvePresetFromPrompt(options.prompt, options.preset);
  if (options.chordPalette?.length) base.chordPalette = options.chordPalette;
  if (options.voicingStrategy) base.voicingStrategy = options.voicingStrategy;
  if (options.bassStrategy) base.bassStrategy = options.bassStrategy;
  return base;
}

/**
 * Repitch lines while locking velocity, startBeat, duration, and phrasing.
 * Optional meend + Stevie semitone slides add pitch-bend only (no timing changes).
 */
export function transformComposition(
  sourceEvents: NormalizedMidiEvent[],
  memory: CompositionMemory,
  options: TransformOptions,
  baseFilename: string,
  sectionMeta?: Pick<LongFormSectionSpec, "id" | "title">,
): {
  part: GeneratedPart;
  memory: CompositionMemory;
  reportSeed: Omit<GeneratedPart, "events" | "bassEvents" | "harmonyEvents" | "melodyEvents">;
} {
  const preset = mergePresetWithOptions(options);
  const generationNumber = memory.generationCount + 1;
  const bars = Math.max(4, Math.ceil(maxBeat(sourceEvents) / 4));
  const pitchOnly = options.preservePhraseExactly !== false;

  const sourceHarmony = memory.harmonicCenters.map((h) => h.symbol);
  const chordTimeline =
    options.chordPalette?.length && sourceHarmony.length
      ? buildEmotionalChordTimeline(sourceHarmony, options.chordPalette, bars)
      : pickChordTimeline(preset, bars, options.chordPalette);

  const { bass, melody, harmony } = splitEventsByRole(sourceEvents);
  let melodySrc = melody.length ? melody : harmony.length ? harmony : sourceEvents;
  const bassSrc = bass.length ? bass : sourceEvents.filter((e) => e.note < 55);

  const family = pickMotifFamily(memory.motifs);
  melodySrc = evolveFromMotifFamily(melodySrc, family);

  if (options.motifTransform && options.motifTransform !== "inherit") {
    melodySrc = applyMotifTransform(melodySrc, options.motifTransform, pitchOnly);
  }
  if (options.interweaveMotifs) {
    melodySrc = interweaveMotifTraces(melodySrc, memory.motifs, 1);
  }

  const repitchedMelody = reharmonizeMelodyLine(melodySrc, preset, chordTimeline);
  const transformedMelody = pitchOnly
    ? repitchPreservingPhrase(melodySrc, repitchedMelody)
    : repitchedMelody;

  const repitchedBass = transformBassLine(
    bassSrc,
    preset,
    chordTimeline,
    4,
    options.bassAvoidsRoots,
  );
  const transformedBass = pitchOnly
    ? repitchPreservingPhrase(bassSrc, repitchedBass)
    : repitchedBass;

  const harmonyEvents: NormalizedMidiEvent[] = [];
  for (let b = 0; b < bars; b++) {
    harmonyEvents.push(...buildHarmonyVoicing(chordTimeline[b]!, b * 4, 3.85, preset));
  }

  const pitchBends = buildExpressionBends(transformedMelody, {
    meendLevel: options.meendLevel,
    stevieSlides: options.stevieSlides,
  });

  const allEvents = [...transformedBass, ...harmonyEvents, ...transformedMelody].sort(
    (a, b) => a.startBeat - b.startBeat || a.note - b.note,
  );

  const suffix = sectionMeta
    ? `Section_${sectionMeta.id}_${sectionMeta.title.replace(/\s+/g, "")}`
    : generationSuffix(options.preset, generationNumber);
  const stemBase = baseFilename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "_");
  const filename = `${stemBase}_${suffix}.mid`;

  const completedSections = [...(memory.completedSections ?? [])];
  if (sectionMeta?.id && !completedSections.includes(sectionMeta.id)) {
    completedSections.push(sectionMeta.id);
  }

  const part: GeneratedPart = {
    id: `gen_${generationNumber}`,
    label: suffix,
    generationNumber,
    preset: options.preset,
    prompt: options.prompt,
    events: allEvents,
    bassEvents: transformedBass,
    harmonyEvents,
    melodyEvents: transformedMelody,
    originalEvents: sourceEvents,
    pitchBends: pitchBends.length ? pitchBends : undefined,
    filename,
    sectionId: sectionMeta?.id,
    sectionTitle: sectionMeta?.title,
  };

  const updatedMemory: CompositionMemory = {
    ...memory,
    updatedAt: new Date().toISOString(),
    generationCount: generationNumber,
    lastPrompt: options.prompt,
    lastPreset: options.preset,
    completedSections,
    harmonicCenters: chordTimeline.map((symbol, i) => ({
      beat: i * 4,
      symbol,
      pitchClasses: [],
      confidence: 72,
    })),
    emotionalTrajectory: [
      ...memory.emotionalTrajectory,
      sectionMeta?.title ?? options.prompt.slice(0, 48) ?? preset.label,
    ].slice(-12),
  };

  return { part, memory: updatedMemory, reportSeed: part };
}

export function transformFromSectionSpec(
  sourceEvents: NormalizedMidiEvent[],
  memory: CompositionMemory,
  spec: LongFormSectionSpec,
  baseFilename: string,
  expressionOverrides?: { meendLevel?: TransformOptions["meendLevel"]; stevieSlides?: boolean },
) {
  const options = sectionSpecToTransformOptions(spec);
  if (expressionOverrides?.meendLevel !== undefined)
    options.meendLevel = expressionOverrides.meendLevel;
  if (expressionOverrides?.stevieSlides !== undefined)
    options.stevieSlides = expressionOverrides.stevieSlides;
  options.preservePhraseExactly = true;
  return transformComposition(sourceEvents, memory, options, baseFilename, {
    id: spec.id,
    title: spec.title,
  });
}

export { STYLE_PRESETS };
