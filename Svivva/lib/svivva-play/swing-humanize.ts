import type { NormalizedMidiEvent } from "./midi-normalize";

/** BLUES JAWN: jazz swing on 16th-grid (ratio 2:1 triplet feel). */
export const DEFAULT_SWING_RATIO = 0.67;
const SWING_EMPHASIS = [1.0, 0.75, 0.6, 0.7];
const BAR_DYNAMIC = [0.5, 0.65, 0.8, 0.55];

export type SwingOptions = {
  /** 0 = straight, 1 = full BLUES JAWN swing (0.67 long-short). */
  amount?: number;
  swingRatio?: number;
  gridBeats?: number;
};

function swingOffsetBeats(
  sixteenthIndex: number,
  gridBeats: number,
  ratio: number,
  amount: number,
): number {
  if (amount <= 0) return 0;
  const offbeat = sixteenthIndex % 2 === 1;
  if (!offbeat) return 0;
  // Triplet feel: delay offbeat 16ths by up to ~⅓ of a 16th (BLUES JAWN–style, clearly audible).
  const tripletDelay = gridBeats * (2 / 3);
  const ratioBlend = gridBeats * (ratio - 0.5) * 2;
  return (tripletDelay * 0.75 + ratioBlend * 0.25) * amount;
}

function dynamicVelocityScale(sixteenthIndex: number, baseVelocity: number): number {
  const barPos = Math.floor(sixteenthIndex / 16) % 4;
  const sixteenthInBeat = sixteenthIndex % 4;
  const base = BAR_DYNAMIC[barPos] ?? 0.7;
  const emph = SWING_EMPHASIS[sixteenthInBeat] ?? 1;
  return Math.max(1, Math.min(127, Math.round(baseVelocity * base * emph)));
}

/** Apply swing timing + phrase dynamics to MIDI events on a fixed grid. */
export function applySwingHumanize(
  events: NormalizedMidiEvent[],
  bpm: number,
  opts?: SwingOptions,
): NormalizedMidiEvent[] {
  const amount = Math.max(0, Math.min(1, opts?.amount ?? 0));
  if (amount <= 0 || !events.length || bpm <= 0) return events;

  const gridBeats = opts?.gridBeats ?? 0.25;
  const ratio = opts?.swingRatio ?? DEFAULT_SWING_RATIO;

  return [...events]
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((evt) => {
      const sixteenthIndex = Math.round(evt.startBeat / gridBeats);
      const offset = swingOffsetBeats(sixteenthIndex, gridBeats, ratio, amount);
      return {
        ...evt,
        startBeat: Math.max(0, evt.startBeat + offset),
        velocity: dynamicVelocityScale(sixteenthIndex, evt.velocity),
      };
    });
}

export function applySwingToStems<T extends { midiEvents: NormalizedMidiEvent[] }>(
  stems: T[],
  bpm: number,
  swingAmount: number,
): T[] {
  if (swingAmount <= 0) return stems;
  return stems.map((stem) => ({
    ...stem,
    midiEvents: applySwingHumanize(stem.midiEvents, bpm, { amount: swingAmount }),
  }));
}
