import { describe, expect, it } from "vitest";
import {
  generateIfmPairings,
  deriveFusionTitle,
  pairKey,
  listIfmToolFamilies,
} from "./intent-fusion-matrix";
import { NATIVE_SVIVVA_TOOLS } from "../mini-app-curation";

describe("generateIfmPairings", () => {
  it("returns cross-hub pairings", () => {
    const pairings = generateIfmPairings({ count: 5 });
    expect(pairings.length).toBeGreaterThan(0);
    for (const p of pairings) {
      expect(p.toolA.hub).not.toBe(p.toolB.hub);
      expect(p.fusionTitle).toContain("×");
      expect(p.faq.length).toBeGreaterThan(0);
    }
  });

  it("respects exclude keys", () => {
    const first = generateIfmPairings({ count: 1 })[0];
    const a = NATIVE_SVIVVA_TOOLS.find((t) => t.path === first.toolA.path)!;
    const b = NATIVE_SVIVVA_TOOLS.find((t) => t.path === first.toolB.path)!;
    const again = generateIfmPairings({ count: 3, excludePairKeys: [pairKey(a, b)] });
    const dup = again.find(
      (p) =>
        [p.toolA.path, p.toolB.path].sort().join("|") ===
        [first.toolA.path, first.toolB.path].sort().join("|"),
    );
    expect(dup).toBeUndefined();
  });

  it("lists tool families across hubs", () => {
    const families = listIfmToolFamilies();
    expect(families.length).toBeGreaterThanOrEqual(2);
  });
});

describe("deriveFusionTitle", () => {
  it("combines distinctive tokens", () => {
    const title = deriveFusionTitle(
      {
        name: "JSON Schema Validator",
        path: "/tools/json-schema-validator",
        url: "https://example.com/tools/json-schema-validator",
        hub: "ai-tools-hub",
        description: "",
      },
      {
        name: "Password Strength Checker",
        path: "/tools/password-strength",
        url: "https://example.com/tools/password-strength",
        hub: "cyber-security-mini-apps",
        description: "",
      },
    );
    expect(title).toContain("JSON");
    expect(title).toContain("Bridge");
  });
});
