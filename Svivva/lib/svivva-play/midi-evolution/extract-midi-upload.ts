import JSZip from "jszip";

export type MidiUploadFile = { filename: string; base64: string };

const MIDI_NAME = /\.mid(i)?$/i;
const ZIP_NAME = /\.zip$/i;
const SKIP_PATH = /(?:^|\/)(__MACOSX|\._|\.DS_Store)/i;

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function baseName(path: string): string {
  const parts = normalizePath(path).split("/");
  return parts[parts.length - 1] ?? path;
}

function isMidiZipPath(path: string): boolean {
  const normalized = normalizePath(path);
  if (SKIP_PATH.test(normalized)) return false;
  return MIDI_NAME.test(baseName(normalized));
}

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

async function fileToUpload(file: File): Promise<MidiUploadFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { filename: file.name, base64: uint8ToBase64(bytes) };
}

/** Extract .mid / .midi entries from a zip (including nested folders). */
export async function extractMidiFilesFromZip(file: File): Promise<MidiUploadFile[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const out: MidiUploadFile[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !isMidiZipPath(path)) continue;
    const data = await entry.async("uint8array");
    if (data.length < 14) continue;
    const sig = String.fromCharCode(data[0]!, data[1]!, data[2]!, data[3]!);
    if (sig !== "MThd") continue;
    out.push({
      filename: baseName(path),
      base64: uint8ToBase64(data),
    });
  }

  return out.sort((a, b) => a.filename.localeCompare(b.filename));
}

/** Accept loose MIDI files and/or zip archives containing MIDI stems. */
export async function collectMidiUploads(fileList: FileList | File[]): Promise<MidiUploadFile[]> {
  const files = [...fileList];
  const results: MidiUploadFile[] = [];

  for (const file of files) {
    if (ZIP_NAME.test(file.name)) {
      results.push(...(await extractMidiFilesFromZip(file)));
    } else if (MIDI_NAME.test(file.name)) {
      results.push(await fileToUpload(file));
    }
  }

  const seen = new Set<string>();
  return results.filter((f) => {
    const key = f.filename.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function estimateUploadBytes(files: MidiUploadFile[]): number {
  return files.reduce((sum, f) => sum + Math.floor((f.base64.length * 3) / 4), 0);
}

/** Vercel request body limit is ~4.5MB — warn before sending huge stem packs. */
export const MIDI_UPLOAD_SOFT_LIMIT_BYTES = 4_000_000;
