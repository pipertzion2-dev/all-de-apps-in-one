import JSZip from "jszip";
import type { TranscribedNote } from "./audio-transcription";
import { buildPlayExportPackFiles, type StemExportInput } from "./play-export-pack";

export type { StemExportInput as StemMidiExport };

export async function buildStemPackZipBlobClient(options: {
  bpm: number;
  stems: StemExportInput[];
  melodyneNotes?: TranscribedNote[];
  projectName?: string;
  sessionJson?: Record<string, unknown>;
}): Promise<Blob> {
  const pack = buildPlayExportPackFiles(options);
  const zip = new JSZip();
  zip.file("README.txt", pack.readme);

  for (const f of pack.files) {
    zip.file(f.name, f.data, { binary: true });
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
