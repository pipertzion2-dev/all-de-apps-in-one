import { describe, expect, it } from "vitest";
import {
  canAffordTable,
  computeAnte,
  CREDITS_MIN_ANTE,
  payoutWin,
  scoreToCredits,
} from "@/lib/clean-sneaks/casino/credits";
import {
  addSessionCredits,
  emptyCasinoSession,
  writeCasinoSession,
} from "@/lib/clean-sneaks/casino/session";

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

  it("adds rewarded-ad credits on top of the current stack", () => {
    const store = new Map<string, string>();
    (globalThis as unknown as { window: { localStorage: Storage } }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, String(v));
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
        clear: () => store.clear(),
        key: () => null,
        length: 0,
      },
    };
    writeCasinoSession({ ...emptyCasinoSession(), credits: 40 });
    const next = addSessionCredits(75);
    expect(next.credits).toBe(115);
    delete (globalThis as { window?: unknown }).window;
  });
});
