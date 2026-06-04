import { describe, expect, it } from "vitest";
import { composeHocket, resolveScale } from "./reich-engine";

describe("composeHocket", () => {
  it("reich_interlock assigns each sixteenth slot to exactly one of six voices", () => {
    const scale = resolveScale("major", "C", "major");
    const parts = composeHocket({
      durationSec: 4,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      hocketGroove: "reich_interlock",
    });
    expect(parts).toHaveLength(6);
    const slotOwner = new Map<number, number>();
    for (const part of parts) {
      for (const n of part.notes) {
        const slot = Math.round(n.startBeat / 0.25);
        expect(slotOwner.has(slot)).toBe(false);
        slotOwner.set(slot, part.voiceIndex);
        expect(slot % 6).toBe(part.voiceIndex);
      }
    }
    expect(slotOwner.size).toBeGreaterThan(8);
  });

  it("V-2 groove produces eight voices with ghost notes and rapid-fire density", () => {
    const scale = resolveScale("major", "C", "major");
    const parts = composeHocket({
      durationSec: 8,
      bpm: 120,
      scale,
      seed: 99,
      hocketGroove: "shaw_interlock",
    });
    expect(parts).toHaveLength(8);
    const totalNotes = parts.reduce((sum, p) => sum + p.notes.length, 0);
    expect(totalNotes).toBeGreaterThan(40);
    const hasSoftGhost = parts.some((p) => p.notes.some((n) => n.velocity < 55));
    expect(hasSoftGhost).toBe(true);
  });
});
