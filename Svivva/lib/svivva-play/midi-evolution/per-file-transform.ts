import type { NormalizedMidiEvent } from "../midi-normalize";
import type { CompositionMemory, TransformOptions } from "./types";
import {
  pickChordTimeline,
  reharmonizeMelodyLine,
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
import { resolvePresetFromPrompt } from "./style-presets";

function maxBeat(events: NormalizedMidiEvent[]): number {
  return events.reduce((m, e) => Math.max(m, e.startBeat + e.duration), 0);
}

function mergePreset(options: TransformOptions) {
  const base = resolvePresetFromPrompt(options.prompt, options.preset);
  if (options.chordPalette?.length) base.chordPalette = options.chordPalette;
  if (options.voicingStrategy) base.voicingStrategy = options.voicingStrategy;
  if (options.bassStrategy) base.bassStrategy = options.bassStrategy;
  return base;
}

/**
 * Repitch one source file's notes only — same note count, timing, and velocity.
 * No synthetic harmony stems or merged multi-track garbage.
 */
export function repitchSourceFileEvents(
  sourceEvents: NormalizedMidiEvent[],
  memory: CompositionMemory,
  options: TransformOptions,
): {
  events: NormalizedMidiEvent[];
  pitchBends: { beat: number; value: number }[];
} {
  if (!sourceEvents.length) return { events: [], pitchBends: [] };

  const preset = mergePreset(options);
  const bars = Math.max(4, Math.ceil(maxBeat(sourceEvents) / 4));
  const sourceHarmony = memory.harmonicCenters.map((h) => h.symbol);
  const chordTimeline =
    options.chordPalette?.length && sourceHarmony.length
      ? buildEmotionalChordTimeline(sourceHarmony, options.chordPalette, bars)
      : pickChordTimeline(preset, bars, options.chordPalette);

  let working = [...sourceEvents].sort((a, b) => a.startBeat - b.startBeat || a.note - b.note);

  const family = pickMotifFamily(memory.motifs);
  working = evolveFromMotifFamily(working, family);

  if (options.motifTransform && options.motifTransform !== "inherit") {
    working = applyMotifTransform(working, options.motifTransform, true);
  }
  if (options.interweaveMotifs) {
    working = interweaveMotifTraces(working, memory.motifs, 1);
  }

  const repitched = reharmonizeMelodyLine(working, preset, chordTimeline);
  const events =
    options.preservePhraseExactly !== false
      ? repitchPreservingPhrase(working, repitched)
      : repitched;

  const pitchBends = buildExpressionBends(events, {
    meendLevel: options.meendLevel,
    stevieSlides: options.stevieSlides,
  });

  return { events, pitchBends };
}

/** `MySong.mid` + section J → `MySong_Section-J.mid` (preserves original basename). */
export function evolutionExportFilename(
  sourceFilename: string,
  sectionId?: string,
  fallbackLabel?: string,
): string {
  const baseName = sourceFilename.replace(/^.*[/\\]/, "");
  const match = baseName.match(/^(.+?)(\.[^.]+)?$/);
  const base = match?.[1] ?? baseName;
  const ext = match?.[2] ?? ".mid";
  const tag = sectionId
    ? `_Section-${sectionId}`
    : fallbackLabel
      ? `_${fallbackLabel.replace(/[^a-zA-Z0-9-_]+/g, "-")}`
      : "_Evolved";
  return `${base}${tag}${ext}`;
}
