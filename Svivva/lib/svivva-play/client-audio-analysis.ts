import { analyze } from "web-audio-beat-detector";
import {
  monoFromAudioBuffer,
  findLoudestAnalysisWindow,
  sliceMonoWindow,
  emphasizePercussive,
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
  const AudioCtx =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : null;
  if (!AudioCtx) throw new Error("Web Audio API unavailable");

  const audioCtx = new AudioCtx();
  try {
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    return await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioCtx.close().catch(() => {});
  }
}

function sliceAudioBuffer(
  audioBuffer: AudioBuffer,
  offsetSec: number,
  durationSec: number,
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(offsetSec * sampleRate);
  const frameCount = Math.min(
    Math.floor(durationSec * sampleRate),
    audioBuffer.length - startSample,
  );
  const offline = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    frameCount,
    sampleRate,
  );
  const source = offline.createBufferSource();
  const sliced = offline.createBuffer(
    audioBuffer.numberOfChannels,
    frameCount,
    sampleRate,
  );
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const channel = audioBuffer.getChannelData(ch);
    sliced.copyToChannel(channel.subarray(startSample, startSample + frameCount), ch);
  }
  source.buffer = sliced;
  source.connect(offline.destination);
  source.start(0);
  return offline.startRendering();
}

export async function analyzeAudioBuffer(
  audioBuffer: AudioBuffer,
): Promise<AudioAnalysisResult | null> {
  if (audioBuffer.duration < 0.5) return null;

  const fullMono = monoFromAudioBuffer(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const window = findLoudestAnalysisWindow(fullMono, sampleRate, 45);
  const analysisMono = sliceMonoWindow(fullMono, window.offset, window.length);
  const percussive = emphasizePercussive(analysisMono);
  const onsetTimes = extractOnsetTimes(percussive, sampleRate);

  const bpmCandidates: TempoCandidate[] = [];
  const offsetSec = window.offset / sampleRate;
  const windowSec = window.length / sampleRate;

  const beatDetectorPromise = (async () => {
    try {
      const slice =
        offsetSec > 0.5 || windowSec < audioBuffer.duration - 0.5
          ? await sliceAudioBuffer(audioBuffer, offsetSec, windowSec)
          : audioBuffer;
      const webBpm = Math.round(await analyze(slice));
      if (webBpm >= 40 && webBpm <= 220) {
        return { bpm: webBpm, weight: 1.25, source: "web-audio-beat-detector" } as TempoCandidate;
      }
    } catch {
      /* optional detector */
    }
    return null;
  })();

  const peakBpm = detectBpmPeakHistogram(percussive, sampleRate);
  if (peakBpm) {
    bpmCandidates.push({ bpm: peakBpm, weight: 1.0, source: "peak-histogram" });
  }

  const autoBpm = detectBpmAutocorrelation(percussive, sampleRate);
  if (autoBpm) {
    bpmCandidates.push({ bpm: autoBpm, weight: 0.9, source: "autocorrelation" });
  }

  const beatCandidate = await beatDetectorPromise;
  if (beatCandidate) bpmCandidates.push(beatCandidate);

  const keyCandidates = detectKeyHybrid(analysisMono, sampleRate);
  const hybrid = runHybridDetection(bpmCandidates, keyCandidates, onsetTimes);

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
