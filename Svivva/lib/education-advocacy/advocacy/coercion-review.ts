import { ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE, RECORDING_LAW_WARNING } from "../disclaimers";
import { SCHEMA_VERSION } from "../types";
import { RightsLawEngine } from "../legal/engine";
import type { LegalInformationRecord } from "../adapters/interfaces";
import { InMemoryResourceRegistry } from "../resources/registry";
import type { ResourceRecord } from "../adapters/interfaces";
import { orchestrateAdvocacyMix } from "../orchestration/engine";

export type EvidenceLayer = {
  userReport: string[];
  documentMayEstablish: string[];
  otherPersonClaimed: string[];
  unknown: string[];
};

export type TimelineEventDraft = {
  id: string;
  approxWhen: string;
  title: string;
  layers: EvidenceLayer;
  documentsToSeek: string[];
};

export type InterventionPoint = {
  id: string;
  stage: string;
  whoMightHaveActed: string;
  whatRuleOrPolicyMayApply: string;
  citations: string[];
  evidenceNeededToEvaluateCompliance: string[];
  /** Explicitly not an accusation. */
  nonAssumption: "Do not assume misconduct merely because an intervention did not occur.";
};

export type IssueAnalysis = {
  questionNumber: number;
  question: string;
  potentiallyRelevantProtections: string[];
  whatIsKnownFromUserReport: string[];
  whatMustBeVerified: string[];
  evidenceThatWouldStrengthen: string[];
  evidenceThatWouldWeaken: string[];
  citedSources: Array<{ title: string; citation: string; url: string }>;
};

export type AdvocacyActionPlan = {
  recordsToRequest: Array<{ record: string; why: string; whereLikely: string }>;
  contacts: Array<{ name: string; type: string; how: string; ask: string[] }>;
  questionsToAsk: string[];
  potentiallyRelevantProtections: string[];
  factsNeedingVerification: string[];
  possibleProcesses: string[];
  nextImmediateSteps: string[];
};

export type CoercionReviewInput = {
  jurisdiction: { country: string; stateProvince: string; district?: string };
  gradeContext: string;
  narrative: string;
  yearHint?: string;
};

export type CoercionReviewBrief = {
  protocol: "ZZAI-Education-Access-Coercion-Review/1.0";
  schemaVersion: string;
  createdAt: string;
  disclaimers: string[];
  whatIUnderstand: string[];
  channelMixNotice: string;
  timeline: TimelineEventDraft[];
  interventionPoints: InterventionPoint[];
  issueAnalyses: IssueAnalysis[];
  actionPlan: AdvocacyActionPlan;
  citedLegal: LegalInformationRecord[];
  verifiedResources: ResourceRecord[];
  neverMakesDefinitiveLegalConclusions: true;
};

function cite(records: LegalInformationRecord[], ...ids: string[]) {
  return records
    .filter((r) => ids.includes(r.id))
    .map((r) => ({ title: r.title, citation: r.citation, url: r.sourceUrl }));
}

/**
 * Structured Education Access & Coercion Review for senior-year / housing /
 * transfer / YABC / records scenarios. Legal information only.
 */
export async function buildEducationAccessCoercionReview(
  input: CoercionReviewInput,
  legalEngine = new RightsLawEngine(),
): Promise<CoercionReviewBrief> {
  const createdAt = new Date().toISOString();
  const mix = orchestrateAdvocacyMix({
    userText: input.narrative,
    presetId: "protect_my_education",
    context: {
      identity: {
        schemaVersion: SCHEMA_VERSION,
        pseudonymousUserId: "review_session",
        ageRange: "18_plus",
        jurisdiction: input.jurisdiction,
        preferences: {},
      },
      education: {
        schemaVersion: SCHEMA_VERSION,
        currentSchoolStatus: "transferred",
        grade: "12",
        transfers: ["traditional HS → YABC"],
        educationalInterruptions: ["2-3 weeks nonattendance senior year"],
        desiredOutcome: "Understand rights, correct records, reconstruct timeline",
        futureEducationalGoal: "Accurate educational record and informed remedies",
      },
    },
  });

  const legalBundles = await Promise.all([
    legalEngine.query({
      country: input.jurisdiction.country,
      stateProvince: input.jurisdiction.stateProvince,
      topic: "homeless",
    }),
    legalEngine.query({
      country: input.jurisdiction.country,
      stateProvince: input.jurisdiction.stateProvince,
      topic: "ferpa",
    }),
    legalEngine.query({
      country: input.jurisdiction.country,
      stateProvince: input.jurisdiction.stateProvince,
      topic: "attendance",
    }),
    legalEngine.query({
      country: input.jurisdiction.country,
      stateProvince: input.jurisdiction.stateProvince,
      topic: "yabc",
    }),
    legalEngine.query({
      country: input.jurisdiction.country,
      stateProvince: input.jurisdiction.stateProvince,
      topic: "compulsory",
    }),
  ]);
  const citedLegal = dedupeRecords(legalBundles.flatMap((b) => b.records));

  const registry = new InMemoryResourceRegistry();
  // Ensure NY-focused resources exist for this review
  registry.upsert({
    resource_id: "ny-nysed-mckinney-vento",
    name: "NYSED — McKinney-Vento / Homeless Education",
    type: "education",
    jurisdiction: "US-NY",
    contact_channels: [{ kind: "url", value: "https://www.nysed.gov/essa/mckinney-vento" }],
    source: "https://www.nysed.gov/essa/mckinney-vento",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "homeless_education",
  });
  registry.upsert({
    resource_id: "nyc-sth",
    name: "NYC DOE — Students in Temporary Housing",
    type: "education",
    jurisdiction: "US-NY",
    service_area: "New York City",
    contact_channels: [
      {
        kind: "url",
        value:
          "https://www.schools.nyc.gov/school-life/special-situations/students-in-temporary-housing",
      },
    ],
    source:
      "https://www.schools.nyc.gov/school-life/special-situations/students-in-temporary-housing",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "homeless_education",
  });
  registry.upsert({
    resource_id: "nyc-yabc-info",
    name: "NYC DOE — Young Adult Borough Centers (YABC)",
    type: "education",
    jurisdiction: "US-NY",
    service_area: "New York City",
    contact_channels: [
      {
        kind: "url",
        value:
          "https://www.schools.nyc.gov/enrollment/other-ways-to-graduate/young-adult-borough-centers",
      },
    ],
    source:
      "https://www.schools.nyc.gov/enrollment/other-ways-to-graduate/young-adult-borough-centers",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "alternative_pathway",
  });
  registry.upsert({
    resource_id: "afc-nyc",
    name: "Advocates for Children of New York",
    type: "advocacy",
    jurisdiction: "US-NY",
    service_area: "New York City",
    contact_channels: [{ kind: "url", value: "https://www.advocatesforchildren.org/" }],
    source: "https://www.advocatesforchildren.org/",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "education_advocacy",
  });
  registry.upsert({
    resource_id: "legal-aid-nyc",
    name: "The Legal Aid Society (NYC)",
    type: "legal_aid",
    jurisdiction: "US-NY",
    service_area: "New York City",
    contact_channels: [{ kind: "url", value: "https://www.legalaidnyc.org/" }],
    source: "https://www.legalaidnyc.org/",
    verified_at: "2026-01-15",
    emergency_capability: false,
    legal_service_type: "legal_aid",
  });

  const nyResources = await registry.search({ jurisdiction: "US-NY" });
  const legalAid = await registry.search({ type: "legal_aid" });
  const nche = await registry.search({ q: "homeless" });
  const verifiedResources = dedupeResources([...nyResources, ...legalAid, ...nche]);

  const timeline = buildTimeline(input);
  const interventionPoints = buildInterventions(citedLegal);
  const issueAnalyses = buildIssueAnalyses(citedLegal);
  const actionPlan = buildActionPlan(verifiedResources);

  return {
    protocol: "ZZAI-Education-Access-Coercion-Review/1.0",
    schemaVersion: SCHEMA_VERSION,
    createdAt,
    disclaimers: [ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE, RECORDING_LAW_WARNING, mix.notice],
    whatIUnderstand: buildWhatIUnderstand(input),
    channelMixNotice: mix.synthesisHints.join(" ") || mix.notice,
    timeline,
    interventionPoints,
    issueAnalyses,
    actionPlan,
    citedLegal,
    verifiedResources,
    neverMakesDefinitiveLegalConclusions: true,
  };
}

function buildWhatIUnderstand(input: CoercionReviewInput): string[] {
  const text = input.narrative.trim();
  const bullets: string[] = [];
  const juris = [input.jurisdiction.stateProvince, input.jurisdiction.district, input.gradeContext]
    .filter(Boolean)
    .join(" · ");
  if (juris)
    bullets.push(`Context provided: ${juris}${input.yearHint ? ` · ${input.yearHint}` : ""}.`);
  if (text.length) {
    const snippet = text.length > 280 ? `${text.slice(0, 280).trim()}…` : text;
    bullets.push(`Your account (as written): ${snippet}`);
  }
  if (/parent|guardian|faculty|teacher|counselor|administrator/i.test(text)) {
    bullets.push(
      "You mention adults (parent/guardian and/or school staff) in connection with education access — roles and knowledge still need verification.",
    );
  }
  if (/absent|missed|stopped attending|did not attend|transfer|yabc|alternative/i.test(text)) {
    bullets.push(
      "You describe attendance disruption and/or a pathway change — exact dates, codes, and school response remain to be documented.",
    );
  }
  if (/housing|homeless|shelter|kicked out|living (apart|with)|motel/i.test(text)) {
    bullets.push(
      "Housing or living-situation stress appears in the narrative — McKinney-Vento / local homeless-education screening may be relevant after facts are clarified.",
    );
  }
  if (/record|transcript|told|promised|said/i.test(text)) {
    bullets.push(
      "Statements about records or program effects are treated as reported claims until written disclosures and transcripts are compared.",
    );
  }
  bullets.push(
    "Goal of this review: jurisdiction-aware protections, layered timeline, intervention points, and an advocacy plan — without premature legal conclusions.",
  );
  return bullets;
}

function dedupeRecords(rows: LegalInformationRecord[]): LegalInformationRecord[] {
  const map = new Map<string, LegalInformationRecord>();
  for (const r of rows) map.set(r.id, r);
  return [...map.values()];
}

function dedupeResources(rows: ResourceRecord[]): ResourceRecord[] {
  const map = new Map<string, ResourceRecord>();
  for (const r of rows) map.set(r.resource_id, r);
  return [...map.values()];
}

function buildTimeline(input: CoercionReviewInput): TimelineEventDraft[] {
  const y = input.yearHint || "senior year (exact calendar year TBD)";
  return [
    {
      id: "evt_senior_baseline",
      approxWhen: `${y} — early fall / before October disruption`,
      title: "Senior-year enrollment + dual employment",
      layers: {
        userReport: [
          "Enrolled as high-school senior in NYS; close to completing high school; working two jobs.",
        ],
        documentMayEstablish: [
          "Official enrollment roster / schedule",
          "Transcript credits toward graduation",
          "Employer paystubs / hire dates / schedules",
        ],
        otherPersonClaimed: [],
        unknown: ["Exact school name/district", "Exact graduation credit status in October"],
      },
      documentsToSeek: [
        "Complete transcript",
        "Credit audit / graduation progress report",
        "Work schedules or termination dates from both employers",
      ],
    },
    {
      id: "evt_parent_interference",
      approxWhen: `${y} — around October`,
      title: "Reported parental tracking / transport / interference with school & work",
      layers: {
        userReport: [
          "Parent used iPhone/location information to track location, came to the location, put student in a car, and interfered with continuing work and school.",
        ],
        documentMayEstablish: [
          "Device location-sharing logs (if retained)",
          "Texts/calls around the incident time",
          "Any police/EMS/third-party contemporaneous notes (only if they exist)",
          "Employer records showing abrupt end of shifts",
        ],
        otherPersonClaimed: ["Parent’s version of events (currently unknown / unverified)"],
        unknown: [
          "Whether school was notified that day",
          "Whether housing changed the same day",
          "Exact addresses and custody/living arrangement labels used by adults",
        ],
      },
      documentsToSeek: [
        "Phone location-share history / screenshots with timestamps",
        "Messages with parent and employers",
        "Any adult statements later given to the school",
      ],
    },
    {
      id: "evt_absence_window",
      approxWhen: `${y} — approximately 2–3 weeks after disruption`,
      title: "Extended nonattendance (≈2–3 weeks)",
      layers: {
        userReport: ["Did not attend school at all for about 2–3 weeks."],
        documentMayEstablish: [
          "Attendance codes / daily absence marks",
          "Automated or staff outreach logs",
          "Discharge / long-term absence coding",
        ],
        otherPersonClaimed: [],
        unknown: [
          "Whether attendance office contacted student or parent",
          "Whether absence was coded as illness, unauthorized, transfer pending, etc.",
          "Whether a counselor or attendance teacher opened an inquiry",
        ],
      },
      documentsToSeek: [
        "Full attendance record with codes and legend",
        "Attendance outreach / call logs",
        "Any home-visit or attendance-teacher notes",
      ],
    },
    {
      id: "evt_yabc_pitch",
      approxWhen: `${y} — after the absence window`,
      title: "YABC recommendation and reliance on record assurances",
      layers: {
        userReport: [
          "Told to enter YABC; told participation would not appear on or affect the permanent educational record; relied on that representation; would not have agreed if told otherwise.",
        ],
        documentMayEstablish: [
          "Referral / counseling notes",
          "YABC enrollment forms and disclosures",
          "Transfer/discharge paperwork with signatures and dates",
          "Any written brochure or email describing transcript effects",
        ],
        otherPersonClaimed: [
          "Whoever stated YABC would not appear on / affect the permanent record (identity and role TBD)",
        ],
        unknown: [
          "Whether assurance was oral only or written",
          "Whether parent consented or directed the transfer",
          "Whether alternatives to YABC were explained",
        ],
      },
      documentsToSeek: [
        "All YABC referral and enrollment documents",
        "Guidance counselor notes",
        "Transfer / discharge forms",
        "Any emails about YABC and transcripts",
      ],
    },
    {
      id: "evt_record_discovery",
      approxWhen: "Later (date TBD)",
      title: "Discovery that YABC/program information appeared on educational record",
      layers: {
        userReport: [
          "Later discovered program information on the educational record contrary to prior assurance.",
        ],
        documentMayEstablish: [
          "Transcript pages showing school/program lines",
          "Permanent record / cumulative folder entries",
          "DOE student transcript / ATS printouts (NYC) if applicable",
        ],
        otherPersonClaimed: [],
        unknown: [
          "Exact wording on the record",
          "Whether any FERPA amendment request was ever filed",
        ],
      },
      documentsToSeek: [
        "Complete unofficial and official transcripts",
        "Permanent record / cumulative file copy",
        "Side-by-side comparison of pre- and post-YABC records",
      ],
    },
  ];
}

function buildInterventions(legal: LegalInformationRecord[]): InterventionPoint[] {
  const mv = cite(legal, "us-mckinney-vento-unaccompanied", "us-ny-educ-3209-homeless");
  const att = cite(legal, "us-ny-attendance-duties-pointer", "us-ny-compulsory-attendance-pointer");
  return [
    {
      id: "int_teacher_absence",
      stage: "First days of nonattendance",
      whoMightHaveActed: "Classroom teachers / period attendance",
      whatRuleOrPolicyMayApply:
        "Local attendance-taking rules and early outreach expectations when a regularly attending senior suddenly disappears.",
      citations: att.map((c) => c.citation),
      evidenceNeededToEvaluateCompliance: [
        "Period attendance marks",
        "Teacher emails/notes about missing student",
        "School attendance policy then in force",
      ],
      nonAssumption: "Do not assume misconduct merely because an intervention did not occur.",
    },
    {
      id: "int_attendance_office",
      stage: "Extended absence (days → weeks)",
      whoMightHaveActed: "Attendance office / attendance teacher",
      whatRuleOrPolicyMayApply:
        "District procedures for consecutive absences, parent/student contact attempts, and escalation before discharge or pathway change.",
      citations: att.map((c) => c.citation),
      evidenceNeededToEvaluateCompliance: [
        "Call logs / outreach attempts",
        "Absence codes",
        "Written attendance/discharge procedures from that school year",
      ],
      nonAssumption: "Do not assume misconduct merely because an intervention did not occur.",
    },
    {
      id: "int_counselor_housing",
      stage: "When living situation / parent conflict became known (if known)",
      whoMightHaveActed: "Guidance counselor / social worker",
      whatRuleOrPolicyMayApply:
        "Duty to inquire about barriers to attendance; possible McKinney-Vento identification if housing was fixed/regular/adequate nighttime residence issues or unaccompanied status.",
      citations: mv.map((c) => `${c.title} (${c.citation})`),
      evidenceNeededToEvaluateCompliance: [
        "Counselor notes",
        "Housing/address fields in SIS",
        "Whether MV questionnaire was offered",
      ],
      nonAssumption: "Do not assume misconduct merely because an intervention did not occur.",
    },
    {
      id: "int_mv_liaison",
      stage: "If housing instability or living apart from parent was present",
      whoMightHaveActed: "McKinney-Vento / Students in Temporary Housing liaison",
      whatRuleOrPolicyMayApply:
        "LEA liaison responsibilities under McKinney-Vento and N.Y. Educ. Law § 3209 to identify eligible students and support school stability/enrollment.",
      citations: mv.map((c) => `${c.title} (${c.citation})`),
      evidenceNeededToEvaluateCompliance: [
        "Whether liaison was notified",
        "Eligibility determination worksheet (if any)",
        "Services offered or denied",
      ],
      nonAssumption: "Do not assume misconduct merely because an intervention did not occur.",
    },
    {
      id: "int_yabc_counseling",
      stage: "Before leaving traditional HS path for YABC",
      whoMightHaveActed: "Counselor / administrator explaining pathway options",
      whatRuleOrPolicyMayApply:
        "Informed educational decision-making: accurate disclosures about enrollment, credits, transcript/school-name notations, and alternatives; written referral/enrollment packets.",
      citations: cite(legal, "nyc-yabc-program-pointer").map((c) => c.citation),
      evidenceNeededToEvaluateCompliance: [
        "Written YABC disclosures",
        "Meeting notes listing alternatives discussed",
        "Student/parent signature dates vs. first YABC attendance",
      ],
      nonAssumption: "Do not assume misconduct merely because an intervention did not occur.",
    },
  ];
}

function buildIssueAnalyses(legal: LegalInformationRecord[]): IssueAnalysis[] {
  const questions: Array<Omit<IssueAnalysis, "citedSources"> & { sourceIds: string[] }> = [
    {
      questionNumber: 1,
      question: "Right to attend and remain enrolled in school",
      potentiallyRelevantProtections: [
        "N.Y. compulsory attendance / enrollment framework",
        "District continuity-of-enrollment policies",
        "McKinney-Vento school stability if eligible",
      ],
      whatIsKnownFromUserReport: [
        "Was enrolled as a senior and later stopped attending for weeks, then moved to YABC.",
      ],
      whatMustBeVerified: [
        "Enrollment status codes during the absence",
        "Whether discharge occurred and on what authority",
      ],
      evidenceThatWouldStrengthen: [
        "Records showing continued desire to attend original school",
        "Absence of voluntary withdrawal signature by student",
      ],
      evidenceThatWouldWeaken: [
        "Signed voluntary transfer requesting YABC with accurate disclosures",
      ],
      sourceIds: ["us-ny-compulsory-attendance-pointer", "us-ny-attendance-duties-pointer"],
    },
    {
      questionNumber: 2,
      question:
        "Homelessness / housing instability / living apart protections (McKinney-Vento & Educ. Law § 3209)",
      potentiallyRelevantProtections: ["42 U.S.C. § 11431 et seq.", "N.Y. Educ. Law § 3209"],
      whatIsKnownFromUserReport: [
        "Living situation and parent actions disrupted school/work access; details of nighttime residence adequacy not fully specified.",
      ],
      whatMustBeVerified: [
        "Where student slept during the relevant weeks",
        "Whether living apart from parent/guardian",
        "Whether residence was fixed, regular, and adequate",
      ],
      evidenceThatWouldStrengthen: [
        "Contemporaneous evidence of couch-surfing, doubled-up housing, shelter, or inadequate residence",
        "Statements that student was not in parent’s physical custody",
      ],
      evidenceThatWouldWeaken: [
        "Documented stable adequate residence in parent custody throughout",
      ],
      sourceIds: [
        "us-mckinney-vento-unaccompanied",
        "us-ny-educ-3209-homeless",
        "us-mckinney-vento-overview",
      ],
    },
    {
      questionNumber: 3,
      question: "Should school have identified housing instability and connected a liaison?",
      potentiallyRelevantProtections: [
        "McKinney-Vento liaison duties",
        "NYSED / NYC STH procedures",
      ],
      whatIsKnownFromUserReport: ["No liaison involvement described."],
      whatMustBeVerified: ["What school knew about housing", "Whether MV screening occurred"],
      evidenceThatWouldStrengthen: [
        "Counselor notes mentioning housing conflict without referral",
        "Address changes in SIS without MV review",
      ],
      evidenceThatWouldWeaken: [
        "Documented MV screening finding student not eligible, with factual basis",
      ],
      sourceIds: ["us-mckinney-vento-unaccompanied", "us-nysed-mckinney-vento-guidance"],
    },
    {
      questionNumber: 4,
      question: "Possible unaccompanied homeless youth qualification",
      potentiallyRelevantProtections: ["Federal definition of unaccompanied homeless youth"],
      whatIsKnownFromUserReport: [
        "Parent interference and living-situation stress reported; custody facts incomplete.",
      ],
      whatMustBeVerified: [
        "Physical custody facts",
        "Nighttime residence facts across the October–YABC window",
      ],
      evidenceThatWouldStrengthen: [
        "Evidence student was not in parent/guardian physical custody while lacking adequate fixed regular residence",
      ],
      evidenceThatWouldWeaken: ["Evidence of continuous physical custody and adequate housing"],
      sourceIds: ["us-mckinney-vento-unaccompanied"],
    },
    {
      questionNumber: 5,
      question: "School responsibilities after 2–3 weeks’ absence in senior year",
      potentiallyRelevantProtections: [
        "Local attendance intervention procedures",
        "Compulsory attendance / nonattendance response rules",
      ],
      whatIsKnownFromUserReport: ["≈2–3 weeks with no attendance."],
      whatMustBeVerified: ["Outreach attempts", "Coding", "Timing of discharge/transfer"],
      evidenceThatWouldStrengthen: [
        "No documented outreach despite consecutive absences",
        "Rapid discharge without inquiry",
      ],
      evidenceThatWouldWeaken: ["Documented repeated outreach and support offers"],
      sourceIds: ["us-ny-attendance-duties-pointer"],
    },
    {
      questionNumber: 6,
      question: "Investigate reason for absence vs treating as voluntary dropout/transfer",
      potentiallyRelevantProtections: [
        "Attendance investigation norms",
        "McKinney-Vento identification duties if housing barriers present",
      ],
      whatIsKnownFromUserReport: [
        "Cause described as parental interference and living situation — not a free choice to quit.",
      ],
      whatMustBeVerified: ["What reason the school recorded", "Who initiated YABC"],
      evidenceThatWouldStrengthen: ["Internal notes labeling student 'dropout' without interview"],
      evidenceThatWouldWeaken: [
        "Documented student interview exploring barriers and voluntary informed choice",
      ],
      sourceIds: ["us-ny-attendance-duties-pointer", "us-mckinney-vento-unaccompanied"],
    },
    {
      questionNumber: 7,
      question: "Documentation/consent/counseling before traditional HS → YABC",
      potentiallyRelevantProtections: [
        "District transfer/referral procedures",
        "Informed-consent / disclosure practices for alternative programs",
      ],
      whatIsKnownFromUserReport: ["Agreed based on verbal assurances about records."],
      whatMustBeVerified: ["Packet contents", "Signatures", "Alternatives listed"],
      evidenceThatWouldStrengthen: [
        "Missing required forms",
        "No counseling note listing risks/benefits",
      ],
      evidenceThatWouldWeaken: ["Complete signed packet with accurate transcript disclosures"],
      sourceIds: ["nyc-yabc-program-pointer"],
    },
    {
      questionNumber: 8,
      question: "Representations about how YABC appears on transcript/permanent record",
      potentiallyRelevantProtections: [
        "Truthful counseling / consumer-like educational disclosures (policy-based)",
        "FERPA access to see what actually posted",
      ],
      whatIsKnownFromUserReport: [
        "Told it would not appear on/affect permanent record; later saw program info on record.",
      ],
      whatMustBeVerified: [
        "Exact words of the assurance",
        "Exact record entries",
        "Official DOE transcript conventions",
      ],
      evidenceThatWouldStrengthen: [
        "Written assurance contradicting actual record practice",
        "Witnesses to the assurance",
      ],
      evidenceThatWouldWeaken: ["Written materials that accurately described transcript notation"],
      sourceIds: ["nyc-yabc-program-pointer", "us-ferpa-amendment"],
    },
    {
      questionNumber: 9,
      question: "Whether inaccurate/misleading information impaired informed decision",
      potentiallyRelevantProtections: [
        "Record accuracy / counseling integrity (evaluate with documents)",
        "FERPA amendment if records themselves are inaccurate/misleading",
      ],
      whatIsKnownFromUserReport: [
        "Reliance on no-record-impact statement; would not have agreed otherwise.",
      ],
      whatMustBeVerified: ["Source of the statement (parent vs school staff)"],
      evidenceThatWouldStrengthen: [
        "Contemporaneous notes of the promise",
        "Contradiction with official policy manuals",
      ],
      evidenceThatWouldWeaken: [
        "Evidence student received accurate written disclosures before agreeing",
      ],
      sourceIds: ["us-ferpa-amendment", "nyc-yabc-program-pointer"],
    },
    {
      questionNumber: 10,
      question: "Inaccurate/misleading education records — FERPA / NY inspection & amendment",
      potentiallyRelevantProtections: [
        "FERPA inspection & amendment process (34 C.F.R. §§ 99.10–99.22)",
      ],
      whatIsKnownFromUserReport: ["Believe record content conflicts with what was promised."],
      whatMustBeVerified: [
        "Whether the entry is factually wrong vs unwanted-but-accurate",
        "Whether eligible-student status applies now",
      ],
      evidenceThatWouldStrengthen: [
        "Provable factual errors on transcript",
        "Missing required disclosures in cumulative file",
      ],
      evidenceThatWouldWeaken: ["Entries that accurately reflect enrollment even if undesirable"],
      sourceIds: ["us-ferpa-amendment", "us-ferpa-overview"],
    },
    {
      questionNumber: 11,
      question:
        "Additional protections given interference with employment, transport, housing, communications, school access",
      potentiallyRelevantProtections: [
        "McKinney-Vento if housing criteria met",
        "Compulsory education / attendance barrier analysis",
        "Possible child welfare / safety reporting frameworks (fact-specific; not decided here)",
      ],
      whatIsKnownFromUserReport: [
        "Lost both jobs; location tracking; transport control; school interruption.",
      ],
      whatMustBeVerified: [
        "Employment end dates",
        "Safety facts",
        "Whether any mandated reporter acted",
      ],
      evidenceThatWouldStrengthen: ["Corroboration of coercion and resulting educational harm"],
      evidenceThatWouldWeaken: ["Evidence educational choices were independent of those pressures"],
      sourceIds: ["us-mckinney-vento-unaccompanied", "us-ny-educ-3209-homeless"],
    },
    {
      questionNumber: 12,
      question: "Options today to obtain complete records and reconstruct the timeline",
      potentiallyRelevantProtections: ["FERPA right to inspect/review education records"],
      whatIsKnownFromUserReport: ["Need full record set to reconstruct events."],
      whatMustBeVerified: ["Which LEA holds records now", "Retention schedules"],
      evidenceThatWouldStrengthen: [
        "Written FERPA request with date stamp",
        "Complete cumulative file production",
      ],
      evidenceThatWouldWeaken: ["Partial productions that omit attendance/transfer files"],
      sourceIds: ["us-ferpa-overview", "us-ferpa-amendment"],
    },
  ];

  return questions.map((q) => ({
    questionNumber: q.questionNumber,
    question: q.question,
    potentiallyRelevantProtections: q.potentiallyRelevantProtections,
    whatIsKnownFromUserReport: q.whatIsKnownFromUserReport,
    whatMustBeVerified: q.whatMustBeVerified,
    evidenceThatWouldStrengthen: q.evidenceThatWouldStrengthen,
    evidenceThatWouldWeaken: q.evidenceThatWouldWeaken,
    citedSources: cite(legal, ...q.sourceIds),
  }));
}

function buildActionPlan(resources: ResourceRecord[]): AdvocacyActionPlan {
  const byId = (id: string) => resources.find((r) => r.resource_id === id);
  const contacts: AdvocacyActionPlan["contacts"] = [];
  const add = (id: string, ask: string[]) => {
    const r = byId(id);
    if (!r) return;
    const url = r.contact_channels.find((c) => c.kind === "url")?.value || "";
    contacts.push({
      name: r.name,
      type: r.type,
      how: url || "See verified directory entry",
      ask,
    });
  };
  add("nyc-sth", [
    "How do I request confirmation whether I was ever screened for Students in Temporary Housing / McKinney-Vento?",
    "Who was the liaison for my school/borough in [year]?",
  ]);
  add("nyc-yabc-info", [
    "What official materials describe how YABC appears on transcripts?",
    "What enrollment documents should exist in my file?",
  ]);
  add("ny-nysed-mckinney-vento", [
    "What state complaint or monitoring avenues exist if a district failed to identify an eligible student?",
  ]);
  add("afc-nyc", [
    "Can you help obtain records and evaluate a senior-year pathway change after housing/family disruption?",
  ]);
  add("legal-aid-nyc", [
    "Do I qualify for education/advocacy legal assistance regarding records and McKinney-Vento identification?",
  ]);
  add("us-lsc-legal-aid-finder", [
    "Help me find education or youth legal aid if I am outside NYC eligibility.",
  ]);

  return {
    recordsToRequest: [
      {
        record: "Complete official + unofficial transcripts",
        why: "See school/program lines and credit chronology",
        whereLikely: "Former high school / NYC DOE transcript office / current records custodian",
      },
      {
        record: "Permanent record / cumulative file (including counselor notes)",
        why: "Capture YABC counseling, referrals, and what was told",
        whereLikely: "School guidance office / district records",
      },
      {
        record: "Attendance register with code legend for senior year",
        why: "Document the 2–3 week gap and school response",
        whereLikely: "Attendance office",
      },
      {
        record: "Enrollment, discharge, transfer, and YABC referral/enrollment packet",
        why: "Show who initiated pathway change and what was disclosed in writing",
        whereLikely: "Pupil accounting / YABC site / guidance",
      },
      {
        record: "SIS address / residence history",
        why: "Housing instability indicators",
        whereLikely: "School secretary / district SIS",
      },
      {
        record: "Employer records for both jobs (end dates)",
        why: "Corroborate timing of disruption",
        whereLikely: "Former employers / paystubs",
      },
      {
        record: "Messages, location-share logs, emails with parent/school",
        why: "Contemporaneous evidence of interference and assurances",
        whereLikely: "Personal devices / email archives",
      },
    ],
    contacts,
    questionsToAsk: [
      "Please produce my complete education records under FERPA, including attendance, transfer, and counselor notes.",
      "Was I ever screened for McKinney-Vento / Students in Temporary Housing? If yes, produce the determination.",
      "Who recommended YABC, on what date, and what written disclosures were provided about transcript notations?",
      "What alternatives to YABC were offered to keep me on my original graduation path?",
      "What attendance interventions occurred during my multi-week absence?",
      "How do I request amendment or attach a statement if records are inaccurate or misleading?",
    ],
    potentiallyRelevantProtections: [
      "McKinney-Vento Homeless Assistance Act (education subtitle)",
      "N.Y. Educ. Law § 3209",
      "N.Y. Educ. Law §§ 3205, 3210 et seq. (attendance framework)",
      "FERPA inspection and amendment procedures",
      "NYC DOE YABC / Students in Temporary Housing procedures (if NYC school)",
    ],
    factsNeedingVerification: [
      "Exact school, borough/district, and school year",
      "Nighttime residence facts (fixed/regular/adequate) and custody facts",
      "Identity/role of person who made the YABC records assurance",
      "Whether student was 17 vs 18+ at key decision points (affects consent dynamics)",
      "Exact transcript language discovered later",
    ],
    possibleProcesses: [
      "FERPA records request to the LEA",
      "FERPA amendment request and, if denied, hearing / explanatory statement in the file",
      "Contact McKinney-Vento / STH liaison for historical eligibility review (fact-dependent)",
      "Education advocacy organization consultation (e.g., Advocates for Children of NY)",
      "Legal aid consultation for strategy — this system does not file complaints for you",
      "Optional: seal a documentary package in Education Proof Vault for integrity (not legal proof of wrongdoing)",
    ],
    nextImmediateSteps: [
      "Write a dated personal statement of the timeline (what you report) without destroying originals of messages/screenshots.",
      "Submit a written FERPA records request listing attendance, transcript, permanent record, transfer/YABC packet, and counselor notes.",
      "Preserve employer end-date proof and any location/message evidence.",
      "Contact a verified NY education advocate or legal-aid organization from the directory before relying on informal advice.",
      "Use Protect My Education + Evidence Vault to store documents with chain-of-custody as you collect them.",
    ],
  };
}
