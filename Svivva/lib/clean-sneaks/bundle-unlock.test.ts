import { describe, expect, it } from "vitest";
import { evaluateBundleUnlock } from "@/lib/clean-sneaks/bundle-unlock";
import { FINISH_DISTANCE } from "@/lib/clean-sneaks/run-engine";

describe("bundle card unlock", () => {
  it("requires reaching the destination", () => {
    const r = evaluateBundleUnlock({
      score: 5000,
      distance: FINISH_DISTANCE - 10,
      previousBest: 0,
    });
    expect(r.unlocked).toBe(false);
    expect(r.reason).toMatch(new RegExp(`${FINISH_DISTANCE}m`, "i"));
  });

  it("unlocks on destination regardless of previous best", () => {
    const r = evaluateBundleUnlock({
      score: 120,
      distance: FINISH_DISTANCE,
      previousBest: 99999,
    });
    expect(r.unlocked).toBe(true);
    expect(r.newlyUnlocked).toBe(true);
  });

  it("unlocks on destination run", () => {
    const r = evaluateBundleUnlock({
      score: 50,
      distance: FINISH_DISTANCE,
      previousBest: 400,
    });
    expect(r.unlocked).toBe(true);
    expect(r.newlyUnlocked).toBe(true);
  });
});
