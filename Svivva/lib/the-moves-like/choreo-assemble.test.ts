import { describe, expect, it } from "vitest";
import { assembleFromLibrary, aiChoreographyStatus } from "./choreo-assemble";
import { buildIllustrativeDna } from "./motion-dna";
import { getMove, MOVES_LIBRARY } from "./moves-library";

describe("THE MOVES LIKE choreography", () => {
  it("assembles a labeled library routine (not AI)", () => {
    const routine = assembleFromLibrary({
      style: "hip-hop",
      level: "beginner",
      mood: "groovy",
      energy: "medium",
      durationSec: 32,
      preferredMoveIds: ["two-step", "cross-step"],
    });
    expect(routine.origin).toBe("library-assembled");
    expect(routine.clips.length).toBeGreaterThan(0);
    expect(routine.clips.every((c) => Boolean(getMove(c.moveId)))).toBe(true);
  });

  it("reports AI choreography as unavailable without a model", () => {
    const status = aiChoreographyStatus();
    expect(status.available).toBe(false);
  });

  it("builds illustrative Motion DNA without claiming measurement", () => {
    const dna = buildIllustrativeDna(MOVES_LIBRARY.slice(0, 2), "low");
    expect(dna.measured).toBe(false);
    expect(dna.label).toBe("illustrative");
    expect(dna.curves.length).toBe(2);
    expect(dna.particles.length).toBeGreaterThan(0);
  });
});
