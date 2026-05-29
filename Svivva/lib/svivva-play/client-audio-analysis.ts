import { analyze } from "web-audio-beat-detector";
import {
  monoFromAudioBuffer,
  extractOnsetTimes,
  detectBpmAutocorrelation,
  detectBpmPeakHistogram,
  detectKeyHybrid,
  runHybridDetection,
  type DetectionMeta,
  type TempoCandidate,
} from "./tempo-key-core";

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  keyConfidence: number;
  bpmConfidence: number;
  meta: DetectionMeta;
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

export async function analyzeAudioBuffer(
  audioBuffer: AudioBuffer,
): Promise<AudioAnalysisResult | null> {
  if (audioBuffer.duration < 1) return null;

  const mono = monoFromAudioBuffer(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const onsetTimes = extractOnsetTimes(mono, sampleRate);

  const bpmCandidates: TempoCandidate[] = [];

  try {
    const webBpm = Math.round(await analyze(audioBuffer));
    if (webBpm >= 40 && webBpm <= 220) {
      bpmCandidates.push({ bpm: webBpm, weight: 1.2, source: "web-audio-beat-detector" });
    }
  } catch {
    /* optional detector */
  }

  const peakBpm = detectBpmPeakHistogram(mono, sampleRate);
  if (peakBpm) {
    bpmCandidates.push({ bpm: peakBpm, weight: 0.95, source: "peak-histogram" });
  }

  const autoBpm = detectBpmAutocorrelation(mono, sampleRate);
  if (autoBpm) {
    bpmCandidates.push({ bpm: autoBpm, weight: 0.85, source: "autocorrelation" });
  }

  const keyCandidates = detectKeyHybrid(mono, sampleRate);
  const hybrid = runHybridDetection(bpmCandidates, keyCandidates, onsetTimes);

  console.log(
    "🎵 Hybrid tempo/key:",
    hybrid.bpm,
    "BPM",
    hybrid.key,
    "| candidates:",
    bpmCandidates.map((c) => `${c.bpm}(${c.source})`).join(", "),
  );

  return {
    bpm: hybrid.bpm,
    key: hybrid.key,
    keyConfidence: hybrid.keyConfidence,
    bpmConfidence: hybrid.bpmConfidence,
    meta: {
      bpmCandidates: hybrid.bpmCandidates,
      keyCandidates: hybrid.keyCandidates,
      durationSec: audioBuffer.duration,
    },
  };
}

export async function analyzeAudioFile(file: File): Promise<AudioAnalysisResult | null> {
  try {
    const audioBuffer = await decodeAudioFile(file);
    return analyzeAudioBuffer(audioBuffer);
  } catch (error) {
    console.warn("Client audio analysis failed:", error);
    return null;
  }
}
