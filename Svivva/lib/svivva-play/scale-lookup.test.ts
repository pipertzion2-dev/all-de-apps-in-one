import { describe, expect, it } from "vitest";
import { lookupScaleLocal } from "./scale-lookup";

describe("lookupScaleLocal", () => {
  it("resolves brazilian (alias) to catalog scale", () => {
    const r = lookupScaleLocal("brazilian", "C");
    expect(r.resolved?.scaleId).toBe("brazilian");
    expect(r.resolved?.relativeSteps).toContain(10);
  });

  it("suggests corrections for misspelling brazillian", () => {
    const r = lookupScaleLocal("brazillian", "C");
    expect(r.resolved?.scaleId).toBe("brazilian");
  });

  it("resolves hungarian minor via tonal", () => {
    const r = lookupScaleLocal("hungarian minor", "A");
    expect(r.resolved?.scaleId).toBe("hungarian_minor");
    expect(r.resolved?.source).toMatch(/tonal|catalog|fuzzy/);
  });

  it("resolves catalog raga by id", () => {
    const r = lookupScaleLocal("raga_bhairav", "C");
    expect(r.resolved?.scaleId).toBe("raga_bhairav");
  });
});
