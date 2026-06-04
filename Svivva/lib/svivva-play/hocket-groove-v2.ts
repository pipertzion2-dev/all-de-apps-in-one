/**
 * AI V-2 hocket groove styles — random Reich/Shaw/cells patterns per voice.
 * Each sixteenth slot is owned by at most one voice (no overlap).
 */
export type HocketGrooveStyle =
  | "reich_interlock"
  | "reich_phase"
  | "shaw_interlock"
  | "minimalist_cells"
  | "polyrhythmic"
  | "asymmetric";

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

/** Returns per-voice lists of sixteenth slot indices (0..totalSlots-1). */
export function buildV2HocketSlotPattern(
  totalSlots: number,
  numVoices: number,
  seed: number,
  style: HocketGrooveStyle,
): number[][] {
  if (style === "reich_interlock") {
    const pattern: number[][] = Array.from({ length: numVoices }, () => []);
    for (let s = 0; s < totalSlots; s++) {
      pattern[s % numVoices]!.push(s);
    }
    return pattern;
  }

  const rng = new Rng(seed ^ 0xdecaf);
  const groove =
    style === "reich_phase" ||
    style === "shaw_interlock" ||
    style === "minimalist_cells" ||
    style === "polyrhythmic" ||
    style === "asymmetric"
      ? style
      : rng.choice([
          "reich_phase",
          "shaw_interlock",
          "minimalist_cells",
          "polyrhythmic",
          "asymmetric",
        ] as HocketGrooveStyle[]);

  const pattern: number[][] = Array.from({ length: numVoices }, () => []);

  if (groove === "reich_phase") {
    const phaseOffset = rng.next() * 0.25 + 0.1;
    for (let voice = 0; voice < numVoices; voice++) {
      let slot = Math.floor(voice * phaseOffset * totalSlots);
      while (slot < totalSlots) {
        pattern[voice]!.push(slot);
        if (rng.next() < 0.4) pattern[voice]!.push(slot + 2);
        slot += rng.choice([3, 4, 5]);
      }
    }
  } else if (groove === "shaw_interlock") {
    for (let voice = 0; voice < numVoices; voice++) {
      let slot = voice * 3;
      while (slot < totalSlots) {
        pattern[voice]!.push(slot);
        if (rng.next() < 0.6) pattern[voice]!.push(slot + 1);
        slot += rng.choice([2, 3, 4, 6]);
      }
    }
  } else if (groove === "minimalist_cells") {
    const cellLengths = Array.from({ length: numVoices }, () => rng.choice([2, 3, 4, 5]));
    for (let voice = 0; voice < numVoices; voice++) {
      let slot = voice;
      while (slot < totalSlots) {
        pattern[voice]!.push(slot);
        for (let i = 1; i < cellLengths[voice]!; i++) {
          if (slot + i < totalSlots) pattern[voice]!.push(slot + i);
        }
        slot += cellLengths[voice]! + rng.choice([0, 1, 2]);
      }
    }
  } else if (groove === "polyrhythmic") {
    const rhythms = Array.from({ length: numVoices }, () => rng.choice([2, 3, 4, 5, 6, 7]));
    for (let voice = 0; voice < numVoices; voice++) {
      let slot = voice;
      while (slot < totalSlots) {
        pattern[voice]!.push(slot);
        if (rng.next() < 0.5) pattern[voice]!.push(slot + rhythms[voice]!);
        slot += rhythms[voice]!;
      }
    }
  } else {
    for (let voice = 0; voice < numVoices; voice++) {
      let slot = voice;
      while (slot < totalSlots) {
        pattern[voice]!.push(slot);
        if (rng.next() < 0.7) pattern[voice]!.push(slot + rng.choice([1, 2, 3, 5, 7]));
        slot += rng.choice([2, 3, 4, 5, 6, 7, 8]);
      }
    }
  }

  // AI V-2: overlapping slots across voices (no collision stripping).
  for (let v = 0; v < numVoices; v++) {
    pattern[v] = [...pattern[v]!].sort((a, b) => a - b);
  }

  return pattern;
}
