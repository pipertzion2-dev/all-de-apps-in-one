import { describe, expect, it } from "vitest";
import { suggestCompositionScale } from "./scale-suggest";

describe("suggestCompositionScale", () => {
  it("suggests major when chords are major and key is major", () => {
    const s = suggestCompositionScale({
      analysisKey: "C major",
      chords: [
        { t0: 0, t1: 2, symbol: "C", confidence: 80, pitchClasses: [0, 4, 7] },
        { t0: 2, t1: 4, symbol: "F", confidence: 80, pitchClasses: [0, 4, 7] },
        { t0: 4, t1: 6, symbol: "G", confidence: 80, pitchClasses: [0, 4, 7] },
      ],
    });
    expect(s.scaleName).toBe("major");
    expect(s.mode).toBe("major");
  });
});
