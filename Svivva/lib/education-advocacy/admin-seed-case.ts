import type { IntakeProfile } from "./timeline-reconstruction";

/**
 * Founder / admin reference case — never pre-fill this for general users.
 * Loaded only when an admin explicitly chooses “Load admin reference case.”
 */
export const ADMIN_EDUCATION_ADVOCACY_SEED = {
  id: "admin_ny_senior_yabc_access",
  label: "Admin reference case — NY senior / access disruption",
  summary:
    "Private founder reference: senior-year disruption, housing/family conflict, extended absence, YABC pathway and record assurances. Not shown to other users by default.",
  coercionNarrative: `I was a high-school senior in New York State. Around October of my senior year, I was close to completing high school and was also working two jobs. Because of my living situation and actions by my parent, I lost access to both jobs and ultimately stopped attending my regular school. My parent used my iPhone/location information to track where I was, came to my location, put me in a car, and interfered with my ability to continue going to work and school. I then did not attend school at all for approximately 2–3 weeks. Afterward, I was told that I should enter a YABC program and that participation would not appear on or affect my permanent educational record. I relied on that information. I later discovered information about the program on my educational record. Had I known that beforehand, I would not have agreed to leave my existing high-school path for YABC.`,
  coercionMeta: {
    country: "US",
    stateProvince: "NY",
    district: "NYC DOE",
    gradeContext: "high-school senior",
    yearHint: "senior year (October window)",
  },
  timelineIntake: {
    country: "US",
    stateProvince: "NY",
    district: "NYC DOE (if applicable — edit if different)",
    schoolName: "",
    approximateSchoolYear: "Senior year (exact calendar year TBD)",
    studentAgeAtTime: "",
    grade: "12 / senior",
    expectedGraduationDate: "Expected spring of senior year (exact date TBD)",
    lastNormalAttendance: "Early fall / before October disruption (approx.)",
    housingLivingSituation:
      "Living situation was disrupted in connection with family/parent actions — details incomplete; nighttime residence facts still needed",
    employmentSituation: "Working two jobs until access was lost around the October window",
    majorFamilyHouseholdChanges:
      "Student reports parent used iPhone/location information, came to location, put student in a car, and interfered with work and school attendance",
    periodsUnableToAttend: "Approximately 2–3 weeks with no school attendance",
    transfersOrAlternativePrograms:
      "YABC — told participation would not appear on or affect permanent educational record; later saw program information on the record",
    graduationOrOutcome:
      "Pathway changed from traditional high school to YABC (outcome details TBD)",
    freeformRecollection: `I was a high-school senior in New York State. Around October of my senior year, I was close to completing high school and was also working two jobs. Because of my living situation and actions by my parent, I lost access to both jobs and ultimately stopped attending my regular school. My parent used my iPhone/location information to track where I was, came to my location, put me in a car, and interfered with my ability to continue going to work and school. I then did not attend school at all for approximately 2–3 weeks. Afterward, I was told that I should enter a YABC program and that participation would not appear on or affect my permanent educational record. I relied on that information. I later discovered information about the program on my educational record. Had I known that beforehand, I would not have agreed to leave my existing high-school path for YABC.

Approximate answers are fine. I don't remember every exact date.`,
  } satisfies IntakeProfile,
} as const;

export type AdvocacyAudienceMode = "my_situation" | "helping_someone" | "explore_tools";

export const EMPTY_TIMELINE_INTAKE: IntakeProfile = {
  country: "US",
  stateProvince: "",
  district: "",
  schoolName: "",
  approximateSchoolYear: "",
  studentAgeAtTime: "",
  grade: "",
  expectedGraduationDate: "",
  lastNormalAttendance: "",
  housingLivingSituation: "",
  employmentSituation: "",
  majorFamilyHouseholdChanges: "",
  periodsUnableToAttend: "",
  transfersOrAlternativePrograms: "",
  graduationOrOutcome: "",
  freeformRecollection: "",
};

export const AUDIENCE_MODE_COPY: Record<
  AdvocacyAudienceMode,
  { title: string; blurb: string; promptHint: string }
> = {
  my_situation: {
    title: "This is my situation",
    blurb: "Tell us what happened in your own words. Approximate dates are fine.",
    promptHint:
      "Start anywhere: school, grade, what changed, who was involved, and what you want next.",
  },
  helping_someone: {
    title: "I’m helping someone else",
    blurb:
      "Parents, advocates, counselors, and allies can reconstruct another person’s education story with care.",
    promptHint:
      "Describe their situation as you understand it. Note what is first-hand vs what they told you.",
  },
  explore_tools: {
    title: "Explore advocacy tools with AI",
    blurb:
      "Learn the workflows before diving into a full case — rights, timeline, vault, and help.",
    promptHint: "You can browse tools without sharing a personal story yet.",
  },
};
