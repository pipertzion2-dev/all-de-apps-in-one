import { describe, expect, it } from "vitest";
import { composeHocket } from "./reich-engine";
import { resolveScale } from "./reich-engine";

describe("composeHocket v2 interlock", () => {
  it("assigns each sixteenth slot to exactly one of six voices", () => {
    const scale = resolveScale("major", "C", "major");
    const parts = composeHocket({
      durationSec: 4,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
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
});
