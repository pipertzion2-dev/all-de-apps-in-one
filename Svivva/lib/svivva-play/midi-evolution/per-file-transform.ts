import type { NormalizedMidiEvent } from "../midi-normalize";
import type { CompositionMemory, TransformOptions } from "./types";
import { pickChordTimeline, reharmonizeMelodyLine } from "./harmony-engine";
import { buildEmotionalChordTimeline } from "./harmonic-evolution";
import { applyMotifTransform, interweaveMotifTraces } from "./motif-transforms";
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

  if (options.motifTransform && options.motifTransform !== "inherit") {
    working = applyMotifTransform(working, options.motifTransform, true);
  }
  if (options.interweaveMotifs && preset.id !== "glasper") {
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
// Mapping from section id to its short name for filenames
const SECTION_SHORT: Record<string, string> = {
  B: "Shadow-Portal",
  C: "Fractured-Mirror",
  D: "Floating-City",
  E: "Abyss",
  F: "Indian-Horizon",
  G: "Glasper-Dimension",
  H: "Derrick-Hodge",
  I: "Cosmic-Tension",
  J: "Revelation",
};

/**
 * Produce a DAW-friendly filename that sorts and identifies instantly.
 * Format: Sec-{id}_{Section-Name}_{stem}_{bpm}bpm_{key}.mid
 * e.g.  Sec-G_Glasper-Dimension_Bass_92bpm_Ebm.mid
 */
export function evolutionExportFilename(
  sourceFilename: string,
  sectionId?: string,
  fallbackLabel?: string,
  bpm?: number,
  key?: string,
): string {
  const baseName = sourceFilename.replace(/^.*[/\\]/, "");
  const match = baseName.match(/^(.+?)(\.[^.]+)?$/);
  const stem = (match?.[1] ?? baseName).replace(/[^a-zA-Z0-9_-]/g, "-");
  const ext = match?.[2] ?? ".mid";

  const sectionTag = sectionId
    ? `Sec-${sectionId}_${SECTION_SHORT[sectionId] ?? sectionId}`
    : fallbackLabel
      ? fallbackLabel.replace(/[^a-zA-Z0-9-_]+/g, "-")
      : "Evolved";

  const bpmTag = bpm ? `_${Math.round(bpm)}bpm` : "";
  const keyTag = key ? `_${key.replace(/[^a-zA-Z0-9#b]/g, "")}` : "";

  return `${sectionTag}_${stem}${bpmTag}${keyTag}${ext}`;
}
