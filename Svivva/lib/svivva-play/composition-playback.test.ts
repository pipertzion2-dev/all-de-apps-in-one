import { describe, expect, it } from "vitest";
import { composeHocket, resolveScale } from "./reich-engine";
import { constrainGeneratedStems } from "./scale-key-guard";
import { applyMeendToStems } from "./generate-helpers";

describe("composition playback pipeline", () => {
  it("keeps diverse pitches through constrain and meend (no single-note collapse)", () => {
    const scale = resolveScale("major", "A", "major");
    const voices = composeHocket({
      durationSec: 16,
      bpm: 134,
      scale,
      seed: 42,
      hocketGroove: "shaw_interlock",
    });
    let stems = voices.map((v, i) => ({
      name: v.name,
      role: i === 0 ? "melody" : "hocket",
      midiEvents: v.notes.map((n) => ({
        note: n.note,
        velocity: n.velocity,
        startBeat: n.startBeat,
        duration: n.duration,
      })),
      expression: {},
    }));
    stems = applyMeendToStems(stems);
    const guarded = constrainGeneratedStems(stems, "A major", [], 134, {
      anchorMidi: 81,
    });
    const allNotes = guarded.flatMap((s) => s.midiEvents.map((e) => e.note));
    const unique = [...new Set(allNotes)];
    expect(unique.length).toBeGreaterThanOrEqual(6);
    expect(guarded.some((s) => s.midiEvents.length >= 8)).toBe(true);
    for (const stem of guarded) {
      if (/hocket voice/i.test(stem.name) && stem.midiEvents.length > 0) {
        expect(stem.expression?.meend).toBe(true);
      }
    }
  });
});
