import { describe, expect, it } from "vitest";
import {
  pickIndianRagaScaleName,
  resolveMeendScaleName,
  stableGenerationSeed,
} from "./indian-raga-scale";

describe("indian raga scale", () => {
  it("picks the same raga for the same seed", () => {
    const a = pickIndianRagaScaleName({ minor: false, seed: 42 });
    const b = pickIndianRagaScaleName({ minor: false, seed: 42 });
    expect(a).toBe(b);
    expect(a.startsWith("raga_")).toBe(true);
  });

  it("stays diatonic when meend is on unless user picked a raga", () => {
    expect(
      resolveMeendScaleName({
        lockedKey: "A major",
        reichScale: "major",
        seed: 99,
        meend: true,
      }),
    ).toBe("major");
    expect(
      resolveMeendScaleName({
        lockedKey: "A minor",
        reichScale: "major",
        seed: 99,
        meend: true,
      }),
    ).toBe("natural_minor");
  });

  it("keeps user-selected raga scale", () => {
    expect(
      resolveMeendScaleName({
        lockedKey: "A major",
        reichScale: "raga_marwa",
        seed: 99,
        meend: true,
      }),
    ).toBe("raga_marwa");
  });

  it("stableGenerationSeed is deterministic for same key and import", () => {
    const a = stableGenerationSeed({
      useSeed: false,
      seed: 1,
      lockedKey: "A major",
      importSeq: 3,
    });
    const b = stableGenerationSeed({
      useSeed: false,
      seed: 999,
      lockedKey: "A major",
      importSeq: 3,
    });
    expect(a).toBe(b);
  });
});
