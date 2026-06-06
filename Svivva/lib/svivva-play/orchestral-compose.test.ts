import { describe, expect, it } from "vitest";
import { resolvePatternCellLengths } from "./pattern-length";
import {
  composeBjorkLinsOrchestral,
  BJORK_LINS_ORCHESTRAL_PRESET,
  ABLETON_ORCHESTRAL_STEMS,
} from "./orchestral-compose";
import { resolveScale } from "./reich-engine";

describe("resolvePatternCellLengths", () => {
  it("scales cell lengths for extended and long modes", () => {
    expect(resolvePatternCellLengths("standard").cpCellLen).toBe(12);
    expect(resolvePatternCellLengths("extended").hkCellLen).toBe(48);
    expect(resolvePatternCellLengths("long").cpCellLen).toBe(36);
  });
});

describe("composeBjorkLinsOrchestral", () => {
  it("exports preset id and Ableton stem roster", () => {
    expect(BJORK_LINS_ORCHESTRAL_PRESET).toBe("bjork_lins_orchestral");
    expect(ABLETON_ORCHESTRAL_STEMS.some((s) => s.name === "Timpani")).toBe(true);
  });

  it("generates interlocking string + percussion stems", () => {
    const scale = resolveScale("major", "A");
    const voices = composeBjorkLinsOrchestral({
      durationSec: 16,
      bpm: 120,
      scale,
      seed: 7,
      patternLength: "extended",
    });
    expect(voices.length).toBeGreaterThanOrEqual(10);
    const violin1 = voices.find((v) => v.name === "Violin 1");
    expect(violin1?.notes.length).toBeGreaterThan(4);
    const timpani = voices.find((v) => v.name === "Timpani");
    expect(timpani?.notes.length).toBeGreaterThan(0);
  });
});
