import { buildChordTimeline, type ChordSegment } from "./chord-from-chroma";
import { emphasizeHarmonic, monoFromAudioBuffer } from "./tempo-key-core";

export interface TranscribedNote {
  midi: number;
  startSec: number;
  endSec: number;
  velocity: number;
  /** Fine pitch deviation in cents from equal temperament. */
  cents: number;
}

export interface AudioTranscription {
  notes: TranscribedNote[];
  chords: ChordSegment[];
  waveformPeaks: number[];
  durationSec: number;
}

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

function detectPitchHz(frame: Float32Array, sampleRate: number): number | null {
  const minHz = 65;
  const maxHz = 1200;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.floor(sampleRate / minHz), frame.length - 1);
  if (maxLag <= minLag) return null;

  let bestLag = minLag;
  let bestCorr = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const limit = frame.length - lag;
    for (let i = 0; i < limit; i++) {
      corr += frame[i] * frame[i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestCorr < 1e-6) return null;
  return sampleRate / bestLag;
}

function buildChromaFrame(frame: Float32Array, sampleRate: number, fftSize: number): Float64Array {
  const chroma = new Float64Array(12);
  const real = new Float64Array(fftSize);
  const imag = new Float64Array(fftSize);
  const hann = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    real[i] = (frame[i] ?? 0) * hann[i];
  }
  fftInPlace(real, imag, fftSize);
  for (let noteIdx = 0; noteIdx < 12; noteIdx++) {
    let energy = 0;
    for (let octave = 2; octave <= 6; octave++) {
      const freq = 440 * Math.pow(2, (noteIdx - 9 + (octave - 4) * 12) / 12);
      const bin = Math.round((freq * fftSize) / sampleRate);
      if (bin > 0 && bin < fftSize / 2) {
        const mag = Math.hypot(real[bin], imag[bin]);
        energy += mag / octave;
      }
    }
    chroma[noteIdx] = energy;
  }
  const max = Math.max(...Array.from(chroma));
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

function fftInPlace(real: Float64Array, imag: Float64Array, n: number): void {
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let rev = 0;
    for (let j = 0; j < bits; j++) rev = (rev << 1) | ((i >> j) & 1);
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

function buildWaveformPeaks(mono: Float32Array, buckets: number): number[] {
  const peaks: number[] = [];
  const block = Math.max(1, Math.floor(mono.length / buckets));
  for (let b = 0; b < buckets; b++) {
    const start = b * block;
    const end = Math.min(mono.length, start + block);
    let peak = 0;
    for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(mono[i]));
    peaks.push(peak);
  }
  const max = Math.max(...peaks, 1e-6);
  return peaks.map((p) => p / max);
}

/** Melodyne-style monophonic pitch track + bar-aligned chord timeline from audio. */
export function transcribeMono(
  mono: Float32Array,
  sampleRate: number,
  bpm: number,
  key: string,
  maxDurationSec = 120,
): AudioTranscription {
  const maxSamples = Math.min(mono.length, Math.floor(sampleRate * maxDurationSec));
  const work = mono.subarray(0, maxSamples);
  const durationSec = maxSamples / sampleRate;
  const harmonic = emphasizeHarmonic(work, 2048);

  const hop = Math.floor(sampleRate * 0.023);
  const frameSize = 2048;
  const notes: TranscribedNote[] = [];
  const chromaFrames: Float64Array[] = [];
  const frameTimes: number[] = [];

  let activeMidi: number | null = null;
  let activeStart = 0;
  let activeVel = 72;
  let activeCents = 0;
  let silenceFrames = 0;

  const closeNote = (endSec: number) => {
    if (activeMidi == null) return;
    const dur = endSec - activeStart;
    if (dur >= 0.06) {
      notes.push({
        midi: activeMidi,
        startSec: activeStart,
        endSec,
        velocity: activeVel,
        cents: activeCents,
      });
    }
    activeMidi = null;
  };

  for (let offset = 0; offset + frameSize < harmonic.length; offset += hop) {
    const t = offset / sampleRate;
    const frame = harmonic.subarray(offset, offset + frameSize);
    const rms = Math.sqrt(frame.reduce((s, v) => s + v * v, 0) / frame.length);
    chromaFrames.push(buildChromaFrame(frame, sampleRate, frameSize));
    frameTimes.push(t);

    if (rms < 0.012) {
      silenceFrames++;
      if (silenceFrames >= 3) closeNote(t);
      continue;
    }
    silenceFrames = 0;

    const hz = detectPitchHz(frame, sampleRate);
    if (!hz || hz < 65 || hz > 1400) {
      closeNote(t);
      continue;
    }

    const midi = Math.round(hzToMidi(hz));
    const cents = Math.round((hzToMidi(hz) - midi) * 100);
    const vel = Math.min(110, Math.max(42, Math.round(50 + rms * 400)));

    if (activeMidi != null && Math.abs(midi - activeMidi) > 1) {
      closeNote(t);
    }
    if (activeMidi == null) {
      activeMidi = midi;
      activeStart = t;
      activeVel = vel;
      activeCents = cents;
    } else {
      activeVel = Math.round(activeVel * 0.7 + vel * 0.3);
    }
  }
  closeNote(durationSec);

  const chords = buildChordTimeline(chromaFrames, frameTimes, bpm, key, durationSec);
  const waveformPeaks = buildWaveformPeaks(work, 320);

  return { notes, chords, waveformPeaks, durationSec };
}

/** Decode audio for duration + waveform only — no pitch/key/tempo analysis. */
export async function probeAudioFile(file: File): Promise<AudioTranscription | null> {
  try {
    const buf = await file.arrayBuffer();
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : null;
    if (!Ctx) return null;
    const ctx = new Ctx();
    try {
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      const mono = monoFromAudioBuffer(decoded, 120);
      const maxSamples = Math.min(mono.length, Math.floor(decoded.sampleRate * 120));
      const work = mono.subarray(0, maxSamples);
      const durationSec = decoded.duration;
      const waveformPeaks = buildWaveformPeaks(work, 320);
      return { notes: [], chords: [], waveformPeaks, durationSec };
    } finally {
      await ctx.close().catch(() => {});
    }
  } catch {
    return null;
  }
}

export async function transcribeAudioFile(
  file: File,
  bpm: number,
  key: string,
): Promise<AudioTranscription | null> {
  try {
    const buf = await file.arrayBuffer();
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : null;
    if (!Ctx) return null;
    const ctx = new Ctx();
    try {
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      const mono = monoFromAudioBuffer(decoded, 120);
      return transcribeMono(mono, decoded.sampleRate, bpm, key);
    } finally {
      await ctx.close().catch(() => {});
    }
  } catch {
    return null;
  }
}

export function transcriptionToMidiEvents(
  notes: TranscribedNote[],
  bpm: number,
  offsetSec = 0,
): { note: number; velocity: number; startBeat: number; duration: number }[] {
  const beatSec = 60 / bpm;
  return notes.map((n) => ({
    note: n.midi,
    velocity: n.velocity,
    startBeat: Math.max(0, (n.startSec + offsetSec) / beatSec),
    duration: Math.max(0.05, (n.endSec - n.startSec) / beatSec),
  }));
}

/** Merge audio transcription with higher-confidence MIDI when both are present. */
export function mergeTranscriptionWithMidi(
  audio: AudioTranscription,
  midiNotes: TranscribedNote[],
  midiOffsetSec: number,
): AudioTranscription {
  const shifted = midiNotes.map((n) => ({
    ...n,
    startSec: n.startSec + midiOffsetSec,
    endSec: n.endSec + midiOffsetSec,
  }));
  const notes = shifted.length >= audio.notes.length * 0.5 ? shifted : [...audio.notes, ...shifted];
  notes.sort((a, b) => a.startSec - b.startSec);
  return {
    ...audio,
    notes,
    chords: audio.chords.length ? audio.chords : [],
  };
}
