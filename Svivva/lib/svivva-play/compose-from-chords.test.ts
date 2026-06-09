import { describe, expect, it } from "vitest";
import { composeWithChordProgression } from "./compose-from-chords";
import { composeHocket } from "./reich-engine";
import { resolveCompositionScale } from "./scale-key-guard";

describe("composeWithChordProgression", () => {
  it("preserves hocket pitch variety (Reich master cells, not flat triads)", () => {
    const chords = [
      { t0: 0, t1: 2, symbol: "A", confidence: 80, pitchClasses: [] },
      { t0: 2, t1: 4, symbol: "D", confidence: 80, pitchClasses: [] },
      { t0: 4, t1: 6, symbol: "E", confidence: 80, pitchClasses: [] },
    ];
    const { resolution: scale } = resolveCompositionScale("A major", "major", null, chords);
    const raw = composeHocket({
      durationSec: 6,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      hocketGroove: "reich_interlock",
    });
    const aligned = composeWithChordProgression({
      durationSec: 6,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      type: "hocket",
      chords,
      hocketGroove: "reich_interlock",
    });

    expect(aligned).toHaveLength(6);
    const rawPcs = new Set(raw.flatMap((v) => v.notes.map((n) => n.note % 12)));
    const alignedPcs = new Set(aligned.flatMap((v) => v.notes.map((n) => n.note % 12)));
    expect(alignedPcs.size).toBeGreaterThanOrEqual(Math.min(5, rawPcs.size));
    expect(alignedPcs.size).toBeGreaterThan(3);
  });

  it("keeps hocket notes in the resolved session scale", () => {
    const chords = [{ t0: 0, t1: 6, symbol: "A", confidence: 80, pitchClasses: [] }];
    const { resolution: scale, scaleInfo } = resolveCompositionScale(
      "A major",
      "major",
      null,
      chords,
    );
    const voices = composeWithChordProgression({
      durationSec: 6,
      bpm: 120,
      scale,
      style: "reich_electric",
      seed: 42,
      type: "hocket",
      chords,
      hocketGroove: "reich_interlock",
    });

    for (const voice of voices) {
      for (const n of voice.notes) {
        expect(scaleInfo.scalePcs.has(n.note % 12)).toBe(true);
      }
    }
  });
});
