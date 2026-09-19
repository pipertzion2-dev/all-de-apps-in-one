import { describe, expect, it } from "vitest";
import {
  canAffordTable,
  computeAnte,
  CREDITS_MIN_ANTE,
  payoutWin,
  scoreToCredits,
} from "@/lib/clean-sneaks/casino/credits";

describe("casino credits", () => {
  it("maps walking score 1:1 into credits", () => {
    expect(scoreToCredits(4242.7)).toBe(4242);
    expect(scoreToCredits(-3)).toBe(0);
  });

  it("blocks the table below minimum ante", () => {
    expect(canAffordTable(CREDITS_MIN_ANTE - 1)).toBe(false);
    expect(computeAnte(CREDITS_MIN_ANTE - 1)).toBe(0);
  });

  it("never antes more than available credits", () => {
    expect(computeAnte(80)).toBeLessThanOrEqual(80);
    expect(computeAnte(10_000)).toBeLessThanOrEqual(10_000);
    expect(computeAnte(CREDITS_MIN_ANTE)).toBe(CREDITS_MIN_ANTE);
  });

  it("pays winners more than the ante", () => {
    const ante = 100;
    expect(payoutWin(ante)).toBeGreaterThan(ante);
  });
});
