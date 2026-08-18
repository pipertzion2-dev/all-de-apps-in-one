import { describe, expect, it } from "vitest";
import { evaluateSeoOpsGate } from "./seo-ops-gate";

describe("evaluateSeoOpsGate", () => {
  const cleanChecks = {
    canonicalConflicts: 0,
    robotsConflicts: 0,
    missingCanonical: 0,
    duplicateTitles: 0,
    thinPages: 0,
    robotsStatus: 200,
    sitemapStatus: 200,
    indexHealthScore: 85,
  };

  it("passes when all checks within thresholds", () => {
    const result = evaluateSeoOpsGate(cleanChecks, {});
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("fails on canonical conflicts", () => {
    const result = evaluateSeoOpsGate(
      { ...cleanChecks, canonicalConflicts: 2 },
      { maxCanonicalConflicts: 0 },
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toContain("canonical");
  });

  it("fails when robots or sitemap not 200", () => {
    const result = evaluateSeoOpsGate(
      { ...cleanChecks, sitemapStatus: 404 },
      {},
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.includes("sitemap"))).toBe(true);
  });

  it("fails on low index health score", () => {
    const result = evaluateSeoOpsGate(
      { ...cleanChecks, indexHealthScore: 50 },
      { minIndexHealthScore: 70 },
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toContain("Index health");
  });
});
