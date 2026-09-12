import { describe, expect, it } from "vitest";
import { getActiveIndexNowKey, resolveIndexNowKey } from "@/lib/indexing/indexnow-key";

describe("indexnow-key fallbacks", () => {
  it("serves the bundled public key file when DB is empty", async () => {
    const bundled = "7eacc064ef6bdafa3442fae031ccc972";
    const resolved = await resolveIndexNowKey(bundled);
    expect(resolved).toBe(bundled);
  });

  it("discovers bundled key as active when env and DB are unset", async () => {
    const prev = process.env.INDEXNOW_KEY;
    delete process.env.INDEXNOW_KEY;
    try {
      const active = await getActiveIndexNowKey();
      expect(active).toBe("7eacc064ef6bdafa3442fae031ccc972");
    } finally {
      if (prev !== undefined) process.env.INDEXNOW_KEY = prev;
      else delete process.env.INDEXNOW_KEY;
    }
  });

  it("prefers INDEXNOW_KEY env over bundled file", async () => {
    const prev = process.env.INDEXNOW_KEY;
    process.env.INDEXNOW_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    try {
      expect(await getActiveIndexNowKey()).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    } finally {
      if (prev !== undefined) process.env.INDEXNOW_KEY = prev;
      else delete process.env.INDEXNOW_KEY;
    }
  });
});
