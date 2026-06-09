import { describe, expect, it } from "vitest";
import { composeWithChordProgression } from "./compose-from-chords";
import { composeHocket, resolveScale } from "./reich-engine";
import { constrainGeneratedStems } from "./scale-key-guard";
import { applyMeendToStems } from "./generate-helpers";

function assertAllNotesInScale(parts: { notes: { note: number }[] }[], scalePcs: Set<number>) {
  for (const part of parts) {
    for (const n of part.notes) {
      const pc = ((n.note % 12) + 12) % 12;
      expect(scalePcs.has(pc)).toBe(true);
    }
  }
}

describe("hocket stays in locked key", () => {
  it("6-voice reich_interlock uses only A major pitch classes", () => {
    const scale = resolveScale("major", "A", "major");
    const scalePcs = new Set(scale.pitchClasses);
    const parts = composeHocket({
      durationSec: 8,
      bpm: 120,
      scale,
      seed: 42,
      hocketGroove: "reich_interlock",
    });
    assertAllNotesInScale(parts, scalePcs);
  });

  it("8-voice master-cell hocket uses only A major pitch classes", () => {
    const scale = resolveScale("major", "A", "major");
    const scalePcs = new Set(scale.pitchClasses);
    const parts = composeHocket({
      durationSec: 8,
      bpm: 120,
      scale,
      seed: 99,
      hocketGroove: "shaw_interlock",
    });
    assertAllNotesInScale(parts, scalePcs);
  });

  it("full composition pipeline keeps A major after constrain + meend", () => {
    const scale = resolveScale("major", "A", "major");
    const scalePcs = new Set(scale.pitchClasses);
    const parts = composeHocket({
      durationSec: 16,
      bpm: 134,
      scale,
      seed: 42,
      hocketGroove: "reich_interlock",
    });
    let stems = parts.map((v, i) => ({
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
      anchorMidi: 69,
    });
    for (const stem of guarded) {
      for (const evt of stem.midiEvents) {
        const pc = ((evt.note % 12) + 12) % 12;
        expect(scalePcs.has(pc)).toBe(true);
      }
    }
  });

  it("chord-aware hocket nudge stays in scale for A major progression", () => {
    const scale = resolveScale("major", "A", "major");
    const scalePcs = new Set(scale.pitchClasses);
    const chords = [
      { t0: 0, t1: 4, symbol: "A", confidence: 90, pitchClasses: [9, 1, 4] },
      { t0: 4, t1: 8, symbol: "D", confidence: 90, pitchClasses: [2, 6, 9] },
    ];
    const parts = composeWithChordProgression({
      durationSec: 8,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      type: "hocket",
      chords,
      hocketGroove: "reich_interlock",
    });
    assertAllNotesInScale(parts, scalePcs);
  });
});
