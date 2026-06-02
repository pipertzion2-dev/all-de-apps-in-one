import archiver from "archiver";
import { PassThrough } from "stream";
import type { TranscribedNote } from "./audio-transcription";
import { transcriptionToMidiEvents } from "./audio-transcription";
import { stemMidiFilename } from "./midi-filenames";
import { buildMidiFile } from "./midi-export";

export type StemMidiExport = {
  name: string;
  role?: string;
  midiEvents?: unknown[];
};

export function buildStemMidiZipBuffer(options: {
  bpm: number;
  stems: StemMidiExport[];
  melodyneNotes?: TranscribedNote[];
  projectName?: string;
}): Promise<Buffer> {
  const { bpm, stems, melodyneNotes, projectName = "svivva-play" } = options;

  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const passthrough = new PassThrough();
    const chunks: Buffer[] = [];

    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);
    archive.on("error", reject);
    archive.pipe(passthrough);

    archive.append(
      [
        "Svivva Play — MIDI STEM pack",
        `Project: ${projectName}`,
        `Tempo: ${bpm} BPM`,
        "",
        "Drag any .mid file into Ableton Live (or your DAW).",
        "Each file is one part — melody, harmony, bass, etc.",
        "",
        "Files:",
        "- melodyne_reference.mid — your imported Melodyne notes (aligned)",
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

    const withNotes = stems.filter((s) => {
      const ev = s.midiEvents;
      return Array.isArray(ev) && ev.length > 0;
    });

    withNotes.forEach((stem, i) => {
      const buf = buildMidiFile(
        [{ name: stem.name, midiEvents: stem.midiEvents }],
        bpm,
      );
      archive.append(buf, { name: stemMidiFilename(stem.name, stem.role, i) });
    });

    if (withNotes.length > 1) {
      const combined = buildMidiFile(withNotes, bpm);
      archive.append(combined, { name: "all_stems_multitrack.mid" });
    }

    void archive.finalize();
  });
}
