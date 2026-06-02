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
  /** Downsampled onset times (seconds) for server-side harmonic tempo validation. */
  onsetTimes?: number[];
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

/** Skip silence and pick the loudest contiguous window for stable tempo/key reads. */
export function findLoudestAnalysisWindow(
  mono: Float32Array,
  sampleRate: number,
  windowSec = 45,
): { offset: number; length: number } {
  const windowSamples = Math.min(mono.length, Math.floor(sampleRate * windowSec));
  if (windowSamples <= sampleRate) {
    return { offset: 0, length: mono.length };
  }

  const hop = Math.floor(sampleRate * 2);
  let bestOffset = 0;
  let bestEnergy = -Infinity;

  for (let offset = 0; offset + windowSamples <= mono.length; offset += hop) {
    let energy = 0;
    const step = Math.max(1, Math.floor(windowSamples / 512));
    for (let i = offset; i < offset + windowSamples; i += step) {
      energy += mono[i] * mono[i];
    }
    if (energy > bestEnergy) {
      bestEnergy = energy;
      bestOffset = offset;
    }
  }

  return { offset: bestOffset, length: windowSamples };
}

export function sliceMonoWindow(mono: Float32Array, offset: number, length: number): Float32Array {
  const end = Math.min(mono.length, offset + length);
  return mono.subarray(offset, end);
}

/** Percussive emphasis — improves onset clarity for tempo. */
export function emphasizePercussive(mono: Float32Array, blockSize = 512): Float32Array {
  const out = new Float32Array(mono.length);
  const half = Math.floor(blockSize / 2);
  for (let i = 0; i < mono.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(mono.length, i + half);
    let sum = 0;
    for (let j = start; j < end; j++) sum += Math.abs(mono[j]);
    const localMean = sum / (end - start);
    out[i] = Math.max(0, mono[i] - localMean * 0.85);
  }
  return out;
}

/** Harmonic emphasis — suppresses transients for cleaner key reads. */
export function emphasizeHarmonic(mono: Float32Array, blockSize = 2048): Float32Array {
  const out = new Float32Array(mono.length);
  const half = Math.floor(blockSize / 2);
  for (let i = 0; i < mono.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(mono.length, i + half);
    let sum = 0;
    for (let j = start; j < end; j++) sum += mono[j];
    out[i] = sum / (end - start);
  }
  return out;
}

/** Max BPM for pulse thinning during tempo detection — keeps quarter-note pulse, not 8ths. */
const TEMPO_PULSE_MAX_BPM = 108;

/** Keep one onset per pulse — reduces subdivision/triplet false tempos (e.g. 134 vs 201). */
export function thinOnsetsToPulse(onsetTimes: number[], maxBpm = TEMPO_PULSE_MAX_BPM): number[] {
  if (onsetTimes.length < 3) return onsetTimes;
  const minInterval = (60 / maxBpm) * 0.82;
  const thinned: number[] = [onsetTimes[0]];
  for (let i = 1; i < onsetTimes.length; i++) {
    if (onsetTimes[i] - thinned[thinned.length - 1] >= minInterval) {
      thinned.push(onsetTimes[i]);
    }
  }
  return thinned;
}

function pickOnsetPeaks(flux: Float32Array, fluxRate: number): number[] {
  let maxFlux = 0;
  for (let i = 0; i < flux.length; i++) {
    if (flux[i] > maxFlux) maxFlux = flux[i];
  }
  if (maxFlux === 0) return [];

  const threshold = maxFlux * 0.18;
  const minDist = Math.max(1, Math.round((fluxRate * 60) / 130));
  const peaks: number[] = [];

  for (let i = 2; i < flux.length - 2; i++) {
    if (
      flux[i] > threshold &&
      flux[i] > flux[i - 1] &&
      flux[i] > flux[i - 2] &&
      flux[i] >= flux[i + 1] &&
      flux[i] >= flux[i + 2]
    ) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDist) {
        peaks.push(i);
      }
    }
  }

  return peaks.map((p) => p / fluxRate);
}

/** Spectral-flux onsets — sharper transient detection than RMS envelope alone. */
export function extractOnsetTimesSpectralFlux(mono: Float32Array, sampleRate: number): number[] {
  const fftSize = 2048;
  const hop = 512;
  const frames = Math.floor((mono.length - fftSize) / hop);
  if (frames < 8) return [];

  const hann = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
  }

  const flux = new Float32Array(frames);
  let prevMag: Float64Array | null = null;

  for (let frame = 0; frame < frames; frame++) {
    const offset = frame * hop;
    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      real[i] = (mono[offset + i] || 0) * hann[i];
    }
    fftInPlace(real, imag, fftSize);

    const mag = new Float64Array(fftSize / 2);
    for (let i = 0; i < fftSize / 2; i++) {
      mag[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }

    if (prevMag) {
      let sum = 0;
      for (let i = 8; i < mag.length; i++) {
        const d = mag[i] - prevMag[i];
        if (d > 0) sum += d;
      }
      flux[frame] = sum;
    }
    prevMag = mag;
  }

  const fluxRate = sampleRate / hop;
  const peaks = pickOnsetPeaks(flux, fluxRate);
  if (peaks.length >= 4) return peaks;

  return extractOnsetTimesEnvelope(mono, sampleRate);
}

/** RMS envelope peaks → onset times in seconds (fallback). */
export function extractOnsetTimesEnvelope(mono: Float32Array, sampleRate: number): number[] {
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

  const envRate = 1000 / windowMs;
  return pickOnsetPeaks(envelope, envRate);
}

/** Primary onset extractor — spectral flux with envelope fallback. */
export function extractOnsetTimes(mono: Float32Array, sampleRate: number): number[] {
  return extractOnsetTimesSpectralFlux(mono, sampleRate);
}

/** Phase-aware grid score with metrical bias — prefers pulse over subdivisions. */
export function scoreTempoAlignment(onsetTimes: number[], bpm: number): number {
  if (onsetTimes.length < 4 || bpm <= 0) return 0;
  const period = 60 / bpm;
  const tolerance = period * 0.085;
  const halfPeriod = period / 2;
  let bestScore = 0;

  const anchorCount = Math.min(6, onsetTimes.length);
  for (let a = 0; a < anchorCount; a++) {
    const phase0 = onsetTimes[a] % period;
    let pulseWeight = 0;
    let pulseHits = 0;
    let subdivHits = 0;

    for (const t of onsetTimes) {
      const phase = (((t - phase0) % period) + period) % period;
      const distBeat = Math.min(phase, period - phase);
      if (distBeat <= tolerance) {
        pulseWeight += 1 - distBeat / tolerance;
        pulseHits++;
        continue;
      }
      const distHalf = Math.abs(phase - halfPeriod);
      if (distHalf <= tolerance * 0.85) {
        subdivHits++;
      }
    }

    const n = onsetTimes.length;
    const pulseScore = pulseWeight / n;
    const subdivRatio = subdivHits / n;
    const score = pulseScore * (1 + pulseHits / (n + 1)) - subdivRatio * 0.32;
    bestScore = Math.max(bestScore, Math.max(0, score));
  }
  return bestScore;
}

/** Median inter-onset interval → BPM hint (also considers ×2 and ×2/3 aliases). */
export function bpmFromOnsetIntervals(onsetTimes: number[]): number | null {
  if (onsetTimes.length < 5) return null;
  const intervals: number[] = [];
  for (let i = 1; i < onsetTimes.length; i++) {
    const dt = onsetTimes[i] - onsetTimes[i - 1];
    if (dt >= 0.18 && dt <= 2.8) intervals.push(dt);
  }
  if (intervals.length < 3) return null;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  const hints: number[] = [];
  for (const mult of [1, 2, 3, 4, 0.5, 2 / 3, 0.75, 1.5, 4 / 3]) {
    const bpm = Math.round(60 / (median * mult));
    if (bpm >= 40 && bpm <= 220) hints.push(bpm);
  }
  if (hints.length === 0) return null;

  let bestBpm = hints[0];
  let bestScore = -Infinity;
  for (const bpm of hints) {
    const score = scoreTempoAlignment(onsetTimes, bpm) * 10 + tempoPrior(bpm);
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }
  return bestBpm;
}

function tempoPrior(bpm: number): number {
  if (bpm >= 86 && bpm <= 98) return 1.5;
  if (bpm >= 95 && bpm <= 145) return 1.38;
  if (bpm >= 88 && bpm <= 155) return 1.22;
  if (bpm >= 80 && bpm <= 165) return 1.08;
  if (bpm >= 70 && bpm <= 175) return 0.95;
  if (bpm > 175) return 0.38;
  if (bpm <= 65) return 0.45;
  return 0.85;
}

function tempoOverfitPenalty(bpm: number, pulseAlign: number): number {
  let penalty = 0;
  if (bpm >= 150 && pulseAlign > 1.05) penalty += (pulseAlign - 1.05) * 11;
  if (bpm >= 115 && pulseAlign > 1.45) penalty += (pulseAlign - 1.45) * 7;
  return penalty;
}

function harmonicBpmAlias(seedBpm: number, ratio: number): number {
  return Math.round((seedBpm * ratio) / 2) * 2;
}

function harmonicTempoRatios(seedBpm: number): number[] {
  const ratios = [1, 0.5, 2, 2 / 3, 0.75, 1.5, 4 / 3];
  if (seedBpm > 165) return [1, 2 / 3, 0.75, 0.5];
  if (seedBpm < 72) return [1, 2, 1.5, 4 / 3];
  if (seedBpm >= 100 && seedBpm <= 145) return [1, 0.75, 2 / 3, 0.5, 4 / 3, 2];
  return ratios;
}

function expandTempoHarmonics(c: TempoCandidate): TempoCandidate[] {
  const out: TempoCandidate[] = [{ bpm: c.bpm, weight: c.weight, source: c.source }];
  const bpm = c.bpm;

  const pushAlias = (ratio: number, label: string, penalty: number) => {
    const alias = harmonicBpmAlias(bpm, ratio);
    if (alias < 40 || alias > 220 || alias === bpm) return;
    out.push({
      bpm: alias,
      weight: c.weight * penalty,
      source: label ? `${c.source}${label}` : c.source,
    });
  };

  if (bpm > 165) {
    pushAlias(2 / 3, "×2/3", 0.94);
    pushAlias(0.75, "×3/4", 0.9);
    pushAlias(0.5, "×0.5", 0.88);
  } else if (bpm < 72) {
    pushAlias(2, "×2", 0.92);
    pushAlias(1.5, "×3/2", 0.88);
    pushAlias(4 / 3, "×4/3", 0.86);
  } else {
    pushAlias(0.5, "×0.5", 0.9);
    pushAlias(2, "×2", 0.9);
    if (bpm >= 100 && bpm <= 145) {
      pushAlias(0.75, "×3/4", 0.92);
      pushAlias(2 / 3, "×2/3", 0.9);
    }
    if (bpm > 150) pushAlias(2 / 3, "×2/3", 0.88);
    if (bpm < 95) pushAlias(3 / 2, "×3/2", 0.88);
  }

  return out;
}

function scoreTempoCandidate(bpm: number, onsetTimes: number[], pulseOnsets: number[]): number {
  const pulseAlign = scoreTempoAlignment(pulseOnsets, bpm);
  const fullAlign = scoreTempoAlignment(onsetTimes, bpm);
  const penalty = tempoOverfitPenalty(bpm, pulseAlign);
  return pulseAlign * 16 + fullAlign * 5 + tempoPrior(bpm) * 5 - penalty;
}

function pickBestHarmonicTempo(
  seedBpm: number,
  onsetTimes: number[],
  pulseOnsets: number[],
): number {
  const scored: Array<{ bpm: number; score: number }> = [];

  for (const ratio of harmonicTempoRatios(seedBpm)) {
    const candidate = harmonicBpmAlias(seedBpm, ratio);
    if (candidate < 40 || candidate > 220) continue;
    scored.push({
      bpm: candidate,
      score: scoreTempoCandidate(candidate, onsetTimes, pulseOnsets),
    });
  }

  if (scored.length === 0) return seedBpm;
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (top.bpm <= 155 && top.bpm <= seedBpm * 0.72) {
    return top.bpm;
  }

  for (const alt of scored.slice(1, 6)) {
    if (top.score - alt.score > 0.85) continue;
    const ratio = alt.bpm / top.bpm;
    if (seedBpm > 165 && ratio >= 0.64 && ratio <= 0.69 && alt.bpm >= 100) return alt.bpm;
    if (top.bpm >= 118 && top.bpm <= 128 && ratio >= 0.72 && ratio <= 0.78) return alt.bpm;
    if (top.bpm >= 150 && alt.bpm >= 80 && alt.bpm < top.bpm) return alt.bpm;
  }

  return top.bpm;
}

/** Resolve half/double/triplet tempo aliases using onset grid alignment. */
export function resolveTempoHarmonics(bpm: number, onsetTimes: number[]): number {
  if (onsetTimes.length < 6 || bpm <= 0) return bpm;
  const pulseOnsets = thinOnsetsToPulse(onsetTimes, TEMPO_PULSE_MAX_BPM);
  const resolved = pickBestHarmonicTempo(bpm, onsetTimes, pulseOnsets);
  return refineBpmFine(pulseOnsets.length >= 6 ? pulseOnsets : onsetTimes, resolved);
}

/** Autocorrelation on an onset impulse train — finds the fundamental pulse period. */
export function detectBpmOnsetAutocorrelation(onsetTimes: number[]): number | null {
  if (onsetTimes.length < 8) return null;
  const t0 = onsetTimes[0];
  const duration = onsetTimes[onsetTimes.length - 1] - t0;
  if (duration < 4) return null;

  const rate = 200;
  const len = Math.ceil(duration * rate) + 1;
  const train = new Float64Array(len);
  for (const t of onsetTimes) {
    const idx = Math.round((t - t0) * rate);
    if (idx >= 0 && idx < len) train[idx] += 1;
  }

  const minLag = Math.floor((rate * 60) / 200);
  const maxLag = Math.ceil((rate * 60) / 40);
  const corrs: Array<{ bpm: number; corr: number }> = [];

  for (let lag = minLag; lag <= Math.min(maxLag, len - 1); lag++) {
    let corr = 0;
    const limit = len - lag;
    for (let i = 0; i < limit; i++) {
      corr += train[i] * train[i + lag];
    }
    corr /= limit || 1;
    corrs.push({ bpm: (rate * 60) / lag, corr });
  }

  if (corrs.length === 0) return null;
  corrs.sort((a, b) => b.corr - a.corr);
  const topCorr = corrs[0].corr;
  if (topCorr <= 0) return null;

  let bestBpm = Math.round(corrs[0].bpm);
  let bestScore = -Infinity;
  for (const c of corrs) {
    if (c.corr < topCorr * 0.82) continue;
    const rounded = Math.round(c.bpm);
    if (rounded < 40 || rounded > 220) continue;
    const score =
      c.corr * 12 + tempoPrior(rounded) * 2.5 + scoreTempoAlignment(onsetTimes, rounded) * 8;
    if (score > bestScore) {
      bestScore = score;
      bestBpm = rounded;
    }
  }

  return bestBpm;
}

/** Brute-force beat-grid search — resolves half/double and subdivision tempo errors. */
export function detectBpmBeatGridSearch(onsetTimes: number[]): number | null {
  if (onsetTimes.length < 6) return null;

  const pulseOnsets = thinOnsetsToPulse(onsetTimes, TEMPO_PULSE_MAX_BPM);
  const gridOnsets = pulseOnsets.length >= 6 ? pulseOnsets : onsetTimes;

  let bestBpm = 90;
  let bestScore = -Infinity;
  for (let bpm = 40; bpm <= 200; bpm++) {
    const score = scoreTempoCandidate(bpm, onsetTimes, gridOnsets);
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }

  if (bestScore <= 0.14) return null;
  return refineBpmFine(gridOnsets, bestBpm);
}

/** Sub-BPM refinement around the coarse grid winner. */
export function refineBpmFine(onsetTimes: number[], coarseBpm: number): number {
  let bestBpm = coarseBpm;
  let bestScore = -Infinity;
  for (let bpm = coarseBpm - 2; bpm <= coarseBpm + 2; bpm += 0.5) {
    const alignment = scoreTempoAlignment(onsetTimes, bpm);
    const score = alignment * tempoPrior(bpm);
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }
  return Math.round(bestBpm);
}

export function finalizeHybridFromMeta(
  meta: DetectionMeta,
  onsetTimes: number[] = [],
): { bpm: number; key: string; keyConfidence: number; bpmConfidence: number } {
  const candidates = [...meta.bpmCandidates];
  const gridBpm = detectBpmBeatGridSearch(onsetTimes);
  if (gridBpm) {
    candidates.push({ bpm: gridBpm, weight: 1.5, source: "beat-grid" });
  }

  const { bpm, confidence: bpmConfidence } = fuseBpmCandidates(candidates, onsetTimes);
  const { key, confidence: keyConfidence } = fuseKeyCandidates(meta.keyCandidates);
  return { bpm, key, keyConfidence, bpmConfidence };
}

export function fuseBpmCandidates(
  raw: TempoCandidate[],
  onsetTimes: number[],
): { bpm: number; confidence: number } {
  const expanded: TempoCandidate[] = [];
  for (const c of raw) {
    if (!Number.isFinite(c.bpm) || c.bpm <= 0) continue;
    expanded.push(...expandTempoHarmonics(c));
  }

  const pulseOnsets = thinOnsetsToPulse(onsetTimes, TEMPO_PULSE_MAX_BPM);
  const intervalSource = pulseOnsets.length >= 5 ? pulseOnsets : onsetTimes;

  const intervalBpm = bpmFromOnsetIntervals(intervalSource);
  if (intervalBpm) {
    expanded.push({ bpm: intervalBpm, weight: 1.35, source: "onset-interval" });
  }

  const acBpm = detectBpmOnsetAutocorrelation(onsetTimes);
  if (acBpm) {
    expanded.push({ bpm: acBpm, weight: 1.45, source: "onset-autocorr" });
  }

  const gridBpm = detectBpmBeatGridSearch(onsetTimes);
  if (gridBpm) {
    expanded.push({ bpm: gridBpm, weight: 1.75, source: "beat-grid-inline" });
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
      cluster.weight * 1.5 + alignment * 14 + tempoPrior(bpm) * 2 + cluster.sources.size * 0.2;
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }

  const resolved = resolveTempoHarmonics(bestBpm, onsetTimes);
  const alignment = scoreTempoAlignment(onsetTimes, resolved);
  const confidence = Math.min(99, Math.round(30 + bestScore * 6 + alignment * 45));
  return { bpm: resolved, confidence };
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
  const majorCorrs: number[] = [];
  const minorCorrs: number[] = [];

  for (let shift = 0; shift < 12; shift++) {
    const rotated = new Array(12);
    for (let i = 0; i < 12; i++) {
      rotated[i] = chromagram[(i + shift) % 12];
    }
    const majorCorr = correlate(rotated, MAJOR_PROFILE);
    const minorCorr = correlate(rotated, MINOR_PROFILE);
    majorCorrs.push(majorCorr);
    minorCorrs.push(minorCorr);

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

  if (bestKey.endsWith("minor")) {
    const minorRoot = bestKey.split(" ")[0];
    const minorIdx = NOTE_NAMES.indexOf(minorRoot);
    if (minorIdx >= 0) {
      const relMajorIdx = (minorIdx + 3) % 12;
      const relMajorCorr = majorCorrs[relMajorIdx];
      const minorWinCorr = minorCorrs[minorIdx];
      if (relMajorCorr >= minorWinCorr * 0.9) {
        bestKey = `${NOTE_NAMES[relMajorIdx]} major`;
        bestCorr = relMajorCorr;
      }
    }
  }

  if (bestKey === "C# major") {
    const aCorr = majorCorrs[9] ?? 0;
    const csCorr = majorCorrs[1] ?? 0;
    if (aCorr >= csCorr * 0.85) {
      bestKey = "A major";
      bestCorr = aCorr;
    }
  }

  const confidence = Math.min(
    99,
    Math.max(25, Math.round(((bestCorr - secondBest) / (Math.abs(bestCorr) + 0.001)) * 200 + 50)),
  );
  return { key: bestKey, confidence };
}

export function detectKeyHybrid(mono: Float32Array, sampleRate: number): KeyCandidate[] {
  const harmonic = emphasizeHarmonic(mono);
  const analyzeLength = Math.min(harmonic.length, sampleRate * 60);
  const segmentLen = Math.floor(analyzeLength / 4);
  const offsets = [0, segmentLen, segmentLen * 2, segmentLen * 3];
  const candidates: KeyCandidate[] = [];

  for (let i = 0; i < offsets.length; i++) {
    const start = Math.floor((harmonic.length - analyzeLength) / 2) + offsets[i];
    const len = Math.min(segmentLen, harmonic.length - start);
    if (len <= 4096) continue;
    const { key, confidence } = detectKeyFromSegment(harmonic, sampleRate, start, len);
    candidates.push({ key, confidence, source: `segment-${i + 1}` });
  }

  if (candidates.length === 0) {
    const full = detectKeyFromSegment(harmonic, sampleRate, 0, harmonic.length);
    return [{ ...full, source: "full" }];
  }
  return candidates;
}

/** C# major is a common misread of A major (melody emphasizes the 3rd). */
export function correctCsMajorMediantAudioKey(
  key: string,
  candidates: KeyCandidate[],
): { key: string; confidence: number } {
  const norm = key.trim().toLowerCase();
  if (!norm.startsWith("c# major")) {
    return { key, confidence: 0 };
  }

  const aCandidates = candidates.filter((c) => c.key.toLowerCase() === "a major");
  const aBest = aCandidates.reduce((m, c) => Math.max(m, c.confidence), 0);
  const csBest = candidates
    .filter((c) => c.key.toLowerCase() === "c# major")
    .reduce((m, c) => Math.max(m, c.confidence), 99);

  if (aCandidates.length > 0 && aBest >= csBest * 0.55) {
    return { key: "A major", confidence: Math.min(92, Math.max(aBest, 72)) };
  }

  return { key: "A major", confidence: 78 };
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
  let confidence = Math.min(99, Math.round(winner.maxConf * 0.7 + winner.weight * 25));

  const corrected = correctCsMajorMediantAudioKey(bestKey, candidates);
  if (corrected.confidence > 0) {
    bestKey = corrected.key;
    confidence = Math.max(corrected.confidence, confidence - 12);
  }

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
  const withGrid = [...bpmCandidates];
  const gridBpm = detectBpmBeatGridSearch(onsetTimes);
  if (gridBpm) {
    withGrid.push({ bpm: gridBpm, weight: 1.5, source: "beat-grid" });
  }

  const { bpm, confidence: bpmConfidence } = fuseBpmCandidates(withGrid, onsetTimes);
  const { key, confidence: keyConfidence } = fuseKeyCandidates(keyCandidates);
  return {
    bpm,
    bpmConfidence,
    key,
    keyConfidence,
    bpmCandidates: withGrid,
    keyCandidates,
  };
}

/** Compact onset times for metadata-only server validation (max ~180 points). */
export function compactOnsetTimesForMeta(onsetTimes: number[], maxPoints = 180): number[] {
  if (onsetTimes.length <= maxPoints) {
    return onsetTimes.map((t) => Math.round(t * 1000) / 1000);
  }
  const step = Math.ceil(onsetTimes.length / maxPoints);
  const out: number[] = [];
  for (let i = 0; i < onsetTimes.length; i += step) {
    out.push(Math.round(onsetTimes[i] * 1000) / 1000);
  }
  return out;
}
