"use client";

import type { AudioAnalysisSnapshot } from "./types";

export type AudioSession = {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | AudioBufferSourceNode;
  analyser: AnalyserNode;
  element?: HTMLAudioElement | HTMLVideoElement;
  stop: () => void;
};

const emptyWave = () => new Float32Array(128);

export function emptyAudioSnapshot(): AudioAnalysisSnapshot {
  return {
    bpm: null,
    energy: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    waveform: emptyWave(),
    beatGrid: [],
    reliableTempo: false,
  };
}

/** Attach Web Audio analyser to an HTML media element (actual audio data). */
export function connectMediaElement(el: HTMLAudioElement | HTMLVideoElement): AudioSession | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const source = ctx.createMediaElementSource(el);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  analyser.connect(ctx.destination);

  return {
    ctx,
    source,
    analyser,
    element: el,
    stop: () => {
      try {
        source.disconnect();
        analyser.disconnect();
        void ctx.close();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Connect microphone or other MediaStream for live input analysis. */
export function connectMediaStream(stream: MediaStream): AudioSession | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;
  source.connect(analyser);

  return {
    ctx,
    source,
    analyser,
    stop: () => {
      try {
        source.disconnect();
        analyser.disconnect();
        void ctx.close();
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
    },
  };
}

export function readAnalyserSnapshot(
  analyser: AnalyserNode,
  opts?: { bpmHint?: number | null; reliableTempo?: boolean; beatGrid?: number[] },
): AudioAnalysisSnapshot {
  const freq = new Uint8Array(analyser.frequencyBinCount);
  const wave = new Float32Array(analyser.fftSize);
  analyser.getByteFrequencyData(freq);
  analyser.getFloatTimeDomainData(wave);

  const n = freq.length;
  const third = Math.floor(n / 3);
  let bass = 0;
  let mid = 0;
  let treble = 0;
  let energy = 0;
  for (let i = 0; i < n; i++) {
    const v = (freq[i] ?? 0) / 255;
    energy += v;
    if (i < third) bass += v;
    else if (i < third * 2) mid += v;
    else treble += v;
  }
  energy /= n;
  bass /= third || 1;
  mid /= third || 1;
  treble /= Math.max(1, n - third * 2);

  // Downsample waveform for visuals
  const out = emptyWave();
  const step = Math.max(1, Math.floor(wave.length / out.length));
  for (let i = 0; i < out.length; i++) {
    out[i] = wave[i * step] ?? 0;
  }

  return {
    bpm: opts?.bpmHint ?? null,
    energy,
    bass,
    mid,
    treble,
    waveform: out,
    beatGrid: opts?.beatGrid ?? [],
    reliableTempo: Boolean(opts?.reliableTempo && opts.bpmHint),
  };
}

/**
 * Detect tempo from an AudioBuffer using web-audio-beat-detector when available.
 * Returns reliableTempo=false if detection fails.
 */
export async function detectTempoFromBuffer(
  buffer: AudioBuffer,
): Promise<{ bpm: number | null; reliableTempo: boolean; beatGrid: number[] }> {
  try {
    const mod = await import("web-audio-beat-detector");
    const guessed = await mod.guess(buffer);
    const bpm =
      typeof guessed === "number"
        ? guessed
        : guessed && typeof guessed === "object" && "bpm" in guessed
          ? Number((guessed as { bpm: number }).bpm)
          : NaN;
    if (!Number.isFinite(bpm) || bpm < 60 || bpm > 200) {
      return { bpm: null, reliableTempo: false, beatGrid: [] };
    }
    const rounded = Math.round(bpm);
    const beatSec = 60 / rounded;
    const beatGrid: number[] = [];
    for (let t = 0; t < buffer.duration; t += beatSec) {
      beatGrid.push(t);
    }
    return { bpm: rounded, reliableTempo: true, beatGrid };
  } catch {
    return { bpm: null, reliableTempo: false, beatGrid: [] };
  }
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer | null> {
  try {
    const ctx = new AudioContext();
    const ab = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(ab.slice(0));
    void ctx.close();
    return buffer;
  } catch {
    return null;
  }
}

/** Build a simple metronome beat grid from a known BPM (user-set, treated as reliable). */
export function beatGridFromBpm(bpm: number, durationSec: number): number[] {
  const step = 60 / bpm;
  const grid: number[] = [];
  for (let t = 0; t < durationSec; t += step) grid.push(t);
  return grid;
}
