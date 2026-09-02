import { describe, expect, it } from "vitest";
import type { DeployGateIssue } from "@/lib/seo/audit/deploy-gates";

describe("deploy-gates types", () => {
  it("passes when no critical issues", () => {
    const issues: DeployGateIssue[] = [
      { gate: "internal_links", severity: "warning", message: "Some orphans", count: 5 },
    ];
    const critical = issues.filter((i) => i.severity === "critical");
    expect(critical.length).toBe(0);
  });

  it("fails when critical canonical conflicts exist", () => {
    const issues: DeployGateIssue[] = [
      {
        gate: "canonical_integrity",
        severity: "critical",
        message: "Sitemap URLs conflict with noindex",
        count: 2,
      },
    ];
    expect(issues.some((i) => i.severity === "critical")).toBe(true);
  });
});
