import { describe, expect, it } from "vitest";
import {
  ADMIN_EDUCATION_ADVOCACY_SEED,
  EMPTY_TIMELINE_INTAKE,
  AUDIENCE_MODE_COPY,
} from "../admin-seed-case";
import { buildEducationAccessCoercionReview } from "../advocacy/coercion-review";

describe("admin seed vs public blank intake", () => {
  it("keeps founder case in admin seed only", () => {
    expect(ADMIN_EDUCATION_ADVOCACY_SEED.coercionNarrative).toMatch(/YABC/);
    expect(EMPTY_TIMELINE_INTAKE.freeformRecollection).toBe("");
    expect(EMPTY_TIMELINE_INTAKE.stateProvince).toBe("");
    expect(Object.keys(AUDIENCE_MODE_COPY)).toEqual([
      "my_situation",
      "helping_someone",
      "explore_tools",
    ]);
  });

  it("derives whatIUnderstand from a new user narrative", async () => {
    const brief = await buildEducationAccessCoercionReview({
      jurisdiction: { country: "US", stateProvince: "CA" },
      gradeContext: "11th grade",
      yearHint: "last spring",
      narrative:
        "I moved schools after my family lost housing. I missed about ten days and a counselor suggested an alternative program.",
    });
    expect(brief.whatIUnderstand.join(" ")).toMatch(/CA|11th|housing|alternative/i);
    expect(brief.whatIUnderstand.join(" ")).not.toMatch(/iPhone/);
    expect(brief.neverMakesDefinitiveLegalConclusions).toBe(true);
  });
});
