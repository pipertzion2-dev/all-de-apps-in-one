import { describe, expect, it } from "vitest";
import { resolvePatternCellLengths } from "./pattern-length";
import {
  composeOrchestralEnsemble,
  composeBjorkLinsOrchestral,
  BJORK_LINS_ORCHESTRAL_PRESET,
  CINEMATIC_ORCHESTRA_PRESET,
  HYPERREAL_ORCHESTRAL_PRESET,
  ABLETON_ORCHESTRAL_STEMS,
  ENSEMBLE_ORCHESTRAL_PRESETS,
  isEnsembleOrchestralPreset,
} from "./orchestral-compose";
import { resolveScale } from "./reich-engine";

describe("resolvePatternCellLengths", () => {
  it("scales cell lengths for extended and long modes", () => {
    expect(resolvePatternCellLengths("standard").cpCellLen).toBe(12);
    expect(resolvePatternCellLengths("extended").hkCellLen).toBe(48);
    expect(resolvePatternCellLengths("long").cpCellLen).toBe(36);
  });
});

describe("composeOrchestralEnsemble", () => {
  it("exports three ensemble presets only", () => {
    expect(ENSEMBLE_ORCHESTRAL_PRESETS).toEqual([
      BJORK_LINS_ORCHESTRAL_PRESET,
      HYPERREAL_ORCHESTRAL_PRESET,
      CINEMATIC_ORCHESTRA_PRESET,
    ]);
    expect(isEnsembleOrchestralPreset("60s_soul")).toBe(false);
    expect(isEnsembleOrchestralPreset(BJORK_LINS_ORCHESTRAL_PRESET)).toBe(true);
  });

  it("generates distinct pitches per string stem", () => {
    const scale = resolveScale("major", "A");
    const voices = composeOrchestralEnsemble({
      durationSec: 16,
      bpm: 120,
      scale,
      seed: 7,
      patternLength: "extended",
      preset: BJORK_LINS_ORCHESTRAL_PRESET,
    });
    const v1 = voices.find((v) => v.name === "Violin 1")?.notes.map((n) => n.note) ?? [];
    const v2 = voices.find((v) => v.name === "Violin 2")?.notes.map((n) => n.note) ?? [];
    const cello = voices.find((v) => v.name === "Cello")?.notes.map((n) => n.note) ?? [];
    expect(v1.length).toBeGreaterThan(4);
    expect(new Set(v1).size).toBeGreaterThan(2);
    expect(v2.join(",")).not.toBe(v1.join(","));
    expect(cello.some((n) => !v1.includes(n))).toBe(true);
  });

  it("includes timpani and Ableton stem roster", () => {
    const scale = resolveScale("major", "D");
    const voices = composeBjorkLinsOrchestral({
      durationSec: 12,
      bpm: 100,
      scale,
      seed: 3,
    });
    expect(voices.length).toBeGreaterThanOrEqual(10);
    expect(ABLETON_ORCHESTRAL_STEMS.some((s) => s.name === "Timpani")).toBe(true);
  });
});
