import { describe, expect, it } from "vitest";
import { buildEnsembleChordTimeline } from "./ensemble-harmony";

describe("buildEnsembleChordTimeline", () => {
  it("builds diatonic segments from user key without Melodyne", () => {
    const segments = buildEnsembleChordTimeline("G major", 32, 120, 42);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0]!.t0).toBe(0);
    expect(segments[segments.length - 1]!.t1).toBeLessThanOrEqual(32);
    for (const seg of segments) {
      expect(seg.symbol.length).toBeGreaterThan(0);
      expect(seg.pitchClasses.length).toBeGreaterThan(0);
    }
  });

  it("returns empty for invalid tempo", () => {
    expect(buildEnsembleChordTimeline("C major", 32, 0, 1)).toEqual([]);
  });
});
