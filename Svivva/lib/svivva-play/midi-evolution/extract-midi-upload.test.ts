import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { collectMidiUploads, extractMidiFilesFromZip } from "./extract-midi-upload";
import { buildMidiFileBytes } from "../midi-export";
import { notesToMidiEvents } from "./note-bridge";
import type { TranscribedNote } from "../audio-transcription";

function makeNotes(midiSeq: number[]): TranscribedNote[] {
  return midiSeq.map((midi, i) => ({
    midi,
    startSec: i * 0.5,
    endSec: i * 0.5 + 0.4,
    velocity: 80,
    cents: 0,
  }));
}

async function makeZip(entries: { path: string; data: Uint8Array }[]): Promise<File> {
  const zip = new JSZip();
  for (const { path, data } of entries) zip.file(path, data);
  const blob = await zip.generateAsync({ type: "blob" });
  return new File([blob], "stems.zip", { type: "application/zip" });
}

describe("extractMidiFilesFromZip", () => {
  it("extracts midi files from a zip including nested paths", async () => {
    const bass = buildMidiFileBytes(
      [{ name: "Bass", midiEvents: notesToMidiEvents(makeNotes([48, 52]), 120) }],
      120,
    );
    const lead = buildMidiFileBytes(
      [{ name: "Lead", midiEvents: notesToMidiEvents(makeNotes([67, 69]), 120) }],
      120,
    );
    const zipFile = await makeZip([
      { path: "folder/Bass.mid", data: bass },
      { path: "Lead.mid", data: lead },
      { path: "readme.txt", data: new TextEncoder().encode("ignore") },
    ]);

    const files = await extractMidiFilesFromZip(zipFile);
    expect(files.map((f) => f.filename)).toEqual(["Bass.mid", "Lead.mid"]);
    expect(files.every((f) => f.base64.length > 20)).toBe(true);
  });

  it("collects midi from zip and loose files together", async () => {
    const bass = buildMidiFileBytes(
      [{ name: "Bass", midiEvents: notesToMidiEvents(makeNotes([48]), 120) }],
      120,
    );
    const zipFile = await makeZip([{ path: "Bass.mid", data: bass }]);
    const loose = buildMidiFileBytes(
      [{ name: "Melody", midiEvents: notesToMidiEvents(makeNotes([72]), 120) }],
      120,
    );
    const looseFile = new File([loose], "Melody.mid", { type: "audio/midi" });

    const all = await collectMidiUploads([zipFile, looseFile]);
    expect(all.map((f) => f.filename)).toEqual(["Bass.mid", "Melody.mid"]);
  });
});
