import type {
  LegalInformationRecord,
  LegalSearchQuery,
  LegalSourceProvider,
} from "../adapters/interfaces";
import { SCHEMA_VERSION } from "../types";

/**
 * Seed catalog — administrators can add jurisdictions via data, not code changes.
 * Records are legal INFORMATION with citations; never presented as legal advice.
 */
const SEED_RECORDS: LegalInformationRecord[] = [
  {
    id: "us-ferpa-overview",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US" },
    authorityType: "federal_national",
    title: "Family Educational Rights and Privacy Act (FERPA) — overview",
    citation: "20 U.S.C. § 1232g; 34 C.F.R. Part 99",
    sourceUrl: "https://www.ed.gov/laws-and-policy/ferpa",
    effectiveDate: "1974-08-21",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["privacy", "education_records", "parents", "students"],
    plainLanguageExplanation:
      "FERPA is a U.S. federal law about privacy of student education records. It generally gives parents (and eligible students) certain rights to inspect and seek amendment of records, and limits disclosure. Details and exceptions are in the statute and regulations — this is information, not advice about your specific case.",
    eligibilityConditions: [
      "Applies to educational agencies and institutions that receive applicable U.S. Department of Education funds.",
    ],
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-mckinney-vento-overview",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US" },
    authorityType: "federal_national",
    title: "McKinney-Vento Homeless Assistance Act — education subtitle overview",
    citation: "42 U.S.C. § 11431 et seq.",
    sourceUrl: "https://www.ed.gov/laws-and-policy/laws/other-laws-and-guidance/homeless-education",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["homelessness", "enrollment", "school_stability", "housing"],
    plainLanguageExplanation:
      "McKinney-Vento includes education provisions intended to help eligible children and youth experiencing homelessness enroll in and attend school with fewer barriers. Eligibility and local procedures vary — confirm with the cited sources and your local liaison.",
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-idea-overview",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US" },
    authorityType: "federal_national",
    title: "Individuals with Disabilities Education Act (IDEA) — overview",
    citation: "20 U.S.C. § 1400 et seq.",
    sourceUrl: "https://sites.ed.gov/idea/",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["disability", "iep", "special_education"],
    plainLanguageExplanation:
      "IDEA is a U.S. federal law concerning special education and related services for eligible children with disabilities. Whether IDEA applies depends on evaluation and eligibility — this summary does not determine eligibility.",
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-section-504-overview",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US" },
    authorityType: "federal_national",
    title: "Section 504 of the Rehabilitation Act — education context overview",
    citation: "29 U.S.C. § 794",
    sourceUrl: "https://www.ed.gov/laws-and-policy/civil-rights-laws/section-504",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["disability", "504", "civil_rights"],
    plainLanguageExplanation:
      "Section 504 prohibits disability discrimination by recipients of federal financial assistance. In schools, it may relate to accommodations for eligible students. Specific rights depend on facts and regulations — cite primary sources.",
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-ca-compulsory-attendance-pointer",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US", stateProvince: "CA" },
    authorityType: "state_provincial",
    title: "California compulsory education — statutory pointer",
    citation: "Cal. Educ. Code § 48200 et seq.",
    sourceUrl:
      "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=EDC&sectionNum=48200",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["compulsory_attendance", "enrollment", "withdrawal"],
    plainLanguageExplanation:
      "California statutes address compulsory education age ranges and attendance duties. How they apply to a specific family or school decision requires reading the current code and, when needed, qualified human help. This entry is a citation pointer, not a conclusion that anyone violated the law.",
    superseded: false,
    confidence: "medium",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-ny-compulsory-attendance-pointer",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US", stateProvince: "NY" },
    authorityType: "state_provincial",
    title: "New York compulsory education — statutory pointer",
    citation: "N.Y. Educ. Law § 3205",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/EDN/3205",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["compulsory_attendance", "enrollment"],
    plainLanguageExplanation:
      "New York Education Law addresses compulsory attendance. Confirm current text and local procedures. This is legal information with a citation — not legal advice.",
    superseded: false,
    confidence: "medium",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-ny-educ-3209-homeless",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US", stateProvince: "NY" },
    authorityType: "state_provincial",
    title: "New York Education Law § 3209 — education of homeless children",
    citation: "N.Y. Educ. Law § 3209",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/EDN/3209",
    lastVerifiedDate: "2026-01-15",
    topicTags: [
      "homelessness",
      "housing",
      "mckinney_vento",
      "enrollment",
      "unaccompanied",
      "school_stability",
    ],
    plainLanguageExplanation:
      "New York Education Law § 3209 addresses educational rights of homeless children and youth, including school selection/stability concepts and liaison-related duties aligned with federal McKinney-Vento. Whether a particular student was homeless or unaccompanied depends on living circumstances at the time — this entry does not decide eligibility.",
    eligibilityConditions: [
      "Applies when a child/youth meets the definition of homeless under applicable federal/state standards.",
    ],
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-mckinney-vento-unaccompanied",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US" },
    authorityType: "federal_national",
    title: "McKinney-Vento — homeless definition and unaccompanied youth",
    citation: "42 U.S.C. § 11434a; 42 U.S.C. § 11432",
    sourceUrl: "https://nche.ed.gov/legislation/mckinney-vento/",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["homelessness", "unaccompanied", "housing", "enrollment", "liaison"],
    plainLanguageExplanation:
      "Federal McKinney-Vento definitions include youth who lack a fixed, regular, and adequate nighttime residence. “Unaccompanied homeless youth” generally means a homeless child or youth not in the physical custody of a parent or guardian. LEAs must designate a liaison and remove enrollment barriers. Eligibility is fact-specific; schools should not treat housing instability as a simple voluntary dropout without inquiry.",
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-ferpa-amendment",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US" },
    authorityType: "federal_national",
    title: "FERPA — inspection and amendment of education records",
    citation: "20 U.S.C. § 1232g; 34 C.F.R. §§ 99.10–99.22",
    sourceUrl: "https://studentprivacy.ed.gov/faq/what-rights-do-students-have-under-ferpa",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["ferpa", "education_records", "amendment", "transcript", "privacy"],
    plainLanguageExplanation:
      "Eligible students generally may inspect education records and seek amendment of records that are inaccurate, misleading, or in violation of privacy rights. If a school refuses amendment, procedures may allow a hearing and/or placement of a student statement in the record. FERPA does not automatically rewrite disputed narrative facts; it is a process right — not a guarantee any particular change will be made.",
    eligibilityConditions: [
      "Typically applies to eligible students (often 18+ or attending a postsecondary institution) or parents of younger students at covered schools.",
    ],
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
  {
    id: "us-ny-attendance-duties-pointer",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US", stateProvince: "NY" },
    authorityType: "state_provincial",
    title: "New York attendance / school duty pointers (Educ. Law)",
    citation: "N.Y. Educ. Law §§ 3205, 3210 et seq.",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/EDN",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["attendance", "absence", "enrollment", "senior", "compulsory_attendance"],
    plainLanguageExplanation:
      "New York law and local district/Chancellor regulations set expectations around compulsory attendance ages, attendance taking, and responses to nonattendance. A multi-week senior-year absence typically triggers school procedures (outreach, coding, counseling, discharge/transfer rules). Exact duties depend on district policies in force at the time — obtain the school’s attendance and discharge policies.",
    superseded: false,
    confidence: "medium",
    verificationStatus: "authority_cited",
  },
  {
    id: "nyc-yabc-program-pointer",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US", stateProvince: "NY", district: "NYC DOE" },
    authorityType: "agency_guidance",
    title: "NYC Young Adult Borough Centers (YABC) — program information pointer",
    citation: "NYC Department of Education — Young Adult Borough Centers guidance",
    sourceUrl:
      "https://www.schools.nyc.gov/enrollment/other-ways-to-graduate/young-adult-borough-centers",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["yabc", "transfer", "alternative_program", "transcript", "nyc", "credits"],
    plainLanguageExplanation:
      "YABC is an NYC DOE pathway for eligible older students to complete graduation requirements, often in evening or alternative settings. How enrollment, school names, and program notations appear on transcripts/permanent records is governed by DOE record practices — not by informal verbal assurances. Students should receive accurate written information before changing pathways. This pointer does not decide whether any particular representation was inaccurate.",
    superseded: false,
    confidence: "medium",
    verificationStatus: "directory_verified",
  },
  {
    id: "us-nysed-mckinney-vento-guidance",
    schemaVersion: SCHEMA_VERSION,
    jurisdiction: { country: "US", stateProvince: "NY" },
    authorityType: "agency_guidance",
    title: "NYSED McKinney-Vento / homeless education guidance hub",
    citation: "New York State Education Department — McKinney-Vento resources",
    sourceUrl: "https://www.nysed.gov/essa/mckinney-vento",
    lastVerifiedDate: "2026-01-15",
    topicTags: ["mckinney_vento", "liaison", "homelessness", "nysed", "housing"],
    plainLanguageExplanation:
      "NYSED publishes McKinney-Vento implementation resources for districts, including liaison responsibilities and homeless education supports. Use this hub to locate current state guidance and local liaison contact pathways.",
    superseded: false,
    confidence: "high",
    verificationStatus: "authority_cited",
  },
];

const AUTHORITY_RANK: Record<LegalInformationRecord["authorityType"], number> = {
  federal_national: 1,
  state_provincial: 2,
  education_regulation: 3,
  agency_guidance: 4,
  local_school_district: 5,
  verified_legal_resource: 6,
};

export class InMemoryLegalCatalog implements LegalSourceProvider {
  id = "in-memory-legal-catalog";
  private records = new Map<string, LegalInformationRecord>();

  constructor(seed: LegalInformationRecord[] = SEED_RECORDS) {
    for (const r of seed) this.records.set(r.id, r);
  }

  /** Admin / plugin path — add jurisdictions without changing application code. */
  upsert(record: LegalInformationRecord): void {
    this.records.set(record.id, record);
  }

  async getById(id: string): Promise<LegalInformationRecord | null> {
    return this.records.get(id) || null;
  }

  async search(query: LegalSearchQuery): Promise<LegalInformationRecord[]> {
    const topic = query.topic?.toLowerCase();
    const tags = (query.tags || []).map((t) => t.toLowerCase());
    let rows = [...this.records.values()];

    if (!query.includeSuperseded) {
      rows = rows.filter((r) => !r.superseded && r.verificationStatus !== "superseded");
    }
    if (query.country) {
      rows = rows.filter(
        (r) => r.jurisdiction.country.toUpperCase() === query.country!.toUpperCase(),
      );
    }
    if (query.stateProvince) {
      rows = rows.filter(
        (r) =>
          !r.jurisdiction.stateProvince ||
          r.jurisdiction.stateProvince.toUpperCase() === query.stateProvince!.toUpperCase(),
      );
    }
    if (query.district) {
      rows = rows.filter(
        (r) => !r.jurisdiction.district || r.jurisdiction.district === query.district,
      );
    }
    if (topic) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(topic) ||
          r.plainLanguageExplanation.toLowerCase().includes(topic) ||
          r.topicTags.some((t) => t.includes(topic) || topic.includes(t)),
      );
    }
    if (tags.length) {
      rows = rows.filter((r) => tags.some((t) => r.topicTags.some((rt) => rt.includes(t))));
    }

    return rows.sort(
      (a, b) =>
        AUTHORITY_RANK[a.authorityType] - AUTHORITY_RANK[b.authorityType] ||
        a.title.localeCompare(b.title),
    );
  }

  listJurisdictions(): Array<{ country: string; stateProvince?: string }> {
    const key = (r: LegalInformationRecord) =>
      `${r.jurisdiction.country}:${r.jurisdiction.stateProvince || ""}`;
    const map = new Map<string, { country: string; stateProvince?: string }>();
    for (const r of this.records.values()) {
      map.set(key(r), {
        country: r.jurisdiction.country,
        stateProvince: r.jurisdiction.stateProvince,
      });
    }
    return [...map.values()];
  }
}

export function formatLegalCitationBlock(record: LegalInformationRecord): string {
  return [
    `${record.title}`,
    `Citation: ${record.citation}`,
    `Authority: ${record.authorityType}`,
    `Source: ${record.sourceUrl}`,
    `Last verified: ${record.lastVerifiedDate}`,
    `Confidence: ${record.confidence}`,
    record.plainLanguageExplanation,
  ].join("\n");
}
