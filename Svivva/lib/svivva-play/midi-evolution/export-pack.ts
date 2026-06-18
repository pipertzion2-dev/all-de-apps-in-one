import archiver from "archiver";
import { PassThrough } from "stream";
import { finished } from "stream/promises";
import { buildMidiFileBytes } from "../midi-export";
import { STYLE_PRESETS } from "./style-presets";
import type {
  CompositionMemory,
  EvolutionExportPack,
  GeneratedPart,
  TransformationReport,
} from "./types";

function stemBaseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "_");
}

export function buildTransformationReport(
  memory: CompositionMemory,
  part: GeneratedPart,
  ai?: { provider?: string; model?: string; intentSummary?: string },
): TransformationReport {
  const preset = STYLE_PRESETS[part.preset];
  const original = memory.harmonicCenters.map((h) => h.symbol);
  const next = part.harmonyEvents.length
    ? [...new Set(memory.harmonicCenters.slice(0, 8).map((h) => h.symbol))]
    : original;

  const ornamentation: string[] = [];
  if (part.pitchBends?.length) {
    ornamentation.push("pitch_bend_expression");
    if (part.pitchBends.length > 4) ornamentation.push("meend_or_slides");
  }
  if (ai?.intentSummary?.match(/meend|indian/i)) ornamentation.push("meend_legato");

  return {
    generatedAt: new Date().toISOString(),
    prompt: part.prompt,
    preset: part.preset,
    generationNumber: part.generationNumber,
    originalHarmonicCenters: original,
    newHarmonicCenters: next,
    motifsTransformed: memory.motifs.slice(0, 6).map((m) => m.id),
    voiceLeadingStrategy: preset.voicingStrategy,
    bassStrategy: preset.bassStrategy,
    ornamentationApplied: ornamentation,
    sectionId: part.sectionId,
    sectionTitle: part.sectionTitle,
    aiProvider: ai?.provider,
    aiModel: ai?.model,
    intentSummary: ai?.intentSummary,
  };
}

export function buildEvolutionExportPack(
  memory: CompositionMemory,
  part: GeneratedPart,
  report: TransformationReport,
  sourceFilename: string,
  originalEvents?: GeneratedPart["events"],
): EvolutionExportPack {
  const bpm = memory.globalBpm;
  const originalBase = stemBaseName(sourceFilename);
  const originalMidi = buildMidiFileBytes(
    [{ name: "Original", midiEvents: originalEvents ?? part.events }],
    bpm,
  );

  const transformedMidi = buildMidiFileBytes(
    [
      {
        name: part.label,
        midiEvents: part.events,
        expression: part.pitchBends?.length
          ? { meend: true, pitchbend: part.pitchBends }
          : undefined,
      },
      { name: "Bass", midiEvents: part.bassEvents },
      { name: "Harmony", midiEvents: part.harmonyEvents },
      { name: "Melody", midiEvents: part.melodyEvents },
    ],
    bpm,
  );

  const suffix = part.filename.replace(/\.mid$/i, "").replace(/^.*_/, "");
  const transformedName = `${originalBase}_${suffix}.mid`;

  return {
    memory,
    report,
    midiFiles: [
      { filename: `${originalBase}_Original.mid`, data: originalMidi },
      { filename: transformedName, data: transformedMidi },
    ],
  };
}

export async function buildEvolutionZipBuffer(pack: EvolutionExportPack): Promise<Buffer> {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks: Buffer[] = [];
  passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
  archive.pipe(passthrough);

  archive.append(JSON.stringify(pack.memory, null, 2), { name: "CompositionMemory.json" });
  archive.append(JSON.stringify(pack.report, null, 2), { name: "TransformationReport.json" });
  for (const f of pack.midiFiles) {
    archive.append(Buffer.from(f.data), { name: f.filename });
  }

  archive.on("error", (err) => passthrough.destroy(err));
  await archive.finalize();
  await finished(passthrough);
  return Buffer.concat(chunks);
}
