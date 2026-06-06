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
  const midi = 12 * (octave + 1) + pc;
  return Math.max(48, Math.min(76, midi));
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
  const baseOctave = 3;

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

      // Ghost notes: only add when there's enough time before the main note to avoid t=0 overlap.
      if (rng.next() < 0.5 && prevDegree !== currentDegree && startBeat >= gridBeats) {
        const ghostBeat = startBeat - gridBeats * 0.15;
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

/**
 * V-2 rapid-fire accents — one small burst per voice placed on a metrically-aligned beat.
 * Deliberately small (max 4 notes per voice) so no voice is overloaded and tempo stays tight.
 */
export function addV2HocketRapidFire(
  voices: HocketMidiNote[][],
  durationSec: number,
  bpm: number,
  scale: ScaleResolution,
  seed: number,
): HocketMidiNote[][] {
  const rng = new Rng(seed ^ 0xfa57);
  const pcs = scale.pitchClasses.length ? scale.pitchClasses : [0, 2, 4, 5, 7, 9, 11];
  const out = voices.map((v) => [...v]);

  // One 3-note triplet accent per voice, aligned to a beat boundary, max 4 notes.
  const beatDur = 60 / bpm;
  const tripletDur = beatDur / 3;
  const totalBeats = (durationSec * bpm) / 60;

  for (let v = 0; v < out.length; v++) {
    if (rng.next() < 0.45) continue; // ~55% chance to add accent — not every voice
    const burstLen = rng.choice([2, 3, 3, 4]);
    // Pick a beat in the latter half of the piece, snapped to the nearest beat boundary.
    const accentBeat = Math.floor(rng.next() * totalBeats * 0.5 + totalBeats * 0.5);
    const degree = Math.floor(rng.next() * pcs.length);
    for (let i = 0; i < burstLen; i++) {
      const startBeat = accentBeat + i * (tripletDur / beatDur);
      if (startBeat >= totalBeats) break;
      out[v]!.push({
        note: degreeToMidi(scale.rootPc, pcs, (degree + i) % pcs.length, 3 + (v % 2)),
        velocity: Math.round(68 + rng.next() * 18),
        startBeat,
        duration: Math.max(0.1, tripletDur / beatDur * 0.85),
      });
    }
  }

  for (let v = 0; v < out.length; v++) {
    out[v]!.sort((a, b) => a.startBeat - b.startBeat);
  }
  return out;
}
