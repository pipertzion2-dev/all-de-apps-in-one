import { describe, expect, it } from "vitest";
import { getMove } from "./moves-library";
import { sampleMovePose, sampleRoutinePose } from "./dance-poses";

describe("dance poses", () => {
  it("samples a two-step pose that shifts legs over time", () => {
    const move = getMove("two-step")!;
    const a = sampleMovePose(move, 0.2);
    const b = sampleMovePose(move, 1.1);
    expect(a.lHipX).not.toBe(b.lHipX);
    expect(Number.isFinite(a.torsoY)).toBe(true);
  });

  it("cycles routine poses across moves", () => {
    const moves = [getMove("two-step")!, getMove("body-roll")!, getMove("pop-hit")!];
    const early = sampleRoutinePose(moves, 0.1, 0);
    const late = sampleRoutinePose(moves, 0.8, 0);
    expect(early.activeIndex).toBeLessThan(late.activeIndex);
  });
});
