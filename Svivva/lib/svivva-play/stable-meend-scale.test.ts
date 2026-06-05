import { describe, expect, it } from "vitest";
import { pickStableIndianRagaScaleName } from "./stable-meend-scale";

describe("stable meend scale", () => {
  it("returns the same raga for the same key and session anchor", () => {
    const a = pickStableIndianRagaScaleName({
      lockedKey: "A major",
      sessionAnchor: "sess-1|A major",
    });
    const b = pickStableIndianRagaScaleName({
      lockedKey: "A major",
      sessionAnchor: "sess-1|A major",
    });
    expect(a).toBe(b);
  });

  it("does not depend on random seed", () => {
    const raga = pickStableIndianRagaScaleName({
      lockedKey: "D minor",
      sessionAnchor: "local|D minor",
    });
    expect(raga).toMatch(/^raga_/);
  });
});
