import { analyzeAudio, type AudioAnalysisResult } from "./audio-analysis";
import { detectBPMFromFile } from "./bpm-detect";

/** Halve obvious double-time readings for pop/hip-hop style material. */
function normalizeBpm(bpm: number): number {
  let value = Math.round(bpm);
  if (value > 130 && value <= 200) value = Math.round(value / 2);
  if (value < 40) value *= 2;
  if (value > 220) value = Math.round(value / 2);
  return Math.max(40, Math.min(220, value));
}

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    return await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioCtx.close().catch(() => {});
  }
}

export async function analyzeAudioFile(file: File): Promise<AudioAnalysisResult | null> {
  try {
    const audioBuffer = await decodeAudioFile(file);
    if (audioBuffer.duration < 1) return null;

    const [bufferAnalysis, peakBpm] = await Promise.all([
      analyzeAudio(audioBuffer),
      detectBPMFromFile(file),
    ]);

    const bpmSource = peakBpm ?? bufferAnalysis.bpm;
    const bpm = normalizeBpm(bpmSource);

    return {
      bpm,
      key: bufferAnalysis.key,
      keyConfidence: bufferAnalysis.keyConfidence,
    };
  } catch (error) {
    console.warn("Client audio analysis failed:", error);
    return null;
  }
}
