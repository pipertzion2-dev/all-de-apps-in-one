import { describe, expect, it } from "vitest";
import { BUNDLE_CARD_MIN_SCORE, evaluateBundleUnlock } from "@/lib/clean-sneaks/bundle-unlock";
import { FINISH_DISTANCE } from "@/lib/clean-sneaks/run-engine";
import { resolveStealRound } from "@/lib/clean-sneaks/steal-bundle-cards";

describe("bundle card unlock", () => {
  it("requires reaching the destination", () => {
    const r = evaluateBundleUnlock({
      score: 5000,
      distance: FINISH_DISTANCE - 10,
      previousBest: 0,
    });
    expect(r.unlocked).toBe(false);
    expect(r.reason).toMatch(/90m/i);
  });

  it("requires beating the previous best on a qualifying score", () => {
    const r = evaluateBundleUnlock({
      score: BUNDLE_CARD_MIN_SCORE + 100,
      distance: FINISH_DISTANCE,
      previousBest: BUNDLE_CARD_MIN_SCORE + 500,
    });
    expect(r.unlocked).toBe(false);
    expect(r.reason).toMatch(/highest score/i);
  });

  it("unlocks on destination run with new high score above minimum", () => {
    const r = evaluateBundleUnlock({
      score: BUNDLE_CARD_MIN_SCORE + 50,
      distance: FINISH_DISTANCE,
      previousBest: 400,
    });
    expect(r.unlocked).toBe(true);
    expect(r.newlyUnlocked).toBe(true);
  });
});

describe("steal bundle cards", () => {
  it("resolves higher tactic as a steal", () => {
    const r = resolveStealRound(
      { id: "steal", kind: "tactic", label: "Steal", power: 8, blurb: "" },
      { id: "mud", kind: "hazard", label: "Mud", power: 2, blurb: "" },
    );
    expect(r.playerWon).toBe(true);
    expect(r.playerStole).toBe(true);
  });

  it("blocks when the old man's card is stronger", () => {
    const r = resolveStealRound(
      { id: "protect", kind: "tactic", label: "Protect", power: 4, blurb: "" },
      { id: "bag", kind: "hazard", label: "Bag", power: 6, blurb: "" },
    );
    expect(r.playerWon).toBe(false);
  });
});
