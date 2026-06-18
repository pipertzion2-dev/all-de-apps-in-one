import type { NormalizedMidiEvent } from "../midi-normalize";
import { analyzeGlobalComposition, mergeTracksToEvents } from "./analyze-composition";
import { runCompositionalForensics, type ForensicsReport } from "./compositional-forensics";
import { interpretEvolutionPrompt, mergePlanIntoOptions } from "./ai-plan";
import { generateContinuation } from "./continuation";
import {
  buildEvolutionExportPack,
  buildEvolutionZipBuffer,
  buildTransformationReport,
} from "./export-pack";
import { generateLongFormSection, suggestNextSection } from "./generate-long-form-section";
import { LONG_FORM_SECTIONS, type LongFormSectionId } from "./long-form-sections";
import { transformComposition } from "./transform-engine";
import type {
  CompositionMemory,
  GeneratedPart,
  MeendLevel,
  StylePresetId,
  TransformationReport,
} from "./types";

export type EvolutionRequest = {
  action: "analyze" | "forensics" | "transform" | "continue" | "generate-section" | "export";
  files?: { filename: string; base64: string }[];
  prompt?: string;
  preset?: StylePresetId;
  stevieSlides?: boolean;
  meendLevel?: MeendLevel;
  memory?: CompositionMemory;
  lastPart?: GeneratedPart;
  sourceFilename?: string;
  sectionId?: LongFormSectionId;
  appendAfterLast?: boolean;
};

export type EvolutionResponse = {
  memory: CompositionMemory;
  part?: GeneratedPart;
  report?: TransformationReport;
  forensics?: ForensicsReport;
  trackCount?: number;
  motifCount?: number;
  suggestedSection?: LongFormSectionId | null;
  zipBase64?: string;
  aiPlan?: {
    intentSummary: string;
    harmonicDirection: string;
    motifFocus: string;
    provider?: string;
  };
};

function decodeFiles(files: EvolutionRequest["files"]): { filename: string; buffer: ArrayBuffer }[] {
  if (!files?.length) return [];
  return files.map((f) => {
    const bin = Buffer.from(f.base64, "base64");
    return {
      filename: f.filename,
      buffer: bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength),
    };
  });
}

function resolveSourceEvents(
  req: EvolutionRequest,
  memory: CompositionMemory,
): NormalizedMidiEvent[] {
  const decoded = decodeFiles(req.files);
  if (decoded.length) {
    return mergeTracksToEvents(analyzeGlobalComposition(decoded).tracks);
  }
  if (req.lastPart?.originalEvents?.length) return req.lastPart.originalEvents;
  if (req.lastPart?.events?.length) return req.lastPart.events;
  return [];
}

export async function runMidiEvolution(req: EvolutionRequest): Promise<EvolutionResponse> {
  if (req.action === "analyze" || req.action === "forensics") {
    const decoded = decodeFiles(req.files);
    if (!decoded.length) throw new Error("At least one MIDI file required");
    const { memory, tracks, phrases } = analyzeGlobalComposition(decoded);
    const forensics = runCompositionalForensics(tracks, memory, phrases);
    return {
      memory,
      forensics,
      trackCount: tracks.length,
      motifCount: memory.motifs.length,
      suggestedSection: suggestNextSection(memory),
    };
  }

  let memory = req.memory;
  if (!memory) {
    const decoded = decodeFiles(req.files);
    if (!decoded.length) throw new Error("Composition memory or MIDI files required");
    memory = analyzeGlobalComposition(decoded).memory;
  }

  const preset = req.preset ?? "custom";
  const prompt = req.prompt ?? "";
  const aiPlan = await interpretEvolutionPrompt(prompt, preset);
  const options = mergePlanIntoOptions(aiPlan, {
    prompt,
    preset,
    stevieSlides: req.stevieSlides,
    meendLevel: req.meendLevel,
    preserveRhythm: true,
    preservePhraseLength: true,
    preservePhraseExactly: true,
  });

  const sourceFilename =
    req.sourceFilename ?? memory.sourceFiles[0]?.filename ?? "composition.mid";

  if (req.action === "generate-section") {
    if (!req.sectionId) throw new Error("sectionId required (B–J)");
    const sourceEvents = resolveSourceEvents(req, memory);
    if (!sourceEvents.length) throw new Error("Upload MIDI files for section generation");
    const { part, memory: updated } = generateLongFormSection(
      sourceEvents,
      memory,
      req.sectionId,
      sourceFilename,
      req.appendAfterLast !== false ? req.lastPart : null,
      { meendLevel: req.meendLevel, stevieSlides: req.stevieSlides },
    );
    const report = buildTransformationReport(updated, part, aiPlan);
    return {
      memory: updated,
      part,
      report,
      forensics: undefined,
      suggestedSection: suggestNextSection(updated),
      aiPlan: {
        intentSummary: LONG_FORM_SECTIONS[req.sectionId].narrative,
        harmonicDirection: LONG_FORM_SECTIONS[req.sectionId].emotion,
        motifFocus: LONG_FORM_SECTIONS[req.sectionId].motifTransform,
        provider: aiPlan.provider,
      },
    };
  }

  if (req.action === "continue") {
    if (!req.lastPart) throw new Error("lastPart required for continuation");
    const { part, memory: updated } = generateContinuation(
      req.lastPart,
      memory,
      options,
      sourceFilename,
    );
    const report = buildTransformationReport(updated, part, aiPlan);
    return {
      memory: updated,
      part,
      report,
      suggestedSection: suggestNextSection(updated),
      aiPlan: {
        intentSummary: aiPlan.intentSummary,
        harmonicDirection: aiPlan.harmonicDirection,
        motifFocus: aiPlan.motifFocus,
        provider: aiPlan.provider,
      },
    };
  }

  if (req.action === "export") {
    if (!req.lastPart) throw new Error("lastPart required for export");
    const report = buildTransformationReport(memory, req.lastPart, aiPlan);
    const pack = buildEvolutionExportPack(
      memory,
      req.lastPart,
      report,
      sourceFilename,
      req.lastPart.originalEvents,
    );
    const zip = await buildEvolutionZipBuffer(pack);
    return {
      memory,
      part: req.lastPart,
      report,
      zipBase64: zip.toString("base64"),
      suggestedSection: suggestNextSection(memory),
    };
  }

  const sourceEvents = resolveSourceEvents(req, memory);
  if (!sourceEvents.length) {
    throw new Error("Upload MIDI files or run a prior transform before evolving");
  }

  const { part, memory: updated } = transformComposition(
    sourceEvents,
    memory,
    options,
    sourceFilename,
  );
  const report = buildTransformationReport(updated, part, aiPlan);
  return {
    memory: updated,
    part,
    report,
    suggestedSection: suggestNextSection(updated),
    aiPlan: {
      intentSummary: aiPlan.intentSummary,
      harmonicDirection: aiPlan.harmonicDirection,
      motifFocus: aiPlan.motifFocus,
      provider: aiPlan.provider,
    },
  };
}

export { STYLE_PRESETS } from "./style-presets";
export { LONG_FORM_SECTIONS, LONG_FORM_SECTION_ORDER } from "./long-form-sections";
export type { StylePresetId, MeendLevel, CompositionMemory, GeneratedPart, TransformationReport };
export type { ForensicsReport } from "./compositional-forensics";
export type { LongFormSectionId } from "./long-form-sections";
