import { ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE, RECORDING_LAW_WARNING } from "../disclaimers";
import { SCHEMA_VERSION } from "../types";
import { RightsLawEngine } from "../legal/engine";
import type { LegalInformationRecord } from "../adapters/interfaces";
import { InMemoryResourceRegistry } from "../resources/registry";

/** Evidence status — never treat user recollection as independently established fact. */
export type TimelineEvidenceStatus =
  | "documented"
  | "partially_documented"
  | "user_reported"
  | "disputed"
  | "unknown_needs_verification";

export const EVIDENCE_STATUS_LABEL: Record<TimelineEvidenceStatus, string> = {
  documented: "Documented",
  partially_documented: "Partially Documented",
  user_reported: "User-Reported",
  disputed: "Disputed",
  unknown_needs_verification: "Unknown / Needs Verification",
};

export type TimelineLaneId =
  | "student_experience"
  | "education_attendance"
  | "parent_guardian_actions"
  | "school_knowledge_response"
  | "employment"
  | "housing"
  | "records_evidence";

export const TIMELINE_LANE_LABEL: Record<TimelineLaneId, string> = {
  student_experience: "Student Experience",
  education_attendance: "Education / Attendance",
  parent_guardian_actions: "Parent / Guardian Actions",
  school_knowledge_response: "School Knowledge & Response",
  employment: "Employment",
  housing: "Housing",
  records_evidence: "Records / Evidence",
};

export type TimelineSourceKind =
  | "student_recollection"
  | "attendance_record"
  | "transcript"
  | "text_message"
  | "email"
  | "employment_record"
  | "school_form"
  | "screenshot"
  | "location_history"
  | "witness"
  | "agency_record"
  | "other";

export type IntakeProfile = {
  stateProvince?: string;
  country?: string;
  district?: string;
  schoolName?: string;
  approximateSchoolYear?: string;
  studentAgeAtTime?: string;
  grade?: string;
  expectedGraduationDate?: string;
  lastNormalAttendance?: string;
  housingLivingSituation?: string;
  employmentSituation?: string;
  majorFamilyHouseholdChanges?: string;
  periodsUnableToAttend?: string;
  transfersOrAlternativePrograms?: string;
  graduationOrOutcome?: string;
  freeformRecollection?: string;
};

export type UserTimelineEventInput = {
  id?: string;
  dateExactOrApproximate: string;
  event: string;
  peopleOrganizations?: string[];
  sourceKind?: TimelineSourceKind;
  sourceDetail?: string;
  evidenceStatus?: TimelineEvidenceStatus;
  educationalConsequence?: string;
  educationalImpact?: string;
  causationLabel?: "supported" | "possible_connection" | "unknown";
  lanes?: TimelineLaneId[];
  tags?: string[];
};

export type DocumentNoteInput = {
  name: string;
  kind?: string;
  /** User-provided extraction notes — never treated as the original. */
  aiInterpretation?: string;
  originalPreserved: true;
  datesMentioned?: string[];
};

export type TimelineReconstructionInput = {
  intake: IntakeProfile;
  events?: UserTimelineEventInput[];
  documents?: DocumentNoteInput[];
  /** Hide lanes in the rendered reconstruction. */
  hiddenLanes?: TimelineLaneId[];
};

export type ReconstructedEvent = {
  id: string;
  sortKey: string;
  dateExactOrApproximate: string;
  event: string;
  peopleOrganizations: string[];
  sourceKind: TimelineSourceKind;
  sourceDetail: string;
  evidenceStatus: TimelineEvidenceStatus;
  evidenceStatusLabel: string;
  educationalConsequence?: string;
  educationalImpact?: string;
  causationLabel: "supported" | "possible_connection" | "unknown";
  chain?: { event: string; consequence: string; educationalImpact: string };
  lanes: TimelineLaneId[];
  markers: string[];
  schoolKnowledge?: {
    whatSchoolKnew: string;
    whenSchoolKnew: string;
    whoAtSchoolKnew: string;
    whatHappenedAfterward: string;
    status: TimelineEvidenceStatus;
  };
  labels: string[];
};

export type EducationAccessInterruption = {
  id: string;
  label: "Education Access Interruption";
  firstMissedDayApprox: string;
  lastMissedDayApprox: string;
  approximateSchoolDaysMissed: string;
  attendanceCodes: string;
  schoolContactedStudent: string;
  schoolContactedParent: string;
  teachersAttemptedContact: string;
  counselorInvolved: string;
  attendanceIntervention: string;
  housingInstabilityDiscussed: string;
  whatHappenedImmediatelyAfter: string;
  relatedEventIds: string[];
  note: string;
};

export type HousingInstabilityReview = {
  triggered: boolean;
  indicatorsFromIntake: string[];
  questionsToDetermineEligibility: string[];
  unaccompaniedYouthQuestions: string[];
  potentiallyRelevantCitations: Array<{ title: string; citation: string; url: string }>;
  determination: "not_determined — additional facts required";
};

export type AlternativeProgramTransitionReview = {
  triggered: boolean;
  originalSchool: string;
  creditsCompletedAtTime: string;
  graduationRequirementsRemaining: string;
  expectedGraduationBeforeChange: string;
  whoFirstSuggested: string;
  whatStudentWasTold: string;
  whatParentWasTold: string;
  writtenMaterialsProvided: string;
  alternativesDiscussed: string;
  studentWantedPlacement: string;
  enrollmentTransferDate: string;
  howChangeAppearedInRecords: string;
  graduationTimingChanged: string;
  educationalConsequences: string;
  representationsMadeToStudent: Array<{
    statement: string;
    classification: "Reported Statement — Verification Needed";
    supportingOrContradictingEvidence: string;
  }>;
};

export type PotentialInterventionPoint = {
  id: string;
  label: "Potential Intervention Point";
  trigger: string;
  whoCouldHaveResponded: string;
  evidenceNeeded: string[];
  lawPolicyGuidanceMayHaveApplied: string[];
  relatedEventIds: string[];
  nonAssumption: "Never state that someone failed unless evidence and applicable requirements support that conclusion.";
};

export type PossibleRecordDiscrepancy = {
  id: string;
  studentRecollection: string;
  schoolOrDocumentRecord: string;
  status: "Possible discrepancy — additional records needed";
  explanation: string;
};

export type EvidenceNeededItem = {
  question: string;
  bestEvidence: string;
  likelyRecordHolder: string;
  suggestedRequest: string;
};

export type SeniorYearEducationImpactReview = {
  triggered: boolean;
  creditsAlreadyCompleted: string;
  creditsRemaining: string;
  graduationRequirements: string;
  expectedGraduationTimeline: string;
  attendanceImmediatelyBefore: string;
  programBefore: string;
  programAfter: string;
  onTrackToGraduate: string;
  proximityToCompletion: string;
  pathwayOrTimelineChanged: string;
  presentationNote: string;
};

export type TimelineReconstruction = {
  protocol: "ZZAI-Education-Timeline-Reconstruction/1.0";
  schemaVersion: string;
  createdAt: string;
  disclaimers: string[];
  coreQuestions: {
    whatHappened: string;
    whatEvidenceSupportsIt: string;
    whoKnewAndWhen: string;
    educationalResult: string;
    interventionPointsMayHaveMattered: string;
  };
  intakeSummary: IntakeProfile;
  events: ReconstructedEvent[];
  lanes: Array<{ id: TimelineLaneId; label: string; eventIds: string[]; hidden: boolean }>;
  educationAccessInterruptions: EducationAccessInterruption[];
  housingInstabilityReview: HousingInstabilityReview;
  parentGuardianActionIds: string[];
  schoolKnowledgeLaneEventIds: string[];
  potentialInterventionPoints: PotentialInterventionPoint[];
  alternativeProgramTransitionReview: AlternativeProgramTransitionReview;
  possibleRecordDiscrepancies: PossibleRecordDiscrepancy[];
  evidenceNeeded: EvidenceNeededItem[];
  documentNotes: Array<{
    name: string;
    kind: string;
    originalDocument: "preserved — not altered";
    aiInterpretation: string;
    interpretationCertainty: "user_supplied" | "uncertain" | "none";
  }>;
  keyTurningPoints: Array<{
    eventId: string;
    title: string;
    why: string;
    evidenceStrength: string;
  }>;
  evidenceStrengthSummary: {
    strongDocumentation: string[];
    partialDocumentation: string[];
    userRecollectionOnly: string[];
    conflictingEvidence: string[];
    unknown: string[];
    missingRecords: string[];
  };
  questionsStillUnanswered: string[];
  potentiallyRelevantProtections: Array<{
    title: string;
    citation: string;
    url: string;
    note: string;
  }>;
  seniorYearEducationImpactReview: SeniorYearEducationImpactReview;
  advocacyNextSteps: string[];
  neverAssumesLegalViolation: true;
  neverMakesDefinitiveLegalConclusions: true;
};

let seq = 0;
function eid(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq}`;
}

function blank(v?: string): string {
  const t = (v || "").trim();
  return t || "Unknown / not yet provided — user may continue with incomplete information";
}

function detectHousingIndicators(intake: IntakeProfile, text: string): string[] {
  const hay =
    `${intake.housingLivingSituation || ""} ${intake.majorFamilyHouseholdChanges || ""} ${text}`.toLowerCase();
  const checks: Array<[RegExp, string]> = [
    [
      /homeless|shelter|motel|couch.?surf|doubled.?up|temporary housing/,
      "Possible homelessness or temporary housing language",
    ],
    [
      /kicked out|thrown out|asked to leave|living apart|not living with (parent|guardian)/,
      "Possible living apart from parent/guardian",
    ],
    [
      /friends?('|’)s? (house|apartment|place)|relatives?|grandma|aunt|uncle/,
      "Possible staying with friends or relatives",
    ],
    [
      /frequent moves|moved (a lot|often)|unstable housing|housing (instability|conflict)/,
      "Possible frequent moves / housing instability",
    ],
    [
      /living situation|family conflict.*live|where (i|the student) could live/,
      "Family conflict affecting where student could live",
    ],
  ];
  return checks.filter(([re]) => re.test(hay)).map(([, label]) => label);
}

function detectYabcOrAlt(text: string, intake: IntakeProfile): boolean {
  const hay = `${intake.transfersOrAlternativePrograms || ""} ${text}`.toLowerCase();
  return /yabc|young adult borough|ged|hse|alternative (program|school|pathway)|transfer school/.test(
    hay,
  );
}

function detectSeniorYear(intake: IntakeProfile, text: string): boolean {
  const hay = `${intake.grade || ""} ${intake.approximateSchoolYear || ""} ${text}`.toLowerCase();
  return /senior|grade\s*12|12th|year\s*12/.test(hay);
}

function sortKeyFromDate(approx: string, index: number): string {
  const s = approx.toLowerCase();
  // Rough chronological buckets for known narrative patterns; unknown sorts last within bucket.
  if (/early fall|before october|baseline|normal attendance|dual employment|enrolled/.test(s))
    return `10-${String(index).padStart(3, "0")}`;
  if (/october|around october|parent|track|location|interference|car/.test(s))
    return `20-${String(index).padStart(3, "0")}`;
  if (/2.?3 week|two.?three week|absence|nonattendance|did not attend|missed school/.test(s))
    return `30-${String(index).padStart(3, "0")}`;
  if (/yabc|told to enter|permanent record|assurance|transfer|alternative/.test(s))
    return `40-${String(index).padStart(3, "0")}`;
  if (/later|discovered|transcript|appeared on/.test(s))
    return `50-${String(index).padStart(3, "0")}`;
  if (/thanksgiving|before thanksgiving/.test(s)) return `35-${String(index).padStart(3, "0")}`;
  return `25-${String(index).padStart(3, "0")}`;
}

/**
 * Seed events from intake + freeform recollection when the user has not yet
 * entered discrete events. Approximate dates are acceptable.
 */
export function synthesizeEventsFromIntake(intake: IntakeProfile): UserTimelineEventInput[] {
  const text = intake.freeformRecollection || "";
  const year = intake.approximateSchoolYear || "school year (exact year TBD)";
  const events: UserTimelineEventInput[] = [];

  if (
    intake.lastNormalAttendance ||
    intake.employmentSituation ||
    /senior|enrolled|working|jobs/.test(text.toLowerCase())
  ) {
    events.push({
      dateExactOrApproximate: blank(intake.lastNormalAttendance).startsWith("Unknown")
        ? `${year} — last period of normal attendance (approx.)`
        : intake.lastNormalAttendance!,
      event:
        "Period of relatively normal school attendance" +
        (intake.employmentSituation ? `; employment: ${intake.employmentSituation}` : "") +
        (intake.grade ? `; grade: ${intake.grade}` : ""),
      peopleOrganizations: ["Student", intake.schoolName || "School (name TBD)"].filter(Boolean),
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: ["student_experience", "education_attendance", "employment"],
      educationalConsequence: "Baseline enrollment and coursework underway",
      educationalImpact: "Student reports being on a traditional high-school path",
      causationLabel: "possible_connection",
      tags: ["baseline"],
    });
  }

  if (
    /location|iphone|track|put me in a car|interfer/.test(text.toLowerCase()) ||
    /parent|guardian/.test((intake.majorFamilyHouseholdChanges || "").toLowerCase())
  ) {
    events.push({
      dateExactOrApproximate: /october/i.test(text)
        ? `${year} — around October (approx.)`
        : `${year} — approximate date of reported parent/guardian interference`,
      event:
        "Student-reported parent/guardian action affecting ability to attend school and/or work (e.g., location tracking, transport, interference with independent attendance).",
      peopleOrganizations: ["Student", "Parent/Guardian"],
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: ["student_experience", "parent_guardian_actions", "employment", "housing"],
      educationalConsequence: "Possible interruption of travel to school and work",
      educationalImpact: "Possible start of extended nonattendance",
      causationLabel: "possible_connection",
      tags: ["parent_guardian_action", "student_reported_parent_guardian_action"],
    });
  }

  if (
    intake.periodsUnableToAttend ||
    /2.?3 week|two.?three week|did not attend|stopped attending|missed/.test(text.toLowerCase())
  ) {
    events.push({
      dateExactOrApproximate: blank(intake.periodsUnableToAttend).startsWith("Unknown")
        ? `${year} — extended nonattendance window (approx. duration from recollection)`
        : intake.periodsUnableToAttend!,
      event: "Extended period when student reports not attending school",
      peopleOrganizations: ["Student", intake.schoolName || "School (name TBD)"],
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: ["student_experience", "education_attendance", "school_knowledge_response"],
      educationalConsequence: "Consecutive absences / course interruption (reported)",
      educationalImpact: "Senior-year coursework and graduation path may have been interrupted",
      causationLabel: "possible_connection",
      tags: ["education_access_interruption", "extended_absence"],
    });
  }

  if (detectYabcOrAlt(text, intake)) {
    events.push({
      dateExactOrApproximate: `${year} — after absence window (approx.)`,
      event:
        "Alternative program / YABC (or similar) suggested; student reports relying on statements about how participation would appear on educational records",
      peopleOrganizations: [
        "Student",
        "Counselor/Administrator (identity TBD)",
        "Parent/Guardian (role TBD)",
        "YABC / alternative program",
      ],
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: [
        "student_experience",
        "education_attendance",
        "records_evidence",
        "school_knowledge_response",
      ],
      educationalConsequence: "Pathway change from traditional high school to alternative program",
      educationalImpact: "Possible change to transcript notation, school name, graduation timing",
      causationLabel: "possible_connection",
      tags: ["yabc", "alternative_program", "representation"],
    });
  }

  if (/discovered|appeared on|permanent record|transcript/.test(text.toLowerCase())) {
    events.push({
      dateExactOrApproximate: "Later (date TBD) — discovery of record content",
      event:
        "Student later discovered program/pathway information on educational record that student reports was inconsistent with prior assurances",
      peopleOrganizations: ["Student", "Records custodian / school"],
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: ["student_experience", "records_evidence"],
      educationalConsequence: "Perceived mismatch between assurances and record content",
      educationalImpact: "May affect informed-consent analysis and FERPA amendment review",
      causationLabel: "possible_connection",
      tags: ["record_accuracy"],
    });
  }

  if (intake.housingLivingSituation?.trim()) {
    events.push({
      dateExactOrApproximate: `${year} — housing/living situation (ongoing or during disruption)`,
      event: `Housing/living situation as reported: ${intake.housingLivingSituation}`,
      peopleOrganizations: ["Student", "Parent/Guardian (as applicable)"],
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: ["housing", "student_experience"],
      tags: ["housing"],
      causationLabel: "possible_connection",
    });
  }

  // If nothing matched, still create a single recollection event so the user can continue.
  if (!events.length && text.trim()) {
    events.push({
      dateExactOrApproximate: year,
      event: text.trim().slice(0, 2000),
      peopleOrganizations: ["Student"],
      sourceKind: "student_recollection",
      evidenceStatus: "user_reported",
      lanes: ["student_experience"],
      causationLabel: "unknown",
      tags: ["recollection"],
    });
  }

  return events;
}

function toReconstructed(ev: UserTimelineEventInput, index: number): ReconstructedEvent {
  const id = ev.id || eid("evt");
  const status = ev.evidenceStatus || "user_reported";
  const labels: string[] = [];
  const markers: string[] = [];
  const tags = ev.tags || [];

  if (
    tags.includes("student_reported_parent_guardian_action") ||
    tags.includes("parent_guardian_action")
  ) {
    labels.push("Student-Reported Parent/Guardian Action");
  }
  if (tags.includes("education_access_interruption") || tags.includes("extended_absence")) {
    markers.push("Education Access Interruption");
  }
  if (tags.includes("yabc") || tags.includes("alternative_program")) {
    markers.push("Alternative Program Transition");
  }
  if (tags.includes("housing")) {
    markers.push("Housing Instability Review Trigger");
  }

  const consequence = ev.educationalConsequence;
  const impact = ev.educationalImpact;
  const chain =
    consequence && impact ? { event: ev.event, consequence, educationalImpact: impact } : undefined;

  const schoolKnowledge =
    (ev.lanes || []).includes("school_knowledge_response") || tags.includes("extended_absence")
      ? {
          whatSchoolKnew:
            "Unknown / Needs Verification — attendance marks may establish awareness of absences",
          whenSchoolKnew: "Unknown — compare first absence date to outreach logs",
          whoAtSchoolKnew: "Unknown — teachers, attendance office, counselor (TBD)",
          whatHappenedAfterward: "Unknown — outreach, coding, transfer, or no documented response",
          status: "unknown_needs_verification" as TimelineEvidenceStatus,
        }
      : undefined;

  return {
    id,
    sortKey: sortKeyFromDate(ev.dateExactOrApproximate + " " + ev.event, index),
    dateExactOrApproximate: ev.dateExactOrApproximate,
    event: ev.event,
    peopleOrganizations: ev.peopleOrganizations || [],
    sourceKind: ev.sourceKind || "student_recollection",
    sourceDetail: ev.sourceDetail || "Student recollection (approximate timing acceptable)",
    evidenceStatus: status,
    evidenceStatusLabel: EVIDENCE_STATUS_LABEL[status],
    educationalConsequence: consequence,
    educationalImpact: impact,
    causationLabel: ev.causationLabel || "possible_connection",
    chain,
    lanes: ev.lanes?.length ? ev.lanes : (["student_experience"] as TimelineLaneId[]),
    markers,
    schoolKnowledge,
    labels,
  };
}

function buildHousingReview(
  intake: IntakeProfile,
  text: string,
  legal: LegalInformationRecord[],
): HousingInstabilityReview {
  const indicators = detectHousingIndicators(intake, text);
  const cite = (...ids: string[]) =>
    legal
      .filter((r) => ids.includes(r.id))
      .map((r) => ({ title: r.title, citation: r.citation, url: r.sourceUrl }));

  return {
    triggered: indicators.length > 0 || /living situation|housing/i.test(text),
    indicatorsFromIntake: indicators.length
      ? indicators
      : ["Living situation referenced — facts incomplete for eligibility analysis"],
    questionsToDetermineEligibility: [
      "Where did the student sleep each night during the relevant period?",
      "Was that nighttime residence fixed, regular, and adequate?",
      "Was the student sharing housing of others due to loss of housing or economic hardship?",
      "Did the student stay in a shelter, motel, car, or similar setting?",
      "How often did the student’s nighttime residence change?",
    ],
    unaccompaniedYouthQuestions: [
      "Was the student in the physical custody of a parent or guardian during that period?",
      "If not, did the student also lack a fixed, regular, and adequate nighttime residence?",
      "Who made day-to-day decisions about where the student stayed?",
    ],
    potentiallyRelevantCitations: cite(
      "us-mckinney-vento-unaccompanied",
      "us-ny-educ-3209-homeless",
      "us-mckinney-vento-overview",
      "us-nysed-mckinney-vento-guidance",
    ),
    determination: "not_determined — additional facts required",
  };
}

function buildAltProgramReview(
  intake: IntakeProfile,
  text: string,
  events: ReconstructedEvent[],
): AlternativeProgramTransitionReview {
  const triggered =
    detectYabcOrAlt(text, intake) ||
    events.some((e) => e.markers.includes("Alternative Program Transition"));
  const recordAssurance = /not appear|would not|permanent record|affect.*(record|transcript)/i.test(
    text,
  );
  return {
    triggered,
    originalSchool: blank(intake.schoolName),
    creditsCompletedAtTime:
      "Unknown / Needs Verification — obtain credit audit as of transfer date",
    graduationRequirementsRemaining: "Unknown / Needs Verification",
    expectedGraduationBeforeChange: blank(intake.expectedGraduationDate),
    whoFirstSuggested: "Unknown — counselor, administrator, parent, or other (Verification Needed)",
    whatStudentWasTold: recordAssurance
      ? "Student reports being told YABC/program participation would not appear on or affect the permanent educational record"
      : blank(intake.transfersOrAlternativePrograms),
    whatParentWasTold: "Unknown / Needs Verification",
    writtenMaterialsProvided: "Unknown / Needs Verification — seek referral packet and brochures",
    alternativesDiscussed: "Unknown / Needs Verification",
    studentWantedPlacement: recordAssurance
      ? "Student reports would not have agreed if told the record would show the program"
      : "Unknown / Needs Verification",
    enrollmentTransferDate: "Unknown / Needs Verification — enrollment/transfer forms",
    howChangeAppearedInRecords: recordAssurance
      ? "Student later reports seeing program information on the educational record"
      : blank(intake.graduationOrOutcome),
    graduationTimingChanged: "Unknown / Needs Verification",
    educationalConsequences: blank(intake.graduationOrOutcome),
    representationsMadeToStudent: recordAssurance
      ? [
          {
            statement:
              "Participation in YABC would not appear on or affect the permanent educational record",
            classification: "Reported Statement — Verification Needed",
            supportingOrContradictingEvidence:
              "No uploaded written disclosure yet. Transcript/permanent record showing program notation would tend to contradict the reported assurance; accurate written materials given before enrollment would tend to support that the student received correct information.",
          },
        ]
      : [],
  };
}

function buildInterruptions(events: ReconstructedEvent[]): EducationAccessInterruption[] {
  const abs = events.filter(
    (e) =>
      e.markers.includes("Education Access Interruption") ||
      /absence|nonattendance|did not attend|unable to attend/i.test(e.event),
  );
  if (!abs.length) return [];
  return abs.map((e) => ({
    id: `interrupt_${e.id}`,
    label: "Education Access Interruption" as const,
    firstMissedDayApprox: "Unknown / Needs Verification — attendance register",
    lastMissedDayApprox: "Unknown / Needs Verification — attendance register",
    approximateSchoolDaysMissed: /2.?3 week/i.test(e.dateExactOrApproximate + e.event)
      ? "Approximately 2–3 weeks (user recollection — convert to school days with calendar)"
      : "Unknown — user-reported duration pending attendance record",
    attendanceCodes: "Unknown / Needs Verification",
    schoolContactedStudent: "Unknown / Needs Verification",
    schoolContactedParent: "Unknown / Needs Verification",
    teachersAttemptedContact: "Unknown / Needs Verification",
    counselorInvolved: "Unknown / Needs Verification",
    attendanceIntervention: "Unknown / Needs Verification",
    housingInstabilityDiscussed: "Unknown / Needs Verification",
    whatHappenedImmediatelyAfter: events.find((x) =>
      x.markers.includes("Alternative Program Transition"),
    )
      ? "User reports alternative-program / YABC pathway discussion or placement"
      : "Unknown / Needs Verification",
    relatedEventIds: [e.id],
    note: "Do not automatically characterize this absence as truancy, dropping out, educational neglect, or voluntary withdrawal.",
  }));
}

function buildInterventions(
  events: ReconstructedEvent[],
  housing: HousingInstabilityReview,
  alt: AlternativeProgramTransitionReview,
): PotentialInterventionPoint[] {
  const points: PotentialInterventionPoint[] = [];
  const nonAssumption =
    "Never state that someone failed unless evidence and applicable requirements support that conclusion." as const;

  if (events.some((e) => e.markers.includes("Education Access Interruption"))) {
    points.push({
      id: "int_absence",
      label: "Potential Intervention Point",
      trigger: "Sudden or extended consecutive absences during the school year",
      whoCouldHaveResponded: "Teachers; attendance office; attendance teacher; counselor",
      evidenceNeeded: [
        "Daily attendance marks and code legend",
        "Outreach / call logs",
        "Counselor notes during the absence window",
      ],
      lawPolicyGuidanceMayHaveApplied: [
        "N.Y. Educ. Law §§ 3205, 3210 et seq. (attendance framework — confirm text then in force)",
        "Local district attendance and discharge procedures",
      ],
      relatedEventIds: events
        .filter((e) => e.markers.includes("Education Access Interruption"))
        .map((e) => e.id),
      nonAssumption,
    });
  }

  if (housing.triggered) {
    points.push({
      id: "int_housing",
      label: "Potential Intervention Point",
      trigger:
        "Indicators of housing instability, displacement, or living apart from parent/guardian",
      whoCouldHaveResponded:
        "Counselor; social worker; McKinney-Vento / Students in Temporary Housing liaison",
      evidenceNeeded: [
        "SIS address/residence history",
        "MV / STH screening forms",
        "Nighttime residence facts for eligibility analysis",
      ],
      lawPolicyGuidanceMayHaveApplied: housing.potentiallyRelevantCitations.map(
        (c) => `${c.title} (${c.citation})`,
      ),
      relatedEventIds: events.filter((e) => e.lanes.includes("housing")).map((e) => e.id),
      nonAssumption,
    });
  }

  if (alt.triggered) {
    points.push({
      id: "int_yabc",
      label: "Potential Intervention Point",
      trigger:
        "Abrupt senior-year pathway change / alternative-program referral; student reluctance or reliance on record assurances",
      whoCouldHaveResponded: "Guidance counselor; administrator; YABC intake staff",
      evidenceNeeded: [
        "Written YABC/referral disclosures",
        "Transfer/discharge forms with dates and signatures",
        "Notes listing alternatives discussed",
      ],
      lawPolicyGuidanceMayHaveApplied: [
        "NYC DOE YABC program guidance (if NYC)",
        "District transfer counseling procedures",
        "FERPA inspection rights regarding what actually posted to the record (20 U.S.C. § 1232g; 34 C.F.R. Part 99)",
      ],
      relatedEventIds: events
        .filter((e) => e.markers.includes("Alternative Program Transition"))
        .map((e) => e.id),
      nonAssumption,
    });
  }

  return points;
}

function buildEvidenceNeeded(
  intake: IntakeProfile,
  alt: AlternativeProgramTransitionReview,
): EvidenceNeededItem[] {
  const items: EvidenceNeededItem[] = [
    {
      question: "What were the exact dates and codes for the extended absence?",
      bestEvidence: "Complete attendance history with code legend for the school year",
      likelyRecordHolder: "School attendance office / district SIS",
      suggestedRequest:
        "Please produce my full daily attendance record and absence-code legend for [school year].",
    },
    {
      question: "What enrollment, discharge, and transfer actions were recorded?",
      bestEvidence: "Enrollment/discharge/transfer forms and SIS status history",
      likelyRecordHolder: "Pupil accounting / registrar",
      suggestedRequest:
        "Please produce all enrollment, discharge, and transfer records from [date range].",
    },
    {
      question: "What does the permanent educational record show about schools/programs?",
      bestEvidence: "Official and unofficial transcripts; cumulative/permanent file",
      likelyRecordHolder: "Transcript office / guidance / district records custodian",
      suggestedRequest:
        "Please produce my complete transcript(s) and cumulative/permanent record under FERPA.",
    },
    {
      question: "What did school staff know about housing or barriers to attendance, and when?",
      bestEvidence: "Counselor notes, emails, phone logs, meeting records",
      likelyRecordHolder: "Guidance office / school administration",
      suggestedRequest:
        "Please produce counselor notes and attendance-outreach logs for [absence window].",
    },
  ];

  if (alt.triggered) {
    items.push({
      question:
        "What written disclosures were made about how YABC/alternative placement appears on records?",
      bestEvidence: "YABC referral/enrollment packet, brochures, emails",
      likelyRecordHolder: "Guidance office / YABC site",
      suggestedRequest:
        "Please produce all YABC or alternative-program referral and enrollment documents in my file.",
    });
  }

  if (intake.employmentSituation || /job|employ/i.test(intake.freeformRecollection || "")) {
    items.push({
      question: "When did employment end relative to the school disruption?",
      bestEvidence: "Employer termination/last-day records, paystubs, schedules",
      likelyRecordHolder: "Former employers / student personal records",
      suggestedRequest: "Request written confirmation of last day worked for each job.",
    });
  }

  return items;
}

function buildSeniorReview(intake: IntakeProfile, text: string): SeniorYearEducationImpactReview {
  const triggered = detectSeniorYear(intake, text);
  return {
    triggered,
    creditsAlreadyCompleted: "Unknown / Needs Verification — credit audit before disruption",
    creditsRemaining: "Unknown / Needs Verification",
    graduationRequirements:
      "Unknown / Needs Verification — district graduation policy then in force",
    expectedGraduationTimeline: blank(intake.expectedGraduationDate),
    attendanceImmediatelyBefore: blank(intake.lastNormalAttendance),
    programBefore: intake.schoolName
      ? `Traditional program at ${intake.schoolName} (as reported)`
      : "Traditional high-school program (school name TBD)",
    programAfter: detectYabcOrAlt(text, intake)
      ? "YABC / alternative program (as reported)"
      : blank(intake.transfersOrAlternativePrograms),
    onTrackToGraduate: /close to completing|near.*graduat/i.test(text)
      ? "Student reports being close to completing — verify with credit audit (User Recollection Only until documented)"
      : "Unknown / Needs Verification",
    proximityToCompletion: /close to completing/i.test(text)
      ? "Reported as close to completion in senior year — exact credits TBD"
      : "Unknown / Needs Verification",
    pathwayOrTimelineChanged: detectYabcOrAlt(text, intake)
      ? "Possible Connection: pathway changed to alternative program; graduation timing change Unknown / Needs Verification"
      : blank(intake.graduationOrOutcome),
    presentationNote:
      "Senior-Year Education Impact Review is a factual reconstruction checklist — not speculation about legal liability.",
  };
}

/**
 * Build an Education Timeline Reconstruction from intake, optional discrete
 * events, and optional document notes. Incomplete information is allowed.
 */
export async function buildEducationTimelineReconstruction(
  input: TimelineReconstructionInput,
  legalEngine = new RightsLawEngine(),
): Promise<TimelineReconstruction> {
  seq = 0;
  const createdAt = new Date().toISOString();
  const intake = input.intake;
  const country = intake.country || "US";
  const stateProvince = intake.stateProvince || "NY";
  const text = [
    intake.freeformRecollection,
    intake.housingLivingSituation,
    intake.transfersOrAlternativePrograms,
    intake.periodsUnableToAttend,
    intake.majorFamilyHouseholdChanges,
  ]
    .filter(Boolean)
    .join("\n");

  const rawEvents =
    input.events && input.events.length > 0 ? input.events : synthesizeEventsFromIntake(intake);

  const events = rawEvents
    .map((e, i) => toReconstructed(e, i))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.id.localeCompare(b.id));

  const hidden = new Set(input.hiddenLanes || []);
  const laneIds = Object.keys(TIMELINE_LANE_LABEL) as TimelineLaneId[];
  const lanes = laneIds.map((id) => ({
    id,
    label: TIMELINE_LANE_LABEL[id],
    eventIds: events.filter((e) => e.lanes.includes(id)).map((e) => e.id),
    hidden: hidden.has(id),
  }));

  const legalBundles = await Promise.all([
    legalEngine.query({ country, stateProvince, topic: "homeless" }),
    legalEngine.query({ country, stateProvince, topic: "ferpa" }),
    legalEngine.query({ country, stateProvince, topic: "attendance" }),
    legalEngine.query({ country, stateProvince, topic: "yabc" }),
  ]);
  const legalMap = new Map<string, LegalInformationRecord>();
  for (const b of legalBundles) for (const r of b.records) legalMap.set(r.id, r);
  const legal = [...legalMap.values()];

  const housing = buildHousingReview(intake, text, legal);
  const alt = buildAltProgramReview(intake, text, events);
  const interruptions = buildInterruptions(events);
  const interventions = buildInterventions(events, housing, alt);
  const evidenceNeeded = buildEvidenceNeeded(intake, alt);
  const senior = buildSeniorReview(intake, text);

  const parentGuardianActionIds = events
    .filter((e) => e.labels.includes("Student-Reported Parent/Guardian Action"))
    .map((e) => e.id);

  const schoolKnowledgeLaneEventIds = events
    .filter((e) => e.lanes.includes("school_knowledge_response") || e.schoolKnowledge)
    .map((e) => e.id);

  const possibleRecordDiscrepancies: PossibleRecordDiscrepancy[] = [];
  if (alt.representationsMadeToStudent.length) {
    possibleRecordDiscrepancies.push({
      id: "disc_yabc_assurance",
      studentRecollection:
        "Told that YABC/program would not appear on or affect the permanent educational record",
      schoolOrDocumentRecord:
        "Student later reports seeing program information on the educational record (document not yet uploaded)",
      status: "Possible discrepancy — additional records needed",
      explanation:
        "Compare written enrollment disclosures and the official transcript/permanent record. Do not declare the official record incorrect without the documents.",
    });
  }

  const documentNotes = (input.documents || []).map((d) => ({
    name: d.name,
    kind: d.kind || "other",
    originalDocument: "preserved — not altered" as const,
    aiInterpretation: d.aiInterpretation || "No AI interpretation supplied — dates not extracted",
    interpretationCertainty: d.aiInterpretation ? ("user_supplied" as const) : ("none" as const),
  }));

  const keyTurningPoints = (
    events.filter(
      (e) => e.markers.length > 0 || e.labels.includes("Student-Reported Parent/Guardian Action"),
    ).length
      ? events.filter(
          (e) =>
            e.markers.length > 0 || e.labels.includes("Student-Reported Parent/Guardian Action"),
        )
      : events.slice(0, 5)
  )
    .slice(0, 8)
    .map((e) => ({
      eventId: e.id,
      title: e.event.slice(0, 120),
      why:
        e.markers.join("; ") ||
        e.labels.join("; ") ||
        "Included as chronological anchor from intake",
      evidenceStrength: e.evidenceStatusLabel,
    }));

  const evidenceStrengthSummary = {
    strongDocumentation: events
      .filter((e) => e.evidenceStatus === "documented")
      .map((e) => e.event.slice(0, 100)),
    partialDocumentation: events
      .filter((e) => e.evidenceStatus === "partially_documented")
      .map((e) => e.event.slice(0, 100)),
    userRecollectionOnly: events
      .filter((e) => e.evidenceStatus === "user_reported")
      .map((e) => e.event.slice(0, 100)),
    conflictingEvidence: events
      .filter((e) => e.evidenceStatus === "disputed")
      .map((e) => e.event.slice(0, 100)),
    unknown: events
      .filter((e) => e.evidenceStatus === "unknown_needs_verification")
      .map((e) => e.event.slice(0, 100)),
    missingRecords: evidenceNeeded.map((e) => e.bestEvidence),
  };

  const questionsStillUnanswered = [
    "Exact school name, district/borough, and calendar year?",
    "First and last missed school days (from attendance register)?",
    "Nighttime residence and custody facts during the disruption?",
    "Who first suggested the alternative program, and what was said in writing?",
    "What did the school document as the reason for transfer/discharge?",
    "Exact transcript/permanent-record wording discovered later?",
    ...(!intake.studentAgeAtTime
      ? ["Student age at key decision points (affects consent dynamics)?"]
      : []),
  ];

  const potentiallyRelevantProtections = legal.slice(0, 12).map((r) => ({
    title: r.title,
    citation: r.citation,
    url: r.sourceUrl,
    note: "Use the version in effect at the time of each event when available; this catalog entry is a citation pointer, not a case determination.",
  }));

  const registry = new InMemoryResourceRegistry();
  const nyAdvocacy = await registry.search({ jurisdiction: "US-NY" });
  const advocacyNextSteps = [
    "Continue the reconstruction with approximate dates — incomplete information is allowed.",
    "Submit a written FERPA request for attendance, transcript, permanent/cumulative file, transfer/discharge, counselor notes, and alternative-program packet.",
    "Preserve originals of messages, screenshots, and employer records; do not alter originals when uploading.",
    "If housing instability indicators exist, ask the district McKinney-Vento / Students in Temporary Housing liaison whether a screening occurred.",
    "Contact a verified education advocacy or legal-aid organization before treating any reconstruction conclusion as a legal claim.",
    "Optionally seal documentary packages in the Education Proof Vault for integrity (does not prove wrongdoing).",
    ...nyAdvocacy.slice(0, 3).map((r) => {
      const url = r.contact_channels.find((c) => c.kind === "url")?.value;
      return `Directory: ${r.name}${url ? ` — ${url}` : ""}`;
    }),
  ];

  return {
    protocol: "ZZAI-Education-Timeline-Reconstruction/1.0",
    schemaVersion: SCHEMA_VERSION,
    createdAt,
    disclaimers: [
      ROLE_BOUNDARY,
      LEGAL_INFO_NOT_ADVICE,
      RECORDING_LAW_WARNING,
      "Do not assume that a parent, school, district, agency, or individual violated the law. Separate allegations and memories from independently documented facts.",
      "User-reported events are never presented as independently established fact.",
    ],
    coreQuestions: {
      whatHappened:
        "See chronological events below — mixture of user recollection and any documented sources provided.",
      whatEvidenceSupportsIt:
        "See evidenceStatus on each event and Evidence Needed for gaps. Most entries begin as User-Reported until records are attached.",
      whoKnewAndWhen:
        "See School Knowledge & Response lane — currently largely Unknown / Needs Verification without outreach logs and counselor notes.",
      educationalResult:
        interruptions.length || alt.triggered
          ? "Possible Connection between disruption, extended absence, and pathway/record changes — causation not established without records."
          : "Educational impact still being reconstructed from intake.",
      interventionPointsMayHaveMattered: `${interventions.length} potential intervention point(s) flagged for investigation — not findings of failure.`,
    },
    intakeSummary: intake,
    events,
    lanes,
    educationAccessInterruptions: interruptions,
    housingInstabilityReview: housing,
    parentGuardianActionIds,
    schoolKnowledgeLaneEventIds,
    potentialInterventionPoints: interventions,
    alternativeProgramTransitionReview: alt,
    possibleRecordDiscrepancies,
    evidenceNeeded,
    documentNotes,
    keyTurningPoints,
    evidenceStrengthSummary,
    questionsStillUnanswered,
    potentiallyRelevantProtections,
    seniorYearEducationImpactReview: senior,
    advocacyNextSteps,
    neverAssumesLegalViolation: true,
    neverMakesDefinitiveLegalConclusions: true,
  };
}
