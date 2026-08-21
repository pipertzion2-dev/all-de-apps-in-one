import { z } from "zod";
import type { EvidenceStatus } from "./disclaimers";

export const SCHEMA_VERSION = "ZZAI-EduAdvocate/1.0";

export const ADVOCACY_CHANNELS = [
  "education",
  "student_rights_law",
  "advocacy",
  "ai_guide",
  "crisis_safety",
  "human_assistance",
  "opportunity_resources",
  "career_pathways",
  "story_timeline",
  "cybersecurity",
  "evidence_vault",
  "verification_ledger",
] as const;

export type AdvocacyChannelId = (typeof ADVOCACY_CHANNELS)[number];

export const CHANNEL_LABELS: Record<AdvocacyChannelId, string> = {
  education: "Education",
  student_rights_law: "Student Rights & Law",
  advocacy: "Advocacy",
  ai_guide: "AI Guide",
  crisis_safety: "Crisis & Safety",
  human_assistance: "Human Assistance",
  opportunity_resources: "Opportunity & Resources",
  career_pathways: "Career Pathways",
  story_timeline: "Story / Education Timeline",
  cybersecurity: "Cybersecurity",
  evidence_vault: "Evidence Vault",
  verification_ledger: "Verification Ledger",
};

/** Channel weights are 0–100; never present as medical/legal/criminal determinations. */
export type ChannelWeights = Record<AdvocacyChannelId, number>;

export type RoutingReason = {
  channel: AdvocacyChannelId;
  reason: string;
  weightDelta: number;
};

export type ModulePriorityInputs = {
  contextRelevance: number;
  userIntentWeight: number;
  riskWeight: number;
  evidenceConfidence: number;
  jurisdictionConfidence: number;
  resourceAvailability: number;
};

export function computeModulePriority(i: ModulePriorityInputs): number {
  return (
    i.contextRelevance *
    i.userIntentWeight *
    i.riskWeight *
    i.evidenceConfidence *
    i.jurisdictionConfidence *
    i.resourceAvailability
  );
}

export const ageRangeSchema = z.enum(["under_13", "13_17", "18_plus", "unknown"]);
export type AgeRange = z.infer<typeof ageRangeSchema>;

export const evidenceStatusSchema = z.enum([
  "Draft",
  "Protected",
  "Sealed",
  "Verified",
  "Shared",
  "Superseded",
]);

export type { EvidenceStatus };

export const extensionFieldsSchema = z.record(z.string(), z.unknown()).optional();

export type ExtensibleRecord = {
  id: string;
  schemaVersion: string;
  createdAt: string;
  updatedAt?: string;
  source?: string;
  jurisdiction?: string;
  verifiedAt?: string;
  extension?: Record<string, unknown>;
};
