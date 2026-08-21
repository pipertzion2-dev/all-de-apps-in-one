import { describe, expect, it } from "vitest";
import { buildEducationAccessCoercionReview } from "../advocacy/coercion-review";

describe("Education Access & Coercion Review", () => {
  it("builds a NY senior-year YABC / housing brief with citations and layered timeline", async () => {
    const brief = await buildEducationAccessCoercionReview({
      jurisdiction: { country: "US", stateProvince: "NY", district: "NYC DOE" },
      gradeContext: "high-school senior",
      yearHint: "senior year October",
      narrative:
        "NY high-school senior, parent used location tracking, lost two jobs, missed 2-3 weeks of school, told YABC would not affect permanent record but it appeared later.",
    });

    expect(brief.neverMakesDefinitiveLegalConclusions).toBe(true);
    expect(brief.timeline.length).toBeGreaterThanOrEqual(5);
    expect(brief.issueAnalyses).toHaveLength(12);
    expect(brief.interventionPoints.some((i) => i.whoMightHaveActed.includes("McKinney"))).toBe(
      true,
    );
    expect(brief.citedLegal.some((r) => r.id.includes("3209") || r.citation.includes("3209"))).toBe(
      true,
    );
    expect(brief.citedLegal.some((r) => /FERPA|1232g/i.test(r.citation))).toBe(true);
    expect(brief.actionPlan.recordsToRequest.length).toBeGreaterThan(5);
    expect(brief.disclaimers.join(" ")).toMatch(/not a lawyer/i);
    expect(brief.timeline[0].layers.userReport.length).toBeGreaterThan(0);
    expect(brief.timeline[0].layers.unknown.length).toBeGreaterThan(0);
  });
});
