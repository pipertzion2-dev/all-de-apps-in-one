import JSZip from "jszip";
import type { TranscribedNote } from "./audio-transcription";
import { transcriptionToMidiEvents } from "./audio-transcription";
import { buildMidiFileBytes } from "./midi-export";
import { stemMidiFilename } from "./midi-filenames";
import { normalizeMidiEvents } from "./midi-normalize";

export type StemMidiExport = {
  name: string;
  role?: string;
  midiEvents?: unknown[];
};

export async function buildStemPackZipBlobClient(options: {
  bpm: number;
  stems: StemMidiExport[];
  melodyneNotes?: TranscribedNote[];
  projectName?: string;
}): Promise<Blob> {
  const { bpm, stems, melodyneNotes, projectName = "svivva-play" } = options;
  const withNotes = stems.filter((s) => normalizeMidiEvents(s.midiEvents).length > 0);
  const hasMelodyne = Array.isArray(melodyneNotes) && melodyneNotes.length > 0;
  if (!withNotes.length && !hasMelodyne) {
    throw new Error("No MIDI notes to export");
  }

  const zip = new JSZip();
  zip.file(
    "README.txt",
    [
      "Svivva Play — STEM pack",
      `Project: ${projectName}`,
      `Tempo: ${bpm} BPM`,
      "",
      "Drag each .mid into your DAW.",
    ].join("\n"),
  );

  if (hasMelodyne) {
    const events = transcriptionToMidiEvents(melodyneNotes!, bpm, 0);
    zip.file(
      "melodyne_reference.mid",
      buildMidiFileBytes([{ name: "Melodyne Reference", midiEvents: events }], bpm),
      { binary: true },
    );
  }

  withNotes.forEach((stem, i) => {
    zip.file(
      stemMidiFilename(stem.name, stem.role, i),
      buildMidiFileBytes([{ name: stem.name, midiEvents: stem.midiEvents }], bpm),
      { binary: true },
    );
  });

  if (withNotes.length > 1) {
    zip.file("all_stems_multitrack.mid", buildMidiFileBytes(withNotes, bpm), { binary: true });
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
