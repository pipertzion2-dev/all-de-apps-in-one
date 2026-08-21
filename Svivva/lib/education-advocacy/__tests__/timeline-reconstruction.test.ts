import { describe, expect, it } from "vitest";
import {
  buildEducationTimelineReconstruction,
  synthesizeEventsFromIntake,
} from "../advocacy/timeline-reconstruction";

describe("Education Timeline Reconstruction", () => {
  it("synthesizes layered events from incomplete senior-year recollection", () => {
    const events = synthesizeEventsFromIntake({
      stateProvince: "NY",
      grade: "12 / senior",
      approximateSchoolYear: "senior year",
      employmentSituation: "two jobs",
      freeformRecollection:
        "Around October of senior year my parent used location tracking, I lost both jobs, did not attend for about 2-3 weeks, then was told YABC would not affect my permanent record but it appeared later.",
    });
    expect(events.length).toBeGreaterThanOrEqual(4);
    expect(events.some((e) => (e.tags || []).includes("extended_absence"))).toBe(true);
    expect(events.some((e) => (e.tags || []).includes("yabc"))).toBe(true);
  });

  it("builds full reconstruction with interruptions, housing review, and no legal conclusions", async () => {
    const reconstruction = await buildEducationTimelineReconstruction({
      intake: {
        country: "US",
        stateProvince: "NY",
        district: "NYC DOE",
        grade: "senior / 12",
        approximateSchoolYear: "senior year (October window)",
        employmentSituation: "working two jobs",
        housingLivingSituation: "living situation disrupted by family conflict; details incomplete",
        periodsUnableToAttend: "about 2-3 weeks",
        transfersOrAlternativePrograms: "YABC",
        freeformRecollection:
          "I was close to completing high school. Parent tracked my iPhone location, put me in a car, interfered with work and school. Missed school 2-3 weeks. Told YABC would not appear on permanent record; later discovered program on record.",
      },
    });

    expect(reconstruction.neverMakesDefinitiveLegalConclusions).toBe(true);
    expect(reconstruction.neverAssumesLegalViolation).toBe(true);
    expect(reconstruction.events.length).toBeGreaterThanOrEqual(4);
    expect(reconstruction.educationAccessInterruptions.length).toBeGreaterThanOrEqual(1);
    expect(reconstruction.housingInstabilityReview.determination).toContain("not_determined");
    expect(reconstruction.alternativeProgramTransitionReview.triggered).toBe(true);
    expect(
      reconstruction.alternativeProgramTransitionReview.representationsMadeToStudent[0]
        ?.classification,
    ).toBe("Reported Statement — Verification Needed");
    expect(reconstruction.potentialInterventionPoints.length).toBeGreaterThanOrEqual(1);
    expect(reconstruction.seniorYearEducationImpactReview.triggered).toBe(true);
    expect(reconstruction.evidenceNeeded.length).toBeGreaterThan(3);
    expect(reconstruction.lanes).toHaveLength(7);
    expect(reconstruction.disclaimers.join(" ")).toMatch(/not a lawyer/i);
    expect(reconstruction.events.every((e) => e.evidenceStatusLabel.length > 0)).toBe(true);
    expect(
      reconstruction.events
        .filter((e) => e.labels.includes("Student-Reported Parent/Guardian Action"))
        .every((e) => e.evidenceStatus === "user_reported"),
    ).toBe(true);
  });

  it("allows continuing with almost no dates", async () => {
    const reconstruction = await buildEducationTimelineReconstruction({
      intake: {
        stateProvince: "NY",
        freeformRecollection:
          "I do not remember exact dates. Sometime after I stopped working I left my school path.",
      },
    });
    expect(reconstruction.events.length).toBeGreaterThanOrEqual(1);
    expect(reconstruction.questionsStillUnanswered.length).toBeGreaterThan(0);
  });
});
