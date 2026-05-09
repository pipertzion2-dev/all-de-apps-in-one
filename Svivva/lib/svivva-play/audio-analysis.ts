const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  keyConfidence: number;
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

function detectKey(audioBuffer: AudioBuffer): { key: string; confidence: number } {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  const analyzeLength = Math.min(mono.length, sampleRate * 60);
  const startOffset = Math.floor((mono.length - analyzeLength) / 2);

  const offlineCtx = typeof OfflineAudioContext !== "undefined" ? null : null;

  const fftSize = 4096;
  const chromagram = new Float64Array(12);
  const hopSize = fftSize;
  const numFrames = Math.floor((analyzeLength - fftSize) / hopSize);

  const hann = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
  }

  for (let frame = 0; frame < numFrames; frame++) {
    const offset = startOffset + frame * hopSize;
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
    Math.max(30, Math.round(((bestCorr - secondBest) / (Math.abs(bestCorr) + 0.001)) * 200 + 50)),
  );

  return { key: bestKey, confidence };
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

export async function detectBPMFromBuffer(audioBuffer: AudioBuffer): Promise<number> {
  try {
    const { analyze } = await import("web-audio-beat-detector");
    const bpm = await analyze(audioBuffer);
    return Math.round(bpm);
  } catch (err) {
    console.warn("web-audio-beat-detector failed, using fallback:", err);
    return detectBPMFallback(audioBuffer);
  }
}

function detectBPMFallback(audioBuffer: AudioBuffer): number {
  const sampleRate = audioBuffer.sampleRate;
  const data = audioBuffer.getChannelData(0);

  const downsampleFactor = Math.floor(sampleRate / 4000);
  const downsampled: number[] = [];
  for (let i = 0; i < data.length; i += downsampleFactor) {
    let sum = 0;
    const end = Math.min(i + downsampleFactor, data.length);
    for (let j = i; j < end; j++) sum += Math.abs(data[j]);
    downsampled.push(sum / (end - i));
  }
  const dsRate = sampleRate / downsampleFactor;

  const diff: number[] = [];
  for (let i = 1; i < downsampled.length; i++) {
    diff.push(Math.max(0, downsampled[i] - downsampled[i - 1]));
  }

  const minBPM = 60;
  const maxBPM = 180;
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
  if (bpm < 60) bpm *= 2;
  if (bpm > 180) bpm /= 2;

  return Math.round(bpm);
}

export async function analyzeAudio(audioBuffer: AudioBuffer): Promise<AudioAnalysisResult> {
  const bpm = await detectBPMFromBuffer(audioBuffer);
  const { key, confidence } = detectKey(audioBuffer);
  return { bpm, key, keyConfidence: confidence };
}
