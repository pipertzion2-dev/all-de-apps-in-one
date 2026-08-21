import { z } from "zod";
import { ageRangeSchema, SCHEMA_VERSION } from "../types";

/** IDENTITY BUS — pseudonymous identity, consent, jurisdiction preferences. */
export const identityBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  pseudonymousUserId: z.string().min(1),
  ageRange: ageRangeSchema.optional().default("unknown"),
  jurisdiction: z
    .object({
      country: z.string().min(2).max(8).optional(),
      stateProvince: z.string().max(80).optional(),
      district: z.string().max(120).optional(),
    })
    .optional(),
  preferences: z.record(z.string(), z.unknown()).optional().default({}),
  consentState: z
    .object({
      dataProcessing: z.boolean().default(false),
      selectiveSharing: z.boolean().default(false),
      optionalLedgerAnchor: z.boolean().default(false),
      updatedAt: z.string().optional(),
    })
    .optional(),
});

/** EDUCATION BUS */
export const educationBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  currentSchoolStatus: z
    .enum([
      "enrolled",
      "withdrawn",
      "transferred",
      "homeschooled",
      "expelled",
      "suspended",
      "unknown",
      "other",
    ])
    .optional()
    .default("unknown"),
  grade: z.string().max(40).optional(),
  credits: z.string().max(200).optional(),
  transfers: z.array(z.string().max(300)).optional().default([]),
  attendanceIssues: z.string().max(1000).optional(),
  educationalInterruptions: z.array(z.string().max(500)).optional().default([]),
  desiredOutcome: z.string().max(1000).optional(),
  futureEducationalGoal: z.string().max(1000).optional(),
});

/** ADVOCACY BUS */
export const advocacyBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  issue: z.string().max(2000).optional(),
  requestedResolution: z.string().max(2000).optional(),
  organizationsInvolved: z.array(z.string().max(200)).optional().default([]),
  peopleContacted: z.array(z.string().max(200)).optional().default([]),
  communicationHistory: z
    .array(
      z.object({
        at: z.string(),
        summary: z.string().max(1000),
        channel: z.string().max(80).optional(),
      }),
    )
    .optional()
    .default([]),
});

/** LEGAL CONTEXT BUS — information only, not advice. */
export const legalContextBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  country: z.string().max(8).optional(),
  stateProvince: z.string().max(80).optional(),
  district: z.string().max(120).optional(),
  relevantLegalTopic: z.string().max(200).optional(),
  authoritySources: z.array(z.string().max(300)).optional().default([]),
  effectiveDates: z.array(z.string().max(40)).optional().default([]),
  verificationStatus: z
    .enum(["unverified", "directory_verified", "authority_cited", "superseded"])
    .optional()
    .default("unverified"),
});

/**
 * SAFETY BUS — minimum necessary. Do not duplicate sensitive crisis content across modules.
 */
export const safetyBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  needsImmediateHelp: z.boolean().optional().default(false),
  routingCategory: z
    .enum([
      "immediate_physical_danger",
      "emotional_psychological_crisis",
      "abuse_neglect",
      "housing_instability",
      "education_exclusion",
      "potential_rights_issue",
      "urgent_legal_assistance",
      "school_conflict",
      "non_emergency_advocacy",
      "none",
    ])
    .optional()
    .default("none"),
  /** Opaque handle to crisis session — not the conversation contents. */
  crisisSessionRef: z.string().max(80).optional(),
  jurisdictionHint: z.string().max(80).optional(),
});

/** EVIDENCE BUS */
export const evidenceBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  evidenceObjectId: z.string().min(1),
  evidenceType: z
    .enum([
      "statement",
      "document",
      "message",
      "screenshot",
      "pdf",
      "photograph",
      "audio",
      "timeline",
      "correspondence",
      "other",
    ])
    .default("other"),
  source: z.string().max(300).optional(),
  timestamp: z.string(),
  hash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
  version: z.number().int().min(1).default(1),
  chainOfCustodyRef: z.string().optional(),
  verificationState: z
    .enum(["Draft", "Protected", "Sealed", "Verified", "Shared", "Superseded"])
    .default("Draft"),
});

/** RESOURCE BUS */
export const resourceBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  organizations: z.array(z.string()).optional().default([]),
  legalAid: z.array(z.string()).optional().default([]),
  schoolContacts: z.array(z.string()).optional().default([]),
  advocates: z.array(z.string()).optional().default([]),
  governmentAgencies: z.array(z.string()).optional().default([]),
  communityPrograms: z.array(z.string()).optional().default([]),
  crisisResources: z.array(z.string()).optional().default([]),
  eligibilityJurisdiction: z.string().max(120).optional(),
});

/** ACTION BUS */
export const actionBusSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  recommendedNextSteps: z.array(z.string().max(500)).optional().default([]),
  deadlines: z
    .array(
      z.object({
        label: z.string().max(200),
        dueAt: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  followUps: z.array(z.string().max(500)).optional().default([]),
  referrals: z.array(z.string().max(300)).optional().default([]),
  userSelectedActions: z.array(z.string().max(300)).optional().default([]),
});

export type IdentityBus = z.infer<typeof identityBusSchema>;
export type EducationBus = z.infer<typeof educationBusSchema>;
export type AdvocacyBus = z.infer<typeof advocacyBusSchema>;
export type LegalContextBus = z.infer<typeof legalContextBusSchema>;
export type SafetyBus = z.infer<typeof safetyBusSchema>;
export type EvidenceBus = z.infer<typeof evidenceBusSchema>;
export type ResourceBus = z.infer<typeof resourceBusSchema>;
export type ActionBus = z.infer<typeof actionBusSchema>;

export type SharedContextSnapshot = {
  identity?: IdentityBus;
  education?: EducationBus;
  advocacy?: AdvocacyBus;
  legal?: LegalContextBus;
  safety?: SafetyBus;
  evidence?: EvidenceBus[];
  resources?: ResourceBus;
  actions?: ActionBus;
};
