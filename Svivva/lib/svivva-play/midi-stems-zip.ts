import type { TranscribedNote } from "./audio-transcription";
import {
  buildPlayExportZipBuffer,
  stemExportHasContent,
  type StemExportInput,
} from "./play-export-pack";

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
  return buildPlayExportZipBuffer(options);
}
