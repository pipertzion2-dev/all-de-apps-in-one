import archiver from "archiver";
import { PassThrough } from "stream";
import { finished } from "stream/promises";
import type { TranscribedNote } from "./audio-transcription";
import { transcriptionToMidiEvents } from "./audio-transcription";
import { stemMidiFilename } from "./midi-filenames";
import { buildMidiFile } from "./midi-export";
import { normalizeMidiEvents } from "./midi-normalize";

export type StemMidiExport = {
  name: string;
  role?: string;
  midiEvents?: unknown[];
};

export function stemPackHasMidiContent(options: {
  stems: StemMidiExport[];
  melodyneNotes?: TranscribedNote[];
}): boolean {
  const { stems, melodyneNotes } = options;
  if (Array.isArray(melodyneNotes) && melodyneNotes.length > 0) return true;
  return stems.some((s) => normalizeMidiEvents(s.midiEvents).length > 0);
}

export async function buildStemMidiZipBuffer(options: {
  bpm: number;
  stems: StemMidiExport[];
  melodyneNotes?: TranscribedNote[];
  projectName?: string;
}): Promise<Buffer> {
  const { bpm, stems, melodyneNotes, projectName = "svivva-play" } = options;

  if (!stemPackHasMidiContent({ stems, melodyneNotes })) {
    throw new Error("STEM pack has no MIDI notes to export");
  }

  const withNotes = stems.filter((s) => normalizeMidiEvents(s.midiEvents).length > 0);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks: Buffer[] = [];

  passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
  archive.pipe(passthrough);

  archive.append(
    [
      "Svivva Play — STEM pack",
      `Project: ${projectName}`,
      `Tempo: ${bpm} BPM`,
      "",
      "Unzip this folder, then drag individual .mid files into your DAW.",
      "Each file is one part — melody, harmony, bass, etc.",
      "",
      "Files:",
      "- melodyne_reference.mid — imported Melodyne notes (aligned)",
      "- 01_melody_*.mid, 02_harmony_*.mid — generated counterpoint stems",
      "- all_stems_multitrack.mid — optional combined file (all tracks)",
      "",
    ].join("\n"),
    { name: "README.txt" },
  );

  if (melodyneNotes?.length) {
    const events = transcriptionToMidiEvents(melodyneNotes, bpm, 0);
    const buf = buildMidiFile([{ name: "Melodyne Reference", midiEvents: events }], bpm);
    archive.append(buf, { name: "melodyne_reference.mid" });
  }

  withNotes.forEach((stem, i) => {
    const buf = buildMidiFile([{ name: stem.name, midiEvents: stem.midiEvents }], bpm);
    archive.append(buf, { name: stemMidiFilename(stem.name, stem.role, i) });
  });

  if (withNotes.length > 1) {
    const combined = buildMidiFile(withNotes, bpm);
    archive.append(combined, { name: "all_stems_multitrack.mid" });
  }

  archive.on("error", (err) => {
    passthrough.destroy(err);
  });
  await archive.finalize();
  await finished(passthrough);

  const zipBuffer = Buffer.concat(chunks);
  if (zipBuffer.length < 22) {
    throw new Error("STEM pack zip is empty");
  }
  return zipBuffer;
}
