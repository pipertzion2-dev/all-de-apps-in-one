import type { TranscribedNote } from "./audio-transcription";
import { transcriptionToMidiEvents } from "./audio-transcription";
import { buildMidiFileBytes, type MidiStemInput } from "./midi-export";
import { stemMidiFilename } from "./midi-filenames";
import { normalizeMidiEvents } from "./midi-normalize";

export type StemExportInput = {
  name: string;
  role?: string;
  midiEvents?: unknown[];
  expression?: MidiStemInput["expression"];
};

export function stemExportHasContent(options: {
  stems: StemExportInput[];
  melodyneNotes?: TranscribedNote[];
}): boolean {
  const { stems, melodyneNotes } = options;
  if (Array.isArray(melodyneNotes) && melodyneNotes.length > 0) return true;
  return stems.some((s) => normalizeMidiEvents(s.midiEvents).length > 0);
}

export type PlayExportPackFiles = {
  readme: string;
  sessionJson?: string;
  files: { name: string; data: Buffer | Uint8Array }[];
};

/** Build all export artifacts (MIDI stems + session JSON) for zip packaging. */
export function buildPlayExportPackFiles(options: {
  bpm: number;
  stems: StemExportInput[];
  melodyneNotes?: TranscribedNote[];
  projectName?: string;
  sessionJson?: Record<string, unknown>;
}): PlayExportPackFiles {
  const { bpm, stems, melodyneNotes, projectName = "svivva-play", sessionJson } = options;

  if (!stemExportHasContent({ stems, melodyneNotes })) {
    throw new Error("No MIDI notes to export");
  }

  const withNotes = stems.filter((s) => normalizeMidiEvents(s.midiEvents).length > 0);
  const files: { name: string; data: Buffer | Uint8Array }[] = [];

  if (melodyneNotes?.length) {
    const events = transcriptionToMidiEvents(melodyneNotes, bpm, 0);
    files.push({
      name: "melodyne_reference.mid",
      data: buildMidiFileBytes([{ name: "Melodyne Reference", midiEvents: events }], bpm),
    });
  }

  withNotes.forEach((stem, i) => {
    files.push({
      name: stemMidiFilename(stem.name, stem.role, i),
      data: buildMidiFileBytes(
        [{ name: stem.name, midiEvents: stem.midiEvents, expression: stem.expression }],
        bpm,
      ),
    });
  });

  if (withNotes.length > 1) {
    files.push({
      name: "all_stems_multitrack.mid",
      data: buildMidiFileBytes(withNotes, bpm),
    });
  }

  if (sessionJson) {
    files.push({
      name: "svivva-play-session.json",
      data: new TextEncoder().encode(JSON.stringify(sessionJson, null, 2)),
    });
  }

  const readme = [
    "Svivva Play — full export pack",
    `Project: ${projectName}`,
    `Tempo: ${bpm} BPM`,
    "",
    "Contents:",
    "- svivva-play-session.json — analysis, stems, expression (meend pitch bends)",
    "- *.mid — one file per stem (pitch bend included when Meend is on)",
    "- melodyne_reference.mid — imported Melodyne notes (if present)",
    "- all_stems_multitrack.mid — all generated parts in one file",
    "",
    "Drag .mid files into your DAW. Meend uses MIDI pitch wheel data on every stem when enabled.",
  ].join("\n");

  return { readme, sessionJson: sessionJson ? JSON.stringify(sessionJson, null, 2) : undefined, files };
}
