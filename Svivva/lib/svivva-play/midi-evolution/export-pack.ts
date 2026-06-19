import archiver from "archiver";
import { PassThrough } from "stream";
import { finished } from "stream/promises";
import { buildMidiFileBytes } from "../midi-export";
import { STYLE_PRESETS } from "./style-presets";
import type {
  CompositionMemory,
  EvolutionExportPack,
  GeneratedPart,
  ImportedMidiTrack,
  PerFileMidiOutput,
  TransformationReport,
} from "./types";
import type { TransformOptions } from "./types";
import { fileOutputsFromMemoryAndTracks } from "./per-file-export";
import { sectionSpecToTransformOptions } from "./long-form-sections";
import { LONG_FORM_SECTIONS } from "./long-form-sections";

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

function resolveExportOptions(part: GeneratedPart): TransformOptions {
  if (part.sectionId && LONG_FORM_SECTIONS[part.sectionId as keyof typeof LONG_FORM_SECTIONS]) {
    const spec = LONG_FORM_SECTIONS[part.sectionId as keyof typeof LONG_FORM_SECTIONS];
    return sectionSpecToTransformOptions(spec);
  }
  return {
    prompt: part.prompt,
    preset: part.preset,
    preserveRhythm: true,
    preservePhraseLength: true,
    preservePhraseExactly: true,
  };
}

function midiBytesForFileOutput(output: PerFileMidiOutput, exportBpm: number): Uint8Array {
  const stemName = output.sourceFilename.replace(/\.[^.]+$/, "");
  return buildMidiFileBytes(
    [
      {
        name: stemName,
        midiEvents: output.transformedEvents,
        expression: output.pitchBends?.length
          ? { meend: true, pitchbend: output.pitchBends }
          : undefined,
      },
    ],
    exportBpm,
  );
}

export function buildEvolutionExportPack(
  memory: CompositionMemory,
  part: GeneratedPart,
  report: TransformationReport,
  tracks: ImportedMidiTrack[],
): EvolutionExportPack {
  const options = resolveExportOptions(part);
  const fileOutputs = fileOutputsFromMemoryAndTracks(memory, tracks, part, options);

  const midiFiles = fileOutputs.map((output) => ({
    filename: output.exportFilename,
    data: midiBytesForFileOutput(output, memory.globalBpm),
  }));

  const enrichedReport: TransformationReport = {
    ...report,
    exportedFiles: fileOutputs.map((f) => ({
      source: f.sourceFilename,
      export: f.exportFilename,
      noteCount: f.transformedEvents.length,
      bpm: f.bpm,
    })),
  };

  return {
    memory,
    report: enrichedReport,
    midiFiles,
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
  archive.append(
    fileListReadme(
      pack.report,
      pack.midiFiles.map((f) => f.filename),
    ),
    { name: "README.txt" },
  );

  for (const f of pack.midiFiles) {
    archive.append(Buffer.from(f.data), { name: f.filename });
  }

  archive.on("error", (err) => passthrough.destroy(err));
  await archive.finalize();
  await finished(passthrough);
  return Buffer.concat(chunks);
}

function fileListReadme(report: TransformationReport, filenames: string[]): string {
  const lines = [
    "Svivva MIDI Evolution Export",
    "============================",
    "",
    `Section: ${report.sectionId ?? "—"} ${report.sectionTitle ?? ""}`.trim(),
    `Files exported: ${filenames.length}`,
    "",
    "Each file matches an uploaded MIDI — same note timing & velocity, repitched harmony.",
    "",
    ...filenames.map((n) => `- ${n}`),
  ];
  if (report.exportedFiles?.length) {
    lines.push("", "Source → export mapping:");
    for (const m of report.exportedFiles) {
      lines.push(`  ${m.source} → ${m.export}`);
    }
  }
  return lines.join("\n");
}
