/** Local analysis — browser handles large WAV via partial PCM read (no full decode). */
export const MAX_LOCAL_WAV_BYTES = 250 * 1024 * 1024;
export const MAX_LOCAL_COMPRESSED_BYTES = 80 * 1024 * 1024;

/** Full file cloud upload (Vercel-safe; larger files use clip or metadata-only). */
export const MAX_CLOUD_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Mono clip length sent to cloud when the original exceeds upload limits. */
export const CLOUD_CLIP_SEC = 40;

/** Partial PCM read cap for in-browser tempo/key (WAV only). */
export const WAV_PARTIAL_READ_SEC = 48;

export function isWavFile(file: Pick<File, "name" | "type">): boolean {
  return (
    /\.wav$/i.test(file.name) ||
    file.type === "audio/wav" ||
    file.type === "audio/x-wav" ||
    file.type === "audio/wave"
  );
}

export function getMaxLocalFileBytes(file: Pick<File, "name" | "type" | "size">): number {
  return isWavFile(file) ? MAX_LOCAL_WAV_BYTES : MAX_LOCAL_COMPRESSED_BYTES;
}

export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function isLocalFileTooLarge(file: Pick<File, "name" | "type" | "size">): boolean {
  return file.size > getMaxLocalFileBytes(file);
}

export function needsCloudClip(file: Pick<File, "name" | "type" | "size">): boolean {
  return file.size > MAX_CLOUD_UPLOAD_BYTES && isWavFile(file);
}

export function isClientDetectionReliable(detection: {
  bpm: number;
  key: string;
  keyConfidence: number;
  bpmConfidence?: number;
}): boolean {
  return (
    detection.bpm >= 40 &&
    detection.bpm <= 220 &&
    detection.keyConfidence >= 35 &&
    (detection.bpmConfidence ?? detection.keyConfidence) >= 35
  );
}
