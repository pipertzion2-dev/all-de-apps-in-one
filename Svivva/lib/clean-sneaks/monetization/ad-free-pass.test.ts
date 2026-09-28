import { beforeEach, describe, expect, it, vi } from "vitest";

function makeStorage() {
  const store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      for (const key of Object.keys(store)) delete store[key];
    },
  };
}

import {
  AD_FREE_CASHAPP_DOLLARS,
  cashAppAdFreeUrl,
  grantAdFreePass,
  readAdFreePass,
} from "./ad-free-pass";

describe("ad-free pass", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: makeStorage() });
  });

  it("builds Cash App link for one-time fee", () => {
    expect(cashAppAdFreeUrl("pipertzion")).toContain(`/5`);
    expect(AD_FREE_CASHAPP_DOLLARS).toBe(5);
  });

  it("grants ad-free on device", () => {
    expect(readAdFreePass()).toBe(false);
    grantAdFreePass();
    expect(readAdFreePass()).toBe(true);
  });
});
