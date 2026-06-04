import archiver from "archiver";
import { PassThrough } from "stream";
import { finished } from "stream/promises";
import type { TranscribedNote } from "./audio-transcription";
import { buildPlayExportPackFiles, stemExportHasContent, type StemExportInput } from "./play-export-pack";

export type StemMidiExport = StemExportInput;

export function stemPackHasMidiContent(options: {
  stems: StemMidiExport[];
  melodyneNotes?: TranscribedNote[];
}): boolean {
  return stemExportHasContent(options);
}

export async function buildStemMidiZipBuffer(options: {
  bpm: number;
  stems: StemMidiExport[];
  melodyneNotes?: TranscribedNote[];
  projectName?: string;
  sessionJson?: Record<string, unknown>;
}): Promise<Buffer> {
  const pack = buildPlayExportPackFiles(options);
  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks: Buffer[] = [];
  passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
  archive.pipe(passthrough);

  archive.append(pack.readme, { name: "README.txt" });
  for (const f of pack.files) {
    archive.append(Buffer.from(f.data), { name: f.name });
  }

  archive.on("error", (err) => passthrough.destroy(err));
  await archive.finalize();
  await finished(passthrough);

  const zipBuffer = Buffer.concat(chunks);
  if (zipBuffer.length < 22) throw new Error("Export zip is empty");
  return zipBuffer;
}
