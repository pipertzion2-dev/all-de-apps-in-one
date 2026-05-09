export async function detectBPMFromFile(file: File): Promise<number | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const bpm = await detectWithOfflineContext(audioBuffer);
    audioCtx.close();
    return bpm;
  } catch (err) {
    console.error("Browser BPM detection failed:", err);
    return null;
  }
}

async function detectWithOfflineContext(buffer: AudioBuffer): Promise<number | null> {
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;

  const offline = new OfflineAudioContext(1, buffer.length, sampleRate);
  const source = offline.createBufferSource();
  source.buffer = buffer;

  const lowpass = offline.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 100;
  lowpass.Q.value = 1;

  source.connect(lowpass);
  lowpass.connect(offline.destination);
  source.start(0);

  const filtered = await offline.startRendering();
  const data = filtered.getChannelData(0);

  const windowMs = 10;
  const windowSamples = Math.round((sampleRate * windowMs) / 1000);
  const envLength = Math.floor(data.length / windowSamples);
  const envelope = new Float32Array(envLength);
  for (let i = 0; i < envLength; i++) {
    let sum = 0;
    const start = i * windowSamples;
    for (let j = start; j < start + windowSamples && j < data.length; j++) {
      sum += data[j] * data[j];
    }
    envelope[i] = Math.sqrt(sum / windowSamples);
  }

  const envRate = 1000 / windowMs;

  let maxEnv = 0;
  for (let i = 0; i < envelope.length; i++) {
    if (envelope[i] > maxEnv) maxEnv = envelope[i];
  }
  if (maxEnv === 0) return null;

  const threshold = maxEnv * 0.3;
  const minDist = Math.round((envRate * 60) / 200);

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

  console.log(
    `BPM detect: ${peaks.length} peaks found, duration=${duration.toFixed(1)}s, threshold=${threshold.toFixed(4)}`,
  );

  if (peaks.length < 4) return null;

  const minBPM = 60,
    maxBPM = 180;
  const step = 0.5;
  const nBins = Math.round((maxBPM - minBPM) / step) + 1;
  const histogram = new Float64Array(nBins);

  for (let i = 0; i < peaks.length - 1; i++) {
    const maxJ = Math.min(i + 8, peaks.length);
    for (let j = i + 1; j < maxJ; j++) {
      const interval = (peaks[j] - peaks[i]) / envRate;

      for (let nBeats = 1; nBeats <= 8; nBeats++) {
        const beatInterval = interval / nBeats;
        const bpm = 60 / beatInterval;
        if (bpm >= minBPM && bpm <= maxBPM) {
          const bin = Math.round((bpm - minBPM) / step);
          if (bin >= 0 && bin < nBins) {
            const weight = 1.0 / nBeats;
            histogram[bin] += weight;
          }
        }
      }
    }
  }

  const smoothed = smoothHistogram(histogram, 3);

  let bestBin = 0;
  let bestVal = 0;
  for (let i = 0; i < smoothed.length; i++) {
    if (smoothed[i] > bestVal) {
      bestVal = smoothed[i];
      bestBin = i;
    }
  }

  if (bestVal === 0) return null;

  let bpm = minBPM + bestBin * step;

  if (bestBin > 0 && bestBin < smoothed.length - 1) {
    const a = smoothed[bestBin - 1];
    const b = smoothed[bestBin];
    const c = smoothed[bestBin + 1];
    const denom = 2 * (2 * b - a - c);
    if (Math.abs(denom) > 1e-10) {
      const offset = (a - c) / denom;
      bpm += offset * step;
    }
  }

  const top5: string[] = [];
  const indices = Array.from({ length: smoothed.length }, (_, i) => i);
  indices.sort((a, b) => smoothed[b] - smoothed[a]);
  for (let k = 0; k < Math.min(5, indices.length); k++) {
    const idx = indices[k];
    if (smoothed[idx] > 0) {
      top5.push(`${(minBPM + idx * step).toFixed(1)}=${smoothed[idx].toFixed(2)}`);
    }
  }
  console.log("BPM histogram top 5:", top5.join(", "));

  return Math.round(bpm);
}

function smoothHistogram(data: Float64Array, passes: number): Float64Array {
  let current = new Float64Array(data);
  for (let p = 0; p < passes; p++) {
    const next = new Float64Array(current.length);
    for (let i = 0; i < current.length; i++) {
      const lo = Math.max(0, i - 1);
      const hi = Math.min(current.length - 1, i + 1);
      next[i] = (current[lo] + current[i] * 2 + current[hi]) / 4;
    }
    current = next;
  }
  return current;
}
