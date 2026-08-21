import type {
  LegalInformationRecord,
  LegalSearchQuery,
  LegalSourceProvider,
} from "../adapters/interfaces";
import { formatLegalCitationBlock, InMemoryLegalCatalog } from "./catalog";
import { LEGAL_INFO_NOT_ADVICE, ROLE_BOUNDARY } from "../disclaimers";

export type LegalEngineResult = {
  records: LegalInformationRecord[];
  hierarchyNote: string;
  distinction: { legalInformation: true; legalAdvice: false };
  uncertainty: boolean;
  uncertaintyMessage?: string;
  citedBlocks: string[];
  disclaimers: string[];
  routeToHuman: boolean;
};

const HIERARCHY_NOTE = [
  "Information hierarchy (most general → most local):",
  "Federal / national law → State / provincial law → Education regulations → Agency guidance → Local school / district policies → Verified legal resources.",
].join(" ");

export class RightsLawEngine {
  constructor(private provider: LegalSourceProvider = new InMemoryLegalCatalog()) {}

  async query(query: LegalSearchQuery): Promise<LegalEngineResult> {
    const records = await this.provider.search(query);
    const uncertainty = records.length === 0 || records.every((r) => r.confidence === "low");
    return {
      records,
      hierarchyNote: HIERARCHY_NOTE,
      distinction: { legalInformation: true, legalAdvice: false },
      uncertainty,
      uncertaintyMessage: uncertainty
        ? "No high-confidence jurisdiction-matched record was found. Say so clearly and route toward qualified human assistance."
        : undefined,
      citedBlocks: records.slice(0, 8).map(formatLegalCitationBlock),
      disclaimers: [ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE],
      routeToHuman: uncertainty || records.some((r) => r.confidence !== "high"),
    };
  }

  /** Ensure every AI legal-information statement can attach an underlying source. */
  requireCitation(record: LegalInformationRecord | null): string {
    if (!record) {
      return "No authoritative citation available for this statement. Do not present it as settled law; seek qualified human assistance.";
    }
    return `Source: ${record.title} — ${record.citation} (${record.sourceUrl}), verified ${record.lastVerifiedDate}.`;
  }
}
