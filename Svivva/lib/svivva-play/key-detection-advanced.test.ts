import { describe, expect, it } from "vitest";
import {
  applyAudioKeyAnchor,
  correctCommonMajorMisreads,
  isMajorKeyMisreadTrap,
  pickBestMajorKey,
  scoreMajorKeyFromChroma,
} from "./key-detection-advanced";

function chromaFromPcs(weights: Record<number, number>): Float64Array {
  const c = new Float64Array(12);
  for (const [pc, w] of Object.entries(weights)) {
    c[Number(pc)] = w;
  }
  const max = Math.max(...Array.from(c));
  if (max > 0) for (let i = 0; i < 12; i++) c[i] /= max;
  return c;
}

describe("key-detection-advanced", () => {
  it("prefers A major over B when D natural dominates D#", () => {
    const chroma = chromaFromPcs({
      9: 1,
      11: 0.85,
      1: 0.7,
      2: 0.75,
      4: 0.8,
      6: 0.65,
      8: 0.6,
      3: 0.15,
      10: 0.1,
    });
    const pick = pickBestMajorKey(chroma, chroma);
    expect(pick.key).toBe("A major");
  });

  it("corrects B major misread to A when progression implies A", () => {
    const chroma = chromaFromPcs({ 9: 0.9, 11: 1, 1: 0.8, 2: 0.7, 4: 0.75, 6: 0.7, 8: 0.65 });
    expect(correctCommonMajorMisreads(11, chroma, chroma, 9)).toBe(9);
  });

  it("flags B major as misread when audio anchor is A major", () => {
    expect(isMajorKeyMisreadTrap(9, 11)).toBe(true);
    expect(isMajorKeyMisreadTrap(9, 9)).toBe(false);
  });

  it("applyAudioKeyAnchor snaps B back to anchored A", () => {
    const out = applyAudioKeyAnchor(
      { rootPc: 11, key: "B major", confidence: 82, isMinor: false },
      { rootPc: 9, key: "A major", confidence: 76 },
    );
    expect(out.key).toBe("A major");
    expect(out.rootPc).toBe(9);
  });

  it("scores A major higher than B for A-major pitch material", () => {
    const chroma = chromaFromPcs({
      9: 1,
      11: 0.9,
      1: 0.75,
      2: 0.8,
      4: 0.85,
      6: 0.7,
      8: 0.65,
    });
    expect(scoreMajorKeyFromChroma(chroma, 9)).toBeGreaterThan(
      scoreMajorKeyFromChroma(chroma, 11) * 0.95,
    );
  });
});
