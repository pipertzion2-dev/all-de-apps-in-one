import { CLOUD_CLIP_SEC, isWavFile, WAV_PARTIAL_READ_SEC } from "./upload-limits";

export { isWavFile };

export interface WavFormat {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  audioFormat: number;
  dataOffset: number;
  dataSize: number;
  durationSec: number;
}

function readFourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

export function parseWavFormat(bytes: Uint8Array): WavFormat | null {
  if (bytes.length < 44) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (readFourCC(view, 0) !== "RIFF" || readFourCC(view, 8) !== "WAVE") return null;

  let pos = 12;
  let fmtPos = -1;
  let fmtSize = 0;
  let dataOffset = -1;
  let dataSize = 0;

  while (pos + 8 <= bytes.length) {
    const chunkId = readFourCC(view, pos);
    const chunkSize = view.getUint32(pos + 4, true);
    if (chunkId === "fmt ") {
      fmtPos = pos + 8;
      fmtSize = chunkSize;
    } else if (chunkId === "data") {
      dataOffset = pos + 8;
      dataSize = chunkSize;
      break;
    }
    pos += 8 + chunkSize + (chunkSize % 2);
  }

  if (fmtPos < 0 || dataOffset < 0 || fmtSize < 16) return null;

  const audioFormat = view.getUint16(fmtPos, true);
  const channels = view.getUint16(fmtPos + 2, true);
  const sampleRate = view.getUint32(fmtPos + 4, true);
  const bitsPerSample = view.getUint16(fmtPos + 14, true);
  if (!sampleRate || !channels || !bitsPerSample) return null;

  const bytesPerFrame = channels * (bitsPerSample / 8);
  const frameCount = Math.floor(dataSize / bytesPerFrame);

  return {
    sampleRate,
    channels,
    bitsPerSample,
    audioFormat,
    dataOffset,
    dataSize,
    durationSec: frameCount / sampleRate,
  };
}

function pcmSampleToFloat(view: DataView, offset: number, bitsPerSample: number): number {
  if (bitsPerSample === 16) return view.getInt16(offset, true) / 32768;
  if (bitsPerSample === 24) {
    const b0 = view.getUint8(offset);
    const b1 = view.getUint8(offset + 1);
    const b2 = view.getUint8(offset + 2);
    let v = b0 | (b1 << 8) | (b2 << 16);
    if (v & 0x800000) v |= ~0xffffff;
    return v / 8388608;
  }
  if (bitsPerSample === 32) return view.getInt32(offset, true) / 2147483648;
  if (bitsPerSample === 8) return (view.getUint8(offset) - 128) / 128;
  return 0;
}

function decodeWavPcmToMono(view: DataView, format: WavFormat, maxFrames: number): Float32Array {
  if (format.audioFormat !== 1) {
    throw new Error(`Unsupported WAV format (${format.audioFormat})`);
  }

  const { channels, bitsPerSample, dataOffset, sampleRate, dataSize } = format;
  const bytesPerFrame = channels * (bitsPerSample / 8);
  const availableFrames = Math.floor(
    Math.min(dataSize, Math.max(0, view.byteLength - dataOffset)) / bytesPerFrame,
  );
  const frameCount = Math.min(maxFrames, availableFrames);
  const mono = new Float32Array(frameCount);

  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) {
      const offset = dataOffset + (i * channels + ch) * (bitsPerSample / 8);
      if (offset + bitsPerSample / 8 > view.byteLength) break;
      sum += pcmSampleToFloat(view, offset, bitsPerSample);
    }
    mono[i] = sum / channels;
  }

  return mono;
}

export async function readWavFormatFromFile(file: File): Promise<WavFormat> {
  const head = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
  const format = parseWavFormat(head);
  if (!format) throw new Error("Invalid or unsupported WAV file");
  return format;
}

/** Read only the first `maxSec` of PCM — avoids loading multi‑hundred‑MB WAVs into memory. */
export async function readWavMonoPartial(
  file: File,
  maxSec = WAV_PARTIAL_READ_SEC,
): Promise<{ mono: Float32Array; sampleRate: number; durationSec: number }> {
  const format = await readWavFormatFromFile(file);
  const bytesPerFrame = format.channels * (format.bitsPerSample / 8);
  const maxFrames = Math.min(
    Math.floor(format.dataSize / bytesPerFrame),
    Math.floor(format.sampleRate * maxSec),
  );
  const bytesToRead = format.dataOffset + maxFrames * bytesPerFrame;
  const slice = new Uint8Array(await file.slice(0, Math.min(file.size, bytesToRead)).arrayBuffer());
  const view = new DataView(slice.buffer, slice.byteOffset, slice.byteLength);
  const mono = decodeWavPcmToMono(view, format, maxFrames);

  return {
    mono,
    sampleRate: format.sampleRate,
    durationSec: format.durationSec,
  };
}

function encodeMonoWav16(mono: Float32Array, sampleRate: number): ArrayBuffer {
  const dataSize = mono.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < mono.length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
    offset += 2;
  }

  return buffer;
}

/** Small mono clip for cloud session upload when the original WAV is huge. */
export async function buildWavUploadClip(file: File, maxSec = CLOUD_CLIP_SEC): Promise<File> {
  const { mono, sampleRate } = await readWavMonoPartial(file, maxSec);
  const wav = encodeMonoWav16(mono, sampleRate);
  const base = file.name.replace(/\.[^.]+$/, "") || "clip";
  return new File([wav], `${base}-clip.wav`, { type: "audio/wav" });
}

export function downsampleMono(
  mono: Float32Array,
  sampleRate: number,
  targetRate = 22050,
): { mono: Float32Array; sampleRate: number } {
  if (sampleRate <= targetRate) return { mono, sampleRate };
  const ratio = sampleRate / targetRate;
  const outLen = Math.floor(mono.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    out[i] = mono[Math.floor(i * ratio)] ?? 0;
  }
  return { mono: out, sampleRate: targetRate };
}
