const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface TempoCandidate {
  bpm: number;
  weight: number;
  source: string;
}

export interface KeyCandidate {
  key: string;
  confidence: number;
  source: string;
}

export interface HybridDetectionResult {
  bpm: number;
  bpmConfidence: number;
  key: string;
  keyConfidence: number;
  bpmCandidates: TempoCandidate[];
  keyCandidates: KeyCandidate[];
}

export interface DetectionMeta {
  bpmCandidates: TempoCandidate[];
  keyCandidates: KeyCandidate[];
  durationSec?: number;
}

function correlate(chromagram: number[], profile: number[]): number {
  const n = 12;
  let sumXY = 0,
    sumX = 0,
    sumY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += chromagram[i] * profile[i];
    sumX += chromagram[i];
    sumY += profile[i];
    sumX2 += chromagram[i] * chromagram[i];
    sumY2 += profile[i] * profile[i];
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

function fftInPlace(real: Float64Array, imag: Float64Array, n: number): void {
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let rev = 0;
    for (let j = 0; j < bits; j++) {
      rev = (rev << 1) | ((i >> j) & 1);
    }
    if (rev > i) {
      [real[i], real[rev]] = [real[rev], real[i]];
      [imag[i], imag[rev]] = [imag[rev], imag[i]];
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const angle = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < half; j++) {
        const cos = Math.cos(angle * j);
        const sin = Math.sin(angle * j);
        const tReal = real[i + j + half] * cos - imag[i + j + half] * sin;
        const tImag = real[i + j + half] * sin + imag[i + j + half] * cos;
        real[i + j + half] = real[i + j] - tReal;
        imag[i + j + half] = imag[i + j] - tImag;
        real[i + j] += tReal;
        imag[i + j] += tImag;
      }
    }
  }
}

export function toMono(
  data: Float32Array,
  channels: number,
  sampleRate: number,
  maxSeconds = 90,
): Float32Array {
  const maxSamples = Math.min(data.length, Math.floor(sampleRate * maxSeconds));
  if (channels <= 1) return data.subarray(0, maxSamples);

  const mono = new Float32Array(maxSamples);
  for (let i = 0; i < maxSamples; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) {
      sum += data[i * channels + ch] ?? data[i];
    }
    mono[i] = sum / channels;
  }
  return mono;
}

export function monoFromAudioBuffer(audioBuffer: AudioBuffer, maxSeconds = 90): Float32Array {
  const sampleRate = audioBuffer.sampleRate;
  const maxSamples = Math.min(audioBuffer.length, Math.floor(sampleRate * maxSeconds));
  const mono = new Float32Array(maxSamples);
  const channels = audioBuffer.numberOfChannels;
  for (let ch = 0; ch < channels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < maxSamples; i++) {
      mono[i] += channelData[i] / channels;
    }
  }
  return mono;
}

/** Low-pass filtered envelope peaks → onset times in seconds. */
export function extractOnsetTimes(mono: Float32Array, sampleRate: number): number[] {
  const windowMs = 10;
  const windowSamples = Math.max(1, Math.round((sampleRate * windowMs) / 1000));
  const envLength = Math.floor(mono.length / windowSamples);
  if (envLength < 8) return [];

  const envelope = new Float32Array(envLength);
  for (let i = 0; i < envLength; i++) {
    let sum = 0;
    const start = i * windowSamples;
    for (let j = start; j < start + windowSamples && j < mono.length; j++) {
      sum += mono[j] * mono[j];
    }
    envelope[i] = Math.sqrt(sum / windowSamples);
  }

  let maxEnv = 0;
  for (let i = 0; i < envelope.length; i++) {
    if (envelope[i] > maxEnv) maxEnv = envelope[i];
  }
  if (maxEnv === 0) return [];

  const envRate = 1000 / windowMs;
  const threshold = maxEnv * 0.25;
  const minDist = Math.max(1, Math.round((envRate * 60) / 220));

  const peaks: number[] = [];
  for (let i = 2; i < envelope.length - 2; i++) {
    if (
      envelope[i] > threshold &&
      envelope[i] > envelope[i - 1] &&
      envelope[i] > envelope[i - 2] &&
      envelope[i] >= envelope[i + 1] &&
      envelope[i] >= envelope[i + 2]
    ) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDist) {
        peaks.push(i);
      }
    }
  }

  return peaks.map((p) => p / envRate);
}

export function scoreTempoAlignment(onsetTimes: number[], bpm: number): number {
  if (onsetTimes.length < 4 || bpm <= 0) return 0;
  const period = 60 / bpm;
  const tolerance = period * 0.1;
  let score = 0;
  for (const t of onsetTimes) {
    const phase = (t % period) / period;
    const dist = Math.min(phase, 1 - phase) * period;
    if (dist <= tolerance) {
      score += 1 - dist / tolerance;
    }
  }
  return score / onsetTimes.length;
}

/** Median inter-onset interval → BPM hint. */
export function bpmFromOnsetIntervals(onsetTimes: number[]): number | null {
  if (onsetTimes.length < 5) return null;
  const intervals: number[] = [];
  for (let i = 1; i < onsetTimes.length; i++) {
    const dt = onsetTimes[i] - onsetTimes[i - 1];
    if (dt >= 0.2 && dt <= 2.5) intervals.push(dt);
  }
  if (intervals.length < 3) return null;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  let bpm = Math.round(60 / median);
  if (bpm < 40) bpm *= 2;
  if (bpm > 220) bpm = Math.round(bpm / 2);
  return bpm >= 40 && bpm <= 220 ? bpm : null;
}

function tempoPrior(bpm: number): number {
  if (bpm >= 80 && bpm <= 160) return 1.15;
  if (bpm >= 70 && bpm <= 180) return 1.05;
  if (bpm === 60 || bpm === 50) return 0.82;
  return 1;
}

export function fuseBpmCandidates(
  raw: TempoCandidate[],
  onsetTimes: number[],
): { bpm: number; confidence: number } {
  const expanded: TempoCandidate[] = [];
  for (const c of raw) {
    if (!Number.isFinite(c.bpm) || c.bpm <= 0) continue;
    for (const mult of [0.5, 1, 2]) {
      const bpm = Math.round(c.bpm * mult);
      if (bpm >= 40 && bpm <= 220) {
        expanded.push({
          bpm,
          weight: c.weight * (mult === 1 ? 1 : 0.9),
          source: mult === 1 ? c.source : `${c.source}×${mult}`,
        });
      }
    }
  }

  const intervalBpm = bpmFromOnsetIntervals(onsetTimes);
  if (intervalBpm) {
    expanded.push({ bpm: intervalBpm, weight: 1.1, source: "onset-interval" });
  }

  if (expanded.length === 0) {
    return { bpm: 120, confidence: 20 };
  }

  const clusters = new Map<number, { weight: number; sources: Set<string> }>();
  for (const c of expanded) {
    const anchor = Math.round(c.bpm / 2) * 2;
    let bestKey = anchor;
    let bestDist = Infinity;
    for (const key of clusters.keys()) {
      const dist = Math.abs(key - c.bpm);
      if (dist <= 3 && dist < bestDist) {
        bestDist = dist;
        bestKey = key;
      }
    }
    const entry = clusters.get(bestKey) ?? { weight: 0, sources: new Set<string>() };
    entry.weight += c.weight;
    entry.sources.add(c.source);
    clusters.set(bestKey, entry);
  }

  let bestBpm = 120;
  let bestScore = -Infinity;
  for (const [bpm, cluster] of clusters) {
    const alignment = scoreTempoAlignment(onsetTimes, bpm);
    const score =
      cluster.weight * 2 + alignment * 3 + tempoPrior(bpm) + cluster.sources.size * 0.15;
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }

  const alignment = scoreTempoAlignment(onsetTimes, bestBpm);
  const confidence = Math.min(99, Math.round(35 + bestScore * 8 + alignment * 40));
  return { bpm: bestBpm, confidence };
}

function detectKeyFromSegment(
  mono: Float32Array,
  sampleRate: number,
  start: number,
  length: number,
) {
  const fftSize = 4096;
  const chromagram = new Float64Array(12);
  const hopSize = fftSize;
  const numFrames = Math.floor((length - fftSize) / hopSize);
  if (numFrames <= 0) return { key: "C major", confidence: 30 };

  const hann = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
  }

  for (let frame = 0; frame < numFrames; frame++) {
    const offset = start + frame * hopSize;
    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      real[i] = (mono[offset + i] || 0) * hann[i];
    }
    fftInPlace(real, imag, fftSize);

    const magnitudes = new Float64Array(fftSize / 2);
    for (let i = 0; i < fftSize / 2; i++) {
      magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }

    for (let noteIdx = 0; noteIdx < 12; noteIdx++) {
      let energy = 0;
      for (let octave = 1; octave <= 7; octave++) {
        const freq = 440 * Math.pow(2, (noteIdx - 9 + (octave - 4) * 12) / 12);
        const bin = Math.round((freq * fftSize) / sampleRate);
        if (bin > 0 && bin < fftSize / 2 - 1) {
          const weight = 1.0 / octave;
          energy +=
            ((magnitudes[bin - 1] + magnitudes[bin] * 2 + magnitudes[bin + 1]) * weight) / 4;
        }
      }
      chromagram[noteIdx] += energy;
    }
  }

  const maxChroma = Math.max(...Array.from(chromagram));
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) chromagram[i] /= maxChroma;
  }

  let bestCorr = -Infinity;
  let bestKey = "C major";
  let secondBest = -Infinity;

  for (let shift = 0; shift < 12; shift++) {
    const rotated = new Array(12);
    for (let i = 0; i < 12; i++) {
      rotated[i] = chromagram[(i + shift) % 12];
    }
    const majorCorr = correlate(rotated, MAJOR_PROFILE);
    const minorCorr = correlate(rotated, MINOR_PROFILE);

    if (majorCorr > bestCorr) {
      secondBest = bestCorr;
      bestCorr = majorCorr;
      bestKey = `${NOTE_NAMES[shift]} major`;
    } else if (majorCorr > secondBest) {
      secondBest = majorCorr;
    }

    if (minorCorr > bestCorr) {
      secondBest = bestCorr;
      bestCorr = minorCorr;
      bestKey = `${NOTE_NAMES[shift]} minor`;
    } else if (minorCorr > secondBest) {
      secondBest = minorCorr;
    }
  }

  const confidence = Math.min(
    99,
    Math.max(25, Math.round(((bestCorr - secondBest) / (Math.abs(bestCorr) + 0.001)) * 200 + 50)),
  );
  return { key: bestKey, confidence };
}

export function detectKeyHybrid(mono: Float32Array, sampleRate: number): KeyCandidate[] {
  const analyzeLength = Math.min(mono.length, sampleRate * 60);
  const segmentLen = Math.floor(analyzeLength / 4);
  const offsets = [0, segmentLen, segmentLen * 2, segmentLen * 3];
  const candidates: KeyCandidate[] = [];

  for (let i = 0; i < offsets.length; i++) {
    const start = Math.floor((mono.length - analyzeLength) / 2) + offsets[i];
    const len = Math.min(segmentLen, mono.length - start);
    if (len <= 4096) continue;
    const { key, confidence } = detectKeyFromSegment(mono, sampleRate, start, len);
    candidates.push({ key, confidence, source: `segment-${i + 1}` });
  }

  if (candidates.length === 0) {
    const full = detectKeyFromSegment(mono, sampleRate, 0, mono.length);
    return [{ ...full, source: "full" }];
  }
  return candidates;
}

export function fuseKeyCandidates(candidates: KeyCandidate[]): { key: string; confidence: number } {
  if (candidates.length === 0) return { key: "C major", confidence: 30 };

  const votes = new Map<string, { weight: number; maxConf: number }>();
  for (const c of candidates) {
    const entry = votes.get(c.key) ?? { weight: 0, maxConf: 0 };
    entry.weight += c.confidence / 100;
    entry.maxConf = Math.max(entry.maxConf, c.confidence);
    votes.set(c.key, entry);
  }

  let bestKey = "C major";
  let bestScore = -Infinity;
  for (const [key, v] of votes) {
    const score = v.weight * 2 + v.maxConf / 100;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  const winner = votes.get(bestKey)!;
  const confidence = Math.min(99, Math.round(winner.maxConf * 0.7 + winner.weight * 25));
  return { key: bestKey, confidence };
}

export function detectBpmAutocorrelation(mono: Float32Array, sampleRate: number): number | null {
  const downsampleFactor = Math.max(1, Math.floor(sampleRate / 4000));
  const downsampled: number[] = [];
  for (let i = 0; i < mono.length; i += downsampleFactor) {
    let sum = 0;
    const end = Math.min(i + downsampleFactor, mono.length);
    for (let j = i; j < end; j++) sum += Math.abs(mono[j]);
    downsampled.push(sum / (end - i));
  }
  const dsRate = sampleRate / downsampleFactor;

  const diff: number[] = [];
  for (let i = 1; i < downsampled.length; i++) {
    diff.push(Math.max(0, downsampled[i] - downsampled[i - 1]));
  }

  const minBPM = 40;
  const maxBPM = 200;
  const minLag = Math.floor((dsRate * 60) / maxBPM);
  const maxLag = Math.floor((dsRate * 60) / minBPM);

  let bestLag = minLag;
  let bestCorr = -Infinity;
  for (let lag = minLag; lag <= Math.min(maxLag, diff.length / 2); lag++) {
    let corr = 0;
    const limit = Math.min(diff.length - lag, diff.length / 2);
    for (let i = 0; i < limit; i++) {
      corr += diff[i] * diff[i + lag];
    }
    corr /= limit;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  let bpm = (dsRate * 60) / bestLag;
  if (bpm < 40) bpm *= 2;
  if (bpm > 220) bpm = Math.round(bpm / 2);
  return bpm >= 40 && bpm <= 220 ? Math.round(bpm) : null;
}

export function detectBpmPeakHistogram(mono: Float32Array, sampleRate: number): number | null {
  const onsetTimes = extractOnsetTimes(mono, sampleRate);
  if (onsetTimes.length < 4) return null;

  const envRate = 100;
  const peaks = onsetTimes.map((t) => Math.round(t * envRate));

  const minBPM = 40;
  const maxBPM = 200;
  const step = 1;
  const nBins = maxBPM - minBPM + 1;
  const histogram = new Float64Array(nBins);

  for (let i = 0; i < peaks.length - 1; i++) {
    const maxJ = Math.min(i + 10, peaks.length);
    for (let j = i + 1; j < maxJ; j++) {
      const interval = (peaks[j] - peaks[i]) / envRate;
      for (let nBeats = 1; nBeats <= 8; nBeats++) {
        const beatInterval = interval / nBeats;
        const bpm = 60 / beatInterval;
        if (bpm >= minBPM && bpm <= maxBPM) {
          const bin = Math.round(bpm - minBPM);
          if (bin >= 0 && bin < nBins) {
            histogram[bin] += 1.0 / nBeats;
          }
        }
      }
    }
  }

  let bestBin = 0;
  let bestVal = 0;
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] > bestVal) {
      bestVal = histogram[i];
      bestBin = i;
    }
  }
  if (bestVal === 0) return null;
  return minBPM + bestBin;
}

export function runHybridDetection(
  bpmCandidates: TempoCandidate[],
  keyCandidates: KeyCandidate[],
  onsetTimes: number[],
): HybridDetectionResult {
  const { bpm, confidence: bpmConfidence } = fuseBpmCandidates(bpmCandidates, onsetTimes);
  const { key, confidence: keyConfidence } = fuseKeyCandidates(keyCandidates);
  return {
    bpm,
    bpmConfidence,
    key,
    keyConfidence,
    bpmCandidates,
    keyCandidates,
  };
}
