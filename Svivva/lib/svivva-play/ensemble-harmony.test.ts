import { describe, expect, it } from "vitest";
import { buildEnsembleChordTimeline } from "./ensemble-harmony";
import { resolveCompositionScale } from "./scale-key-guard";

describe("buildEnsembleChordTimeline", () => {
  it("builds diatonic triads in the user key", () => {
    const segments = buildEnsembleChordTimeline("G major", 32, 120, 42);
    expect(segments.length).toBeGreaterThan(0);
    const { scaleInfo } = resolveCompositionScale("G major", "major");
    for (const seg of segments) {
      for (const pc of seg.pitchClasses) {
        expect(scaleInfo.scalePcs.has(pc)).toBe(true);
      }
      expect(seg.symbol).not.toMatch(/9|11|sus|maj9/i);
    }
  });

  it("uses manual key tonic for minor progressions", () => {
    const segments = buildEnsembleChordTimeline("A minor", 32, 120, 1);
    expect(segments[0]!.symbol).toMatch(/^A(m|$)/);
  });

  it("returns empty for invalid tempo", () => {
    expect(buildEnsembleChordTimeline("C major", 32, 0, 1)).toEqual([]);
  });
});

describe("ensembleCompositionScaleName", () => {
  it("ignores Indian raga scales for ensemble", async () => {
    const { ensembleCompositionScaleName } = await import("./scale-key-guard");
    expect(ensembleCompositionScaleName("C major", null, "raga_bhairav")).toBe("major");
  });
});
