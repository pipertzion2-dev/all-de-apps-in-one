/**
 * AI V-2 melody, ghost-note, and rapid-fire layers for hocket voices.
 */
import type { ScaleResolution } from "./reich-engine";

export type HocketMidiNote = {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
};

class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    this.s = (this.s * 1664525 + 1013904223) >>> 0;
    return this.s / 0xffffffff;
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }
}

export type HocketMelodicStyle = "reich_cells" | "shaw_phrases" | "minimalist_ostinato";

function degreeToMidi(rootPc: number, pitchClasses: number[], degree: number, octave: number): number {
  const pc = (rootPc + (pitchClasses[degree % pitchClasses.length] ?? 0)) % 12;
  return 12 * octave + pc;
}

/** Per-voice melodic walks (V-2 generate_melody_notes). */
export function buildV2HocketMelodyNotes(
  slotPattern: number[][],
  scale: ScaleResolution,
  gridBeats: number,
  seed: number,
): HocketMidiNote[][] {
  const rng = new Rng(seed ^ 0xfa1afe1);
  const melodicStyle = rng.choice([
    "reich_cells",
    "shaw_phrases",
    "minimalist_ostinato",
  ] as HocketMelodicStyle[]);
  const pcs = scale.pitchClasses.length ? scale.pitchClasses : [0, 2, 4, 5, 7, 9, 11];
  const numVoices = slotPattern.length;
  const voices: HocketMidiNote[][] = Array.from({ length: numVoices }, () => []);
  const previousDegree = new Array(numVoices).fill(0);
  const baseOctave = 4;

  for (let voiceIdx = 0; voiceIdx < numVoices; voiceIdx++) {
    const slots = slotPattern[voiceIdx] ?? [];
    const baseDegree = voiceIdx % pcs.length;
    let currentDegree = baseDegree;

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const slot = slots[slotIdx]!;
      if (melodicStyle === "reich_cells") {
        if (slotIdx % 4 === 0) currentDegree = baseDegree;
        else currentDegree = (currentDegree + rng.choice([-1, 1]) + pcs.length) % pcs.length;
      } else if (melodicStyle === "shaw_phrases") {
        if (slotIdx % 8 === 0) currentDegree = rng.choice([0, 2, 4, Math.min(6, pcs.length - 1)]);
        else if (slotIdx % 8 < 4) currentDegree = (currentDegree + rng.choice([1, 2])) % pcs.length;
        else currentDegree = (currentDegree + rng.choice([-1, -2]) + pcs.length) % pcs.length;
      } else {
        if (slotIdx % 6 === 0) currentDegree = rng.choice([0, 3, 5, Math.min(7, pcs.length - 1)]);
        else currentDegree = (currentDegree + rng.choice([-1, 0, 1]) + pcs.length) % pcs.length;
      }

      const prevDegree = previousDegree[voiceIdx]!;
      const startBeat = slot * gridBeats;
      const duration = gridBeats * (0.9 + rng.next() * 0.2);
      const velocity = Math.round(80 + rng.next() * 24);

      if (rng.next() < 0.5 && prevDegree !== currentDegree) {
        const ghostBeat = Math.max(0, startBeat - gridBeats * 0.15);
        voices[voiceIdx]!.push({
          note: degreeToMidi(scale.rootPc, pcs, prevDegree, baseOctave + (voiceIdx % 2)),
          velocity: Math.round(velocity * 0.55),
          startBeat: ghostBeat,
          duration: gridBeats * 0.3,
        });
      }

      voices[voiceIdx]!.push({
        note: degreeToMidi(scale.rootPc, pcs, currentDegree, baseOctave + (voiceIdx % 2)),
        velocity,
        startBeat,
        duration,
      });
      previousDegree[voiceIdx] = currentDegree;
    }
  }

  return voices;
}

/** V-2 rapid-fire bursts appended per voice. */
export function addV2HocketRapidFire(
  voices: HocketMidiNote[][],
  durationSec: number,
  bpm: number,
  scale: ScaleResolution,
  seed: number,
): HocketMidiNote[][] {
  const rng = new Rng(seed ^ 0xfa57);
  const eighthSec = (60 / bpm) / 2;
  const tripletSec = eighthSec / 3;
  const pcs = scale.pitchClasses.length ? scale.pitchClasses : [0, 2, 4, 5, 7, 9, 11];
  const rapidStyle = rng.choice([
    "shaw_triplets",
    "reich_phasing",
    "minimalist_bursts",
    "polyrhythmic_rapid",
  ] as const);
  const out = voices.map((v) => [...v]);

  const pushNote = (voiceIdx: number, timeSec: number, degree: number, velScale: number, durScale: number) => {
    if (timeSec >= durationSec) return;
    const startBeat = (timeSec * bpm) / 60;
    const duration = ((tripletSec * durScale) * bpm) / 60;
    out[voiceIdx]!.push({
      note: degreeToMidi(scale.rootPc, pcs, degree % pcs.length, 4 + (voiceIdx % 2)),
      velocity: Math.round(70 + velScale * 30),
      startBeat,
      duration: Math.max(0.08, duration),
    });
  };

  if (rapidStyle === "shaw_triplets") {
    const positions = [0.2, 0.4, 0.6, 0.8].map((f) => durationSec * f);
    for (let v = 0; v < out.length; v++) {
      for (const pos of positions) {
        if (rng.next() >= 0.7) continue;
        const burstLen = rng.choice([6, 8, 10, 12]);
        for (let i = 0; i < burstLen; i++) {
          pushNote(v, pos + i * tripletSec, Math.floor(rng.next() * pcs.length), 0.9, 0.9);
        }
      }
    }
  } else if (rapidStyle === "reich_phasing") {
    for (let v = 0; v < out.length; v++) {
      const phase = v * 0.1;
      for (let i = 0; i < durationSec * 2; i += 2) {
        pushNote(v, i + phase, Math.floor(rng.next() * pcs.length), 0.8, 1.2);
      }
    }
  } else if (rapidStyle === "minimalist_bursts") {
    for (let v = 0; v < out.length; v++) {
      const cell = rng.choice([3, 4, 5, 6]);
      for (let i = 0; i < durationSec * 3; i += cell) {
        pushNote(v, i + v * 0.2, Math.floor(rng.next() * pcs.length), 0.7, 0.7);
      }
    }
  } else {
    const rhythms = Array.from({ length: out.length }, () => rng.choice([2, 3, 4, 5, 6, 7]));
    for (let v = 0; v < out.length; v++) {
      const rhythm = rhythms[v]!;
      for (let i = 0; i < durationSec * rhythm; i += rhythm) {
        pushNote(v, i + v * 0.15, Math.floor(rng.next() * pcs.length), 0.8, 1);
      }
    }
  }

  for (let v = 0; v < out.length; v++) {
    out[v]!.sort((a, b) => a.startBeat - b.startBeat);
  }
  return out;
}
