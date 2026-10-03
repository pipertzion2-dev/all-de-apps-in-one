import { describe, expect, it } from "vitest";
import { STEAL_BUNDLE_THEME } from "./theme";

describe("Steal Bundle title graphic palette", () => {
  it("anchors deep purple backgrounds", () => {
    expect(STEAL_BUNDLE_THEME.bgDeep).toBe("#120c18");
    expect(STEAL_BUNDLE_THEME.purple).toBe("#4B3B5B");
  });

  it("keeps lavender, sage, and cream accents from the main art", () => {
    expect(STEAL_BUNDLE_THEME.lavender).toBe("#A992C1");
    expect(STEAL_BUNDLE_THEME.sage).toBe("#8A9A7A");
    expect(STEAL_BUNDLE_THEME.cream).toBe("#E5E4C2");
  });
});
