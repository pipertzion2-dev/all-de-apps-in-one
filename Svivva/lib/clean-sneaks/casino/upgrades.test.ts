import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { emptyCasinoSession, readCasinoSession, writeCasinoSession } from "./session";
import {
  resolveUpgradeEffects,
  tryUnlockCasinoUpgrade,
  listUnlockedUpgrades,
} from "./upgrades";
import { computeAnte, payoutWin } from "./credits";

function mockStorage() {
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
  return store;
}

describe("casino upgrade unlocks", () => {
  beforeEach(() => {
    mockStorage();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("spends credits and records permanent unlock", () => {
    writeCasinoSession({ ...emptyCasinoSession(), credits: 500 });
    const result = tryUnlockCasinoUpgrade("stack_small");
    expect(result.ok).toBe(true);
    expect(readCasinoSession().credits).toBe(250);
    expect(listUnlockedUpgrades()).toEqual(["stack_small"]);
  });

  it("rejects unlock when short on credits", () => {
    writeCasinoSession({ ...emptyCasinoSession(), credits: 100 });
    const result = tryUnlockCasinoUpgrade("stack_small");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Need 250/);
  });

  it("applies stacked effects to ante and payout", () => {
    const fx = resolveUpgradeEffects(["stack_small", "stack_large"]);
    expect(fx.winMultiplier).toBeGreaterThan(1.75);
    expect(fx.minAnte).toBe(40);
    const ante = computeAnte(500, ["stack_medium"]);
    expect(ante).toBeLessThan(computeAnte(500, []));
    expect(payoutWin(100, ["stack_small"])).toBeGreaterThan(payoutWin(100, []));
  });
});
