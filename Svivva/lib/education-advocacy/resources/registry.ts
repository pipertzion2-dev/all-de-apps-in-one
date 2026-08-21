import type {
  CrisisResourceProvider,
  ResourceProvider,
  ResourceRecord,
  ResourceSearchQuery,
} from "../adapters/interfaces";
import { filterUnexpired } from "../adapters/defaults";

/**
 * Verified directory seed data ONLY.
 * Do not invent telephone numbers or organizations.
 * Entries include source + verified_at; expired rows are filtered at query time.
 */
const SEED_RESOURCES: ResourceRecord[] = [
  {
    resource_id: "us-911-emergency",
    name: "Local emergency services (911 in the United States)",
    type: "crisis",
    jurisdiction: "US",
    service_area: "United States",
    contact_channels: [
      { kind: "phone", value: "911", note: "Immediate physical danger / emergency response" },
    ],
    source: "https://www.ready.gov/",
    verified_at: "2026-01-15",
    emergency_capability: true,
    age_range: "all",
    languages: ["en"],
  },
  {
    resource_id: "us-988-lifeline",
    name: "988 Suicide & Crisis Lifeline",
    type: "crisis",
    jurisdiction: "US",
    service_area: "United States",
    contact_channels: [
      { kind: "phone", value: "988", note: "Call or text 988" },
      { kind: "url", value: "https://988lifeline.org/" },
    ],
    hours: "24/7",
    source: "https://www.samhsa.gov/find-help/988",
    verified_at: "2026-01-15",
    emergency_capability: true,
    age_range: "all",
    languages: ["en", "es"],
  },
  {
    resource_id: "us-childhelp",
    name: "Childhelp National Child Abuse Hotline",
    type: "crisis",
    jurisdiction: "US",
    contact_channels: [
      { kind: "phone", value: "1-800-422-4453", note: "Also listed as 1-800-4-A-CHILD" },
      { kind: "url", value: "https://www.childhelp.org/hotline/" },
    ],
    hours: "24/7",
    source: "https://www.childhelp.org/hotline/",
    verified_at: "2026-01-15",
    emergency_capability: true,
    age_range: "all",
  },
  {
    resource_id: "us-lsc-legal-aid-finder",
    name: "Legal Services Corporation — Find Legal Aid",
    type: "legal_aid",
    jurisdiction: "US",
    contact_channels: [
      { kind: "url", value: "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help" },
    ],
    source: "https://www.lsc.gov/",
    verified_at: "2026-01-15",
    emergency_capability: false,
    legal_service_type: "legal_aid_directory",
    api_integration_capability: false,
  },
  {
    resource_id: "us-ed-ocr",
    name: "U.S. Department of Education — Office for Civil Rights",
    type: "government",
    jurisdiction: "US",
    contact_channels: [{ kind: "url", value: "https://www.ed.gov/about/ed-offices/ocr" }],
    source: "https://www.ed.gov/about/ed-offices/ocr",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "civil_rights",
  },
  {
    resource_id: "us-nche",
    name: "National Center for Homeless Education",
    type: "education",
    jurisdiction: "US",
    contact_channels: [{ kind: "url", value: "https://nche.ed.gov/" }],
    source: "https://nche.ed.gov/",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "homeless_education",
  },
  {
    resource_id: "generic-school-counselor",
    name: "School counselor / campus support (local)",
    type: "school",
    jurisdiction: "ANY",
    contact_channels: [
      {
        kind: "in_person",
        value: "Contact your school office for counselor availability",
        note: "Not a national hotline — local directory entry template",
      },
    ],
    source: "platform-template",
    verified_at: "2026-01-15",
    emergency_capability: false,
    education_service_type: "counseling",
  },
];

export class InMemoryResourceRegistry implements ResourceProvider, CrisisResourceProvider {
  id = "in-memory-resource-registry";
  private resources = new Map<string, ResourceRecord>();

  constructor(seed: ResourceRecord[] = SEED_RESOURCES) {
    for (const r of seed) this.resources.set(r.resource_id, r);
  }

  upsert(record: ResourceRecord): void {
    this.resources.set(record.resource_id, record);
  }

  async getById(id: string): Promise<ResourceRecord | null> {
    return this.resources.get(id) || null;
  }

  async search(query: ResourceSearchQuery): Promise<ResourceRecord[]> {
    let rows = filterUnexpired([...this.resources.values()]);
    if (query.jurisdiction) {
      const j = query.jurisdiction.toUpperCase();
      rows = rows.filter(
        (r) =>
          r.jurisdiction.toUpperCase() === j ||
          r.jurisdiction === "ANY" ||
          r.jurisdiction.startsWith(j),
      );
    }
    if (query.type) {
      rows = rows.filter((r) => r.type === query.type);
    }
    if (query.emergency != null) {
      rows = rows.filter((r) => r.emergency_capability === query.emergency);
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.type.includes(q) ||
          (r.education_service_type || "").includes(q) ||
          (r.legal_service_type || "").includes(q),
      );
    }
    return rows;
  }

  async routeByCategory(category: string, jurisdiction?: string): Promise<ResourceRecord[]> {
    const map: Record<string, ResourceSearchQuery> = {
      immediate_physical_danger: { emergency: true, q: "911" },
      emotional_psychological_crisis: { emergency: true, q: "988" },
      abuse_neglect: { emergency: true, q: "childhelp" },
      housing_instability: { type: "education", q: "homeless" },
      education_exclusion: { type: "education" },
      potential_rights_issue: { type: "legal_aid" },
      urgent_legal_assistance: { type: "legal_aid" },
      school_conflict: { type: "school" },
      non_emergency_advocacy: { type: "education" },
    };
    const q = map[category] || { q: category };
    return this.search({ ...q, jurisdiction });
  }
}
