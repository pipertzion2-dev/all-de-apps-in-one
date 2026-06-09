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

  it("voice 6 sits in a higher register than voice 1 (Reich octave spread)", () => {
    const scale = resolveScale("major", "C", "major");
    const parts = composeHocket({
      durationSec: 8,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      hocketGroove: "reich_interlock",
    });
    const v1 = parts[0]!;
    const v6 = parts[5]!;
    expect(v6.notes.length).toBeGreaterThan(0);
    const avg = (p: typeof v1) =>
      p.notes.reduce((s, n) => s + n.note, 0) / Math.max(1, p.notes.length);
    expect(avg(v6)).toBeGreaterThan(avg(v1));
    expect(Math.max(...v6.notes.map((n) => n.note))).toBeLessThanOrEqual(74);
  });

  it("no hocket voice pierces the top register cap", () => {
    const scale = resolveScale("major", "A", "major");
    const parts = composeHocket({
      durationSec: 16,
      bpm: 134,
      scale,
      seed: 42,
      hocketGroove: "reich_interlock",
    });
    for (const part of parts) {
      expect(Math.max(...part.notes.map((n) => n.note))).toBeLessThanOrEqual(74);
    }
  });

  it("8-voice groove produces eight voices with interlocking density", () => {
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
    const uniquePcs = new Set(parts.flatMap((p) => p.notes.map((n) => ((n.note % 12) + 12) % 12)));
    expect(uniquePcs.size).toBeGreaterThanOrEqual(4);
  });
});
