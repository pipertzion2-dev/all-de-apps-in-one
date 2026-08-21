/**
 * Plugin / adapter interfaces — every external dependency plugs in here.
 * New jurisdictions, AI models, ledgers, and partners register without
 * rewriting core orchestration.
 */

import type { SharedContextSnapshot } from "../buses/schemas";

export type LegalAuthorityType =
  | "federal_national"
  | "state_provincial"
  | "education_regulation"
  | "agency_guidance"
  | "local_school_district"
  | "verified_legal_resource";

export type LegalInformationRecord = {
  id: string;
  schemaVersion: string;
  jurisdiction: {
    country: string;
    stateProvince?: string;
    district?: string;
  };
  authorityType: LegalAuthorityType;
  title: string;
  citation: string;
  sourceUrl: string;
  effectiveDate?: string;
  lastVerifiedDate: string;
  topicTags: string[];
  plainLanguageExplanation: string;
  eligibilityConditions?: string[];
  superseded: boolean;
  confidence: "low" | "medium" | "high";
  verificationStatus: "unverified" | "directory_verified" | "authority_cited" | "superseded";
  extension?: Record<string, unknown>;
};

export type LegalSearchQuery = {
  country?: string;
  stateProvince?: string;
  district?: string;
  topic?: string;
  tags?: string[];
  includeSuperseded?: boolean;
};

export interface LegalSourceProvider {
  id: string;
  search(query: LegalSearchQuery): Promise<LegalInformationRecord[]>;
  getById(id: string): Promise<LegalInformationRecord | null>;
}

export type ResourceRecord = {
  resource_id: string;
  name: string;
  type: string;
  jurisdiction: string;
  service_area?: string;
  eligibility?: string;
  age_range?: string;
  languages?: string[];
  contact_channels: Array<{
    kind: "phone" | "url" | "email" | "sms" | "chat" | "in_person";
    value: string;
    note?: string;
  }>;
  hours?: string;
  source: string;
  verified_at: string;
  expires_at?: string;
  emergency_capability: boolean;
  legal_service_type?: string;
  education_service_type?: string;
  api_integration_capability?: boolean;
  extension?: Record<string, unknown>;
};

export type ResourceSearchQuery = {
  jurisdiction?: string;
  type?: string;
  emergency?: boolean;
  ageRange?: string;
  tags?: string[];
  q?: string;
};

export interface ResourceProvider {
  id: string;
  search(query: ResourceSearchQuery): Promise<ResourceRecord[]>;
  getById(id: string): Promise<ResourceRecord | null>;
}

export interface CrisisResourceProvider extends ResourceProvider {
  routeByCategory(category: string, jurisdiction?: string): Promise<ResourceRecord[]>;
}

export type AiChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiGuideStructuredReply = {
  whatIUnderstand: string[];
  whatMayMatterLegally: string[];
  informationStillMissing: string[];
  possibleNextSteps: string[];
  whoMayBeAbleToHelp: string[];
  sources: Array<{ title: string; citation?: string; url?: string }>;
  protectOrDocument: string[];
  disclaimers: string[];
  rawAssistantText?: string;
};

export interface AIProvider {
  id: string;
  complete(messages: AiChatMessage[]): Promise<string>;
  structureAdvocacyReply?(
    userText: string,
    context: SharedContextSnapshot,
  ): Promise<AiGuideStructuredReply>;
}

export type LedgerAnchorRequest = {
  proofId: string;
  digestHex: string;
  createdAt: string;
  metadata?: Record<string, string>;
};

export type LedgerAnchorResult = {
  anchored: boolean;
  network?: string;
  transactionRef?: string;
  anchoredAt?: string;
  status: "pending" | "confirmed" | "unavailable" | "skipped";
  note?: string;
};

export type LedgerVerifyResult = {
  found: boolean;
  matches: boolean;
  network?: string;
  transactionRef?: string;
  timestamp?: string;
  status: string;
};

export type LedgerReceipt = {
  proofId: string;
  digestHex: string;
  network?: string;
  transactionRef?: string;
  timestamp?: string;
  status: string;
};

export interface LedgerAdapter {
  id: string;
  anchorProof(req: LedgerAnchorRequest): Promise<LedgerAnchorResult>;
  verifyProof(digestHex: string, transactionRef?: string): Promise<LedgerVerifyResult>;
  getReceipt(proofId: string): Promise<LedgerReceipt | null>;
  getTimestamp(proofId: string): Promise<string | null>;
  getNetworkStatus(): Promise<{ online: boolean; network: string; detail?: string }>;
}

export interface IdentityProvider {
  id: string;
  getPseudonymousId(): Promise<string>;
  getAgeRange?(): Promise<string | undefined>;
  getJurisdiction?(): Promise<{ country?: string; stateProvince?: string } | undefined>;
}

export interface NotificationProvider {
  id: string;
  /** Must never include sensitive vault contents or recovery secrets. */
  notify(input: {
    userRef: string;
    template: string;
    safePayload: Record<string, string>;
  }): Promise<void>;
}

export interface StorageProvider {
  id: string;
  putEncrypted(key: string, ciphertext: Uint8Array, meta?: Record<string, string>): Promise<void>;
  getEncrypted(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
}

export interface SchoolDataProvider {
  id: string;
  lookupSchool?(
    query: string,
    jurisdiction?: string,
  ): Promise<Array<{ name: string; district?: string }>>;
}

export interface OpportunityProvider {
  id: string;
  search(query: ResourceSearchQuery): Promise<ResourceRecord[]>;
}

export type ReferralRequest = {
  resourceId: string;
  userRef: string;
  notes?: string;
  authorizedPacketId?: string;
};

export type ReferralResult = {
  referralId: string;
  status: "created" | "pending" | "unavailable";
  nextStep?: string;
};

export interface HumanReferralProvider {
  id: string;
  search(query: ResourceSearchQuery): Promise<ResourceRecord[]>;
  checkEligibility(
    resourceId: string,
    context: SharedContextSnapshot,
  ): Promise<{ eligible: boolean; reason?: string }>;
  getAvailability(resourceId: string): Promise<{ available: boolean; hours?: string }>;
  createReferral(req: ReferralRequest): Promise<ReferralResult>;
  shareAuthorizedPacket(packetId: string, resourceId: string): Promise<{ shared: boolean }>;
}

/** Alias matching the product spec name. */
export type HumanResourceProvider = HumanReferralProvider;

export type ModuleRegistration = {
  id: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  permissions: string[];
  eventSubscriptions: string[];
  uiComponents?: string[];
  safetyRequirements?: string[];
};

export interface ModuleRegistry {
  register(mod: ModuleRegistration): void;
  list(): ModuleRegistration[];
  get(id: string): ModuleRegistration | undefined;
}
