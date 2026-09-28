import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("localStorage", {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
});

import {
  AD_FREE_CASHAPP_DOLLARS,
  cashAppAdFreeUrl,
  grantAdFreePass,
  readAdFreePass,
} from "./ad-free-pass";

describe("ad-free pass", () => {
  beforeEach(() => {
    localStorage.clear();
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
