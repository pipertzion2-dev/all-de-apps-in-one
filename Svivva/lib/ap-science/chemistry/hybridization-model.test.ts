import { describe, expect, it } from "vitest";
import {
  HYBRIDIZATION_MOLECULES,
  countSigmaPi,
  hybridizationFromDomains,
  sigmaPiFromOrder,
} from "./hybridization-model";
import { computeMasteryScore, gradeChoice } from "../mastery";

describe("hybridization scientific model", () => {
  it("maps domain counts to hybridization", () => {
    expect(hybridizationFromDomains(2)).toBe("sp");
    expect(hybridizationFromDomains(3)).toBe("sp2");
    expect(hybridizationFromDomains(4)).toBe("sp3");
  });

  it("accounts sigma/pi by bond order", () => {
    expect(sigmaPiFromOrder(1)).toEqual({ sigma: 1, pi: 0 });
    expect(sigmaPiFromOrder(2)).toEqual({ sigma: 1, pi: 1 });
    expect(sigmaPiFromOrder(3)).toEqual({ sigma: 1, pi: 2 });
  });

  it("matches catalog sigma/pi totals", () => {
    for (const m of HYBRIDIZATION_MOLECULES) {
      const counted = countSigmaPi(m.bonds);
      expect(counted.sigma).toBe(m.sigmaBonds);
      expect(counted.pi).toBe(m.piBonds);
    }
  });

  it("keeps water/ammonia electron geometry tetrahedral", () => {
    expect(HYBRIDIZATION_MOLECULES.find((m) => m.id === "h2o")?.electronGeometry).toBe(
      "tetrahedral",
    );
    expect(HYBRIDIZATION_MOLECULES.find((m) => m.id === "nh3")?.molecularGeometry).toBe(
      "trigonal_pyramidal",
    );
  });
});

describe("mastery helpers", () => {
  it("grades misconceptions on wrong choices", () => {
    const g = gradeChoice({
      correctChoiceId: "b",
      selectedId: "a",
      confidence: "high",
      misconceptionByChoice: { a: "sigma_vs_pi" },
    });
    expect(g.correct).toBe(false);
    expect(g.misconception).toBe("sigma_vs_pi");
  });

  it("scores empty attempts as zero", () => {
    expect(computeMasteryScore([])).toBe(0);
  });
});
