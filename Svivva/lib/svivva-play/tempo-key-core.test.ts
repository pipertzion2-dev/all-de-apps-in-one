import { describe, expect, it } from "vitest";
import {
  detectBpmBeatGridSearch,
  fuseBpmCandidates,
  resolveTempoHarmonics,
  runHybridDetection,
} from "./tempo-key-core";

function syntheticOnsets(bpm: number, seconds = 30, subdivisions = 2): number[] {
  const period = 60 / bpm;
  const step = period / subdivisions;
  const onsets: number[] = [];
  for (let t = 0; t < seconds; t += step) {
    onsets.push(t);
  }
  return onsets;
}

describe("tempo harmonic resolution", () => {
  it("resolves 3/2 tempo alias (202) to 134 BPM", () => {
    const onsets = syntheticOnsets(134, 30, 2);
    expect(resolveTempoHarmonics(202, onsets)).toBe(134);
    expect(detectBpmBeatGridSearch(onsets)).toBe(134);
  });

  it("fuses wrong high-BPM detectors toward the true pulse", () => {
    const onsets = syntheticOnsets(134, 30, 2);
    const wrong = [
      { bpm: 202, weight: 1.2, source: "peak-histogram" },
      { bpm: 201, weight: 1.0, source: "autocorrelation" },
    ];
    expect(fuseBpmCandidates(wrong, onsets).bpm).toBe(134);
    expect(runHybridDetection(wrong, [], onsets).bpm).toBe(134);
  });

  it("keeps in-range tempos stable (no erroneous 2/3 pull-down)", () => {
    const onsets = syntheticOnsets(120, 24, 2);
    expect(resolveTempoHarmonics(120, onsets)).toBe(120);
  });
});
