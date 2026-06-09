/**
 * AI V-2 melody, ghost-note, and rapid-fire layers for hocket voices.
 */
import { midiFromScaleDegree, type ScaleResolution } from "./reich-engine";

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

function degreeToMidi(scale: ScaleResolution, degree: number, octave: number): number {
  return midiFromScaleDegree(scale, degree, octave);
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
  const pcs = scale.pitchClasses.length ? scale.pitchClasses : [scale.rootPc];
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
      const octave = baseOctave + (voiceIdx % 2);

      if (rng.next() < 0.3 && prevDegree !== currentDegree && startBeat >= gridBeats) {
        const ghostBeat = startBeat - gridBeats * 0.15;
        voices[voiceIdx]!.push({
          note: degreeToMidi(scale, prevDegree, octave),
          velocity: Math.round(velocity * 0.55),
          startBeat: ghostBeat,
          duration: gridBeats * 0.3,
        });
      }

      voices[voiceIdx]!.push({
        note: degreeToMidi(scale, currentDegree, octave),
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
 * V-2 rapid-fire accents — sparse triplet bursts aligned to beat boundaries.
 */
export function addV2HocketRapidFire(
  voices: HocketMidiNote[][],
  durationSec: number,
  bpm: number,
  scale: ScaleResolution,
  seed: number,
): HocketMidiNote[][] {
  const rng = new Rng(seed ^ 0xfa57);
  const pcs = scale.pitchClasses.length ? scale.pitchClasses : [scale.rootPc];
  const out = voices.map((v) => [...v]);

  const beatDur = 60 / bpm;
  const tripletDur = beatDur / 3;
  const totalBeats = (durationSec * bpm) / 60;

  for (let v = 0; v < out.length; v++) {
    if (rng.next() < 0.65) continue;
    const burstLen = rng.choice([2, 3]);
    const accentBeat = Math.floor(rng.next() * totalBeats * 0.5 + totalBeats * 0.5);
    const degree = Math.floor(rng.next() * pcs.length);
    for (let i = 0; i < burstLen; i++) {
      const startBeat = accentBeat + i * (tripletDur / beatDur);
      if (startBeat >= totalBeats) break;
      out[v]!.push({
        note: degreeToMidi(scale, (degree + i) % pcs.length, 4 + (v % 2)),
        velocity: Math.round(68 + rng.next() * 18),
        startBeat,
        duration: Math.max(0.1, (tripletDur / beatDur) * 0.85),
      });
    }
  }

  for (let v = 0; v < out.length; v++) {
    out[v]!.sort((a, b) => a.startBeat - b.startBeat);
  }
  return out;
}
