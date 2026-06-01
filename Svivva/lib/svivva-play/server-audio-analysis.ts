import { readFile } from "fs/promises";
import {
  extractOnsetTimes,
  detectBpmAutocorrelation,
  detectBpmPeakHistogram,
  detectBpmOnsetAutocorrelation,
  detectKeyHybrid,
  runHybridDetection,
  findLoudestAnalysisWindow,
  sliceMonoWindow,
  emphasizePercussive,
  type DetectionMeta,
  type TempoCandidate,
} from "./tempo-key-core";

interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  data: Float32Array;
}

function parseWav(buffer: Buffer): WavInfo {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let pos = 12;

  let fmtPos = 0;
  let dataPos = 0;
  let dataSize = 0;

  while (pos < buffer.length - 8) {
    const chunkId = String.fromCharCode(
      buffer[pos],
      buffer[pos + 1],
      buffer[pos + 2],
      buffer[pos + 3],
    );
    const chunkSize = view.getInt32(pos + 4, true);
    if (chunkId === "fmt ") {
      fmtPos = pos + 8;
    } else if (chunkId === "data") {
      dataPos = pos + 8;
      dataSize = chunkSize;
      break;
    }
    pos += 8 + chunkSize + (chunkSize % 2);
  }

  if (!fmtPos || !dataPos) throw new Error("Invalid WAV: missing fmt or data chunk");

  const audioFormat = view.getInt16(fmtPos, true);
  const channels = view.getInt16(fmtPos + 2, true);
  const sampleRate = view.getInt32(fmtPos + 4, true);
  const bitsPerSample = view.getInt16(fmtPos + 14, true);

  const numSamples = Math.floor(dataSize / (channels * (bitsPerSample / 8)));
  const data = new Float32Array(numSamples);

  if (audioFormat === 1) {
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        const offset = dataPos + (i * channels + ch) * (bitsPerSample / 8);
        let val = 0;
        if (bitsPerSample === 16) {
          val = view.getInt16(offset, true) / 32768;
        } else if (bitsPerSample === 24) {
          const b0 = buffer[offset];
          const b1 = buffer[offset + 1];
          const b2 = buffer[offset + 2];
          val = (b0 | (b1 << 8) | (b2 << 16) | 0) / 8388608;
        } else if (bitsPerSample === 32) {
          val = view.getInt32(offset, true) / 2147483648;
        } else if (bitsPerSample === 8) {
          val = (buffer[offset] - 128) / 128;
        }
        sum += val;
      }
      data[i] = sum / channels;
    }
  } else {
    throw new Error(`Unsupported WAV format: ${audioFormat}`);
  }

  return { sampleRate, channels, bitsPerSample, data };
}

export interface ServerHybridResult {
  bpm: number;
  key: string;
  keyConfidence: number;
  bpmConfidence: number;
  meta: DetectionMeta;
  onsetTimes: number[];
}

export async function analyzeWavFileHybrid(wavPath: string): Promise<ServerHybridResult> {
  const buffer = await readFile(wavPath);
  const { sampleRate, data } = parseWav(buffer);
  const durationSec = data.length / sampleRate;
  const window = findLoudestAnalysisWindow(data, sampleRate, 45);
  const analysisMono = sliceMonoWindow(data, window.offset, window.length);
  const percussive = emphasizePercussive(analysisMono);
  const onsetTimes = extractOnsetTimes(percussive, sampleRate);

  const bpmCandidates: TempoCandidate[] = [];

  const peakBpm = detectBpmPeakHistogram(percussive, sampleRate);
  if (peakBpm) bpmCandidates.push({ bpm: peakBpm, weight: 0.95, source: "server-peak" });

  const autoBpm = detectBpmAutocorrelation(percussive, sampleRate);
  if (autoBpm) bpmCandidates.push({ bpm: autoBpm, weight: 0.85, source: "server-autocorr" });

  const onsetAcBpm = detectBpmOnsetAutocorrelation(onsetTimes);
  if (onsetAcBpm) {
    bpmCandidates.push({ bpm: onsetAcBpm, weight: 1.1, source: "server-onset-ac" });
  }

  const keyCandidates = detectKeyHybrid(analysisMono, sampleRate);
  const hybrid = runHybridDetection(bpmCandidates, keyCandidates, onsetTimes);

  return {
    bpm: hybrid.bpm,
    key: hybrid.key,
    keyConfidence: hybrid.keyConfidence,
    bpmConfidence: hybrid.bpmConfidence,
    onsetTimes,
    meta: {
      bpmCandidates: hybrid.bpmCandidates,
      keyCandidates: hybrid.keyCandidates,
      durationSec,
    },
  };
}

/** Legacy single-pass analysis for callers that don't need hybrid metadata. */
export async function analyzeWavFile(
  wavPath: string,
): Promise<{ bpm: number; key: string; keyConfidence: number }> {
  const result = await analyzeWavFileHybrid(wavPath);
  return {
    bpm: result.bpm,
    key: result.key,
    keyConfidence: result.keyConfidence,
  };
}
