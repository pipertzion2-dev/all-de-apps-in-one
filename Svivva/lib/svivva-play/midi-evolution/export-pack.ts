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
import { LONG_FORM_SECTION_ORDER, LONG_FORM_SECTIONS } from "./long-form-sections";
import { generateLongFormSection } from "./generate-long-form-section";

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
  const exportStems =
    output.layers?.length && output.layers.length > 1
      ? output.layers.map((layer) => ({
          name: layer.name,
          midiEvents: layer.events,
          expression: layer.pitchBends?.length
            ? { meend: true, pitchbend: layer.pitchBends }
            : output.pitchBends?.length
              ? { meend: true, pitchbend: output.pitchBends }
              : undefined,
        }))
      : [
          {
            name: stemName,
            midiEvents: output.transformedEvents,
            expression: output.pitchBends?.length
              ? { meend: true, pitchbend: output.pitchBends }
              : undefined,
          },
        ];

  return buildMidiFileBytes(exportStems, exportBpm, {
    ticksPerBeat: output.ticksPerBeat,
  });
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

function sectionFolderName(sectionId: string, title?: string): string {
  const slug = (title ?? sectionId).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${String(LONG_FORM_SECTION_ORDER.indexOf(sectionId as never) + 1).padStart(
    2,
    "0",
  )}_Sec-${sectionId}_${slug || "Section"}`;
}

export async function buildLongFormSuiteZipBuffer(
  memory: CompositionMemory,
  tracks: ImportedMidiTrack[],
): Promise<{ zip: Buffer; memory: CompositionMemory; reports: TransformationReport[] }> {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks: Buffer[] = [];
  const reports: TransformationReport[] = [];
  let suiteMemory: CompositionMemory = { ...memory, completedSections: [] };

  passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
  archive.pipe(passthrough);

  for (const sectionId of LONG_FORM_SECTION_ORDER) {
    const spec = LONG_FORM_SECTIONS[sectionId];
    const sourceEvents = tracks.flatMap((t) => t.events);
    const generated = generateLongFormSection(
      sourceEvents,
      suiteMemory,
      sectionId,
      tracks[0]?.filename ?? "svivva-midi.mid",
      null,
      undefined,
      tracks,
    );
    suiteMemory = generated.memory;
    const report = buildTransformationReport(suiteMemory, generated.part, {
      provider: "deterministic-suite",
      model: "built-in-glasper-rules",
      intentSummary:
        "Nine prebuilt reharmonized versions of the uploaded stem set; timing, duration, velocity, and channels preserved.",
    });
    const pack = buildEvolutionExportPack(suiteMemory, generated.part, report, tracks);
    reports.push(pack.report);

    const folder = sectionFolderName(sectionId, spec.title);
    archive.append(JSON.stringify(pack.report, null, 2), {
      name: `${folder}/TransformationReport.json`,
    });
    for (const f of pack.midiFiles) {
      archive.append(Buffer.from(f.data), { name: `${folder}/${f.filename}` });
    }
  }

  const finalMemory: CompositionMemory = {
    ...suiteMemory,
    completedSections: [...LONG_FORM_SECTION_ORDER],
    updatedAt: new Date().toISOString(),
  };
  archive.append(JSON.stringify(finalMemory, null, 2), { name: "CompositionMemory.json" });
  archive.append(suiteReadme(finalMemory, reports), { name: "README.txt" });

  archive.on("error", (err) => passthrough.destroy(err));
  await archive.finalize();
  await finished(passthrough);
  return { zip: Buffer.concat(chunks), memory: finalMemory, reports };
}

function suiteReadme(memory: CompositionMemory, reports: TransformationReport[]): string {
  const exportedCount = reports.reduce(
    (sum, report) => sum + (report.exportedFiles?.length ?? 0),
    0,
  );
  return [
    "Svivva MIDI Evolution Suite",
    "===========================",
    "",
    `BPM     : ${memory.globalBpm}`,
    `Key     : ${memory.key}`,
    `Versions: ${LONG_FORM_SECTION_ORDER.length}`,
    `Files   : ${exportedCount}`,
    "",
    "WHAT THIS EXPORT IS",
    "-------------------",
    "This zip contains 9 reharmonized versions of every uploaded MIDI stem.",
    "For a 10-stem upload, that produces 90 MIDI files.",
    "Each version is in its own Section folder.",
    "",
    "TIMING GUARANTEE",
    "----------------",
    "Every exported note keeps the uploaded note's start beat, duration, velocity, and channel.",
    "Only pitch and optional pitch-bend expression are changed.",
    "Drag all files from one section folder into Ableton at Bar 1, Beat 1.",
    "",
    "STYLE LOGIC",
    "-----------",
    "Built-in deterministic Glasper / neo-soul rules: rootless minor 9/11/13 colors,",
    "major 9/#11 and 13sus sonorities, quartal/polychord density, chromatic bass side-slips,",
    "and common-tone voice leading. No Ollama or external AI service is required.",
    "",
    "SECTIONS",
    "--------",
    ...LONG_FORM_SECTION_ORDER.map((id) => {
      const spec = LONG_FORM_SECTIONS[id];
      return `  Sec-${id}: ${spec.title} - ${spec.emotion}`;
    }),
    "",
    "Generated by Svivva Play - svivva.com",
    `Date: ${new Date().toISOString()}`,
  ].join("\n");
}

function fileListReadme(report: TransformationReport, filenames: string[]): string {
  const bpm = report.exportedFiles?.[0]?.bpm;
  const lines = [
    "Svivva MIDI Evolution Export",
    "============================",
    "",
    `Section : ${report.sectionId ?? "—"} ${report.sectionTitle ?? ""}`.trim(),
    `BPM     : ${bpm ?? "see file"}`,
    `Files   : ${filenames.length}`,
    "",
    "WHAT THESE FILES ARE",
    "--------------------",
    "Each .mid file corresponds to one uploaded MIDI stem.",
    "Velocity and note timing are preserved from your original.",
    "Pitches have been reharmonized per the section's harmonic rules.",
    "",
    "ABLETON IMPORT INSTRUCTIONS",
    "---------------------------",
    "1. Drag all .mid files into your Ableton Live session.",
    "2. Place them all at Bar 1, Beat 1 — they share the same timeline.",
    "3. Set your Ableton project BPM to match the BPM listed above.",
    "4. The MIDI track names match your original stem filenames for easy alignment.",
    "",
    "PITCH BEND / MEEND SETUP (if bends are present)",
    "------------------------------------------------",
    "Some files may contain pitch-bend data (meend expression).",
    "In Ableton: open the instrument on that track → set Pitch Bend Range",
    "to 12 semitones (or the range indicated in the MIDI marker comment).",
    "Without this, the glides will sound out of tune.",
    "",
    "FILES",
    "-----",
    ...filenames.map((n) => `  ${n}`),
  ];
  if (report.exportedFiles?.length) {
    lines.push("", "SOURCE → EXPORT MAPPING", "-----------------------");
    for (const m of report.exportedFiles) {
      lines.push(`  ${m.source}  →  ${m.export}  (${m.noteCount} notes, ${m.bpm} BPM)`);
    }
  }
  lines.push("", "Generated by Svivva Play — svivva.com", `Date: ${report.generatedAt}`);
  return lines.join("\n");
}
