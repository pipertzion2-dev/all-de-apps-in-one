import { analyze } from "web-audio-beat-detector";
import {
  findLoudestAnalysisWindow,
  sliceMonoWindow,
  emphasizePercussive,
  extractOnsetTimes,
  detectBpmAutocorrelation,
  detectBpmPeakHistogram,
  detectKeyHybrid,
  runHybridDetection,
  monoFromAudioBuffer,
  compactOnsetTimesForMeta,
  type DetectionMeta,
  type TempoCandidate,
} from "./tempo-key-core";
import { isWavFile, WAV_PARTIAL_READ_SEC } from "./upload-limits";
import { downsampleMono, readWavMonoPartial } from "./wav-utils";

const FAST_WINDOW_SEC = 32;
const FULL_WINDOW_SEC = 45;
const PARTIAL_WAV_THRESHOLD_BYTES = 3 * 1024 * 1024;
const ANALYSIS_DOWNSAMPLE_HZ = 44100;

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
  const offline = new OfflineAudioContext(audioBuffer.numberOfChannels, frameCount, sampleRate);
  const source = offline.createBufferSource();
  const sliced = offline.createBuffer(audioBuffer.numberOfChannels, frameCount, sampleRate);
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const channel = audioBuffer.getChannelData(ch);
    sliced.copyToChannel(channel.subarray(startSample, startSample + frameCount), ch);
  }
  source.buffer = sliced;
  source.connect(offline.destination);
  source.start(0);
  return offline.startRendering();
}

async function analyzeMonoSamples(
  fullMono: Float32Array,
  sampleRate: number,
  durationSec: number,
  options?: { fast?: boolean; audioBuffer?: AudioBuffer },
): Promise<AudioAnalysisResult | null> {
  const fast = options?.fast ?? false;
  if (durationSec < 0.5 || fullMono.length < sampleRate * 0.5) return null;

  const windowSec = fast ? FAST_WINDOW_SEC : FULL_WINDOW_SEC;
  const window = findLoudestAnalysisWindow(fullMono, sampleRate, windowSec);
  const analysisMono = sliceMonoWindow(fullMono, window.offset, window.length);

  let dspMono = analysisMono;
  let dspRate = sampleRate;
  if (sampleRate > ANALYSIS_DOWNSAMPLE_HZ) {
    ({ mono: dspMono, sampleRate: dspRate } = downsampleMono(
      analysisMono,
      sampleRate,
      ANALYSIS_DOWNSAMPLE_HZ,
    ));
  }

  const percussive = emphasizePercussive(dspMono);
  const onsetTimes = extractOnsetTimes(percussive, dspRate);

  const bpmCandidates: TempoCandidate[] = [];
  const offsetSec = window.offset / sampleRate;
  const windowSecActual = window.length / sampleRate;

  const peakBpm = detectBpmPeakHistogram(percussive, dspRate);
  if (peakBpm) {
    bpmCandidates.push({ bpm: peakBpm, weight: 1.0, source: "peak-histogram" });
  }

  const autoBpm = detectBpmAutocorrelation(percussive, dspRate);
  if (autoBpm) {
    bpmCandidates.push({ bpm: autoBpm, weight: 0.9, source: "autocorrelation" });
  }

  const audioBuffer = options?.audioBuffer;
  if (audioBuffer) {
    try {
      const slice =
        offsetSec > 0.5 || windowSecActual < audioBuffer.duration - 0.5
          ? await sliceAudioBuffer(audioBuffer, offsetSec, windowSecActual)
          : audioBuffer;
      const webBpm = Math.round(await analyze(slice));
      if (webBpm >= 40 && webBpm <= 220) {
        bpmCandidates.push({
          bpm: webBpm,
          weight: 1.25,
          source: "web-audio-beat-detector",
        });
      }
    } catch {
      /* optional detector */
    }
  }

  const keyCandidates = detectKeyHybrid(dspMono, dspRate);
  const hybrid = runHybridDetection(bpmCandidates, keyCandidates, onsetTimes);

  return {
    bpm: hybrid.bpm,
    key: hybrid.key,
    keyConfidence: hybrid.keyConfidence,
    bpmConfidence: hybrid.bpmConfidence,
    meta: {
      bpmCandidates: hybrid.bpmCandidates,
      keyCandidates: hybrid.keyCandidates,
      durationSec,
      onsetTimes: compactOnsetTimesForMeta(onsetTimes),
    },
  };
}

async function loadAnalysisSource(file: File): Promise<{
  mono: Float32Array;
  sampleRate: number;
  durationSec: number;
  audioBuffer?: AudioBuffer;
}> {
  if (isWavFile(file) && file.size > PARTIAL_WAV_THRESHOLD_BYTES) {
    const partial = await readWavMonoPartial(file, WAV_PARTIAL_READ_SEC);
    return partial;
  }

  const audioBuffer = await decodeAudioFile(file);
  return {
    mono: monoFromAudioBuffer(audioBuffer, WAV_PARTIAL_READ_SEC),
    sampleRate: audioBuffer.sampleRate,
    durationSec: audioBuffer.duration,
    audioBuffer,
  };
}

export async function analyzeAudioBuffer(
  audioBuffer: AudioBuffer,
  options?: { fast?: boolean },
): Promise<AudioAnalysisResult | null> {
  return analyzeMonoSamples(
    monoFromAudioBuffer(audioBuffer, WAV_PARTIAL_READ_SEC),
    audioBuffer.sampleRate,
    audioBuffer.duration,
    { fast: options?.fast, audioBuffer },
  );
}

/** Fast path: partial WAV read for large files, downsampled DSP, no beat-detector offline render. */
export async function analyzeAudioFileFast(file: File): Promise<AudioAnalysisResult | null> {
  try {
    const source = await loadAnalysisSource(file);
    return analyzeMonoSamples(source.mono, source.sampleRate, source.durationSec, {
      fast: true,
    });
  } catch (error) {
    console.warn("Client fast audio analysis failed:", error);
    return null;
  }
}

export async function analyzeAudioFile(file: File): Promise<AudioAnalysisResult | null> {
  try {
    const source = await loadAnalysisSource(file);
    return analyzeMonoSamples(source.mono, source.sampleRate, source.durationSec, {
      fast: false,
      audioBuffer: source.audioBuffer,
    });
  } catch (error) {
    console.warn("Client audio analysis failed:", error);
    return null;
  }
}
