import type { AdvocacyChannelId, ChannelWeights } from "./types";
import { ADVOCACY_CHANNELS } from "./types";

export function zeroWeights(): ChannelWeights {
  return Object.fromEntries(ADVOCACY_CHANNELS.map((c) => [c, 0])) as ChannelWeights;
}

export function clampWeight(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function normalizeWeights(partial: Partial<ChannelWeights>): ChannelWeights {
  const base = zeroWeights();
  for (const id of ADVOCACY_CHANNELS) {
    if (partial[id] != null) base[id] = clampWeight(partial[id]!);
  }
  return base;
}

export function mergeWeights(
  base: ChannelWeights,
  overlay: Partial<ChannelWeights>,
): ChannelWeights {
  const next = { ...base };
  for (const id of ADVOCACY_CHANNELS) {
    if (overlay[id] != null) next[id] = clampWeight(overlay[id]!);
  }
  return next;
}

export type ChannelCapability = {
  id: AdvocacyChannelId;
  label: string;
  description: string;
  /** Mixing-console feature graph id when registered. */
  platformFeatureId: string;
  safetyCritical?: boolean;
  defaultEnabled: boolean;
  inputs: string[];
  outputs: string[];
  eventSubscriptions: string[];
  permissions: string[];
};

export const CHANNEL_CAPABILITIES: ChannelCapability[] = [
  {
    id: "education",
    label: "Education",
    description: "School status, credits, transfers, educational goals.",
    platformFeatureId: "edu-education",
    defaultEnabled: true,
    inputs: ["education"],
    outputs: ["education", "action"],
    eventSubscriptions: ["education:*"],
    permissions: ["read:education", "write:education"],
  },
  {
    id: "student_rights_law",
    label: "Student Rights & Law",
    description: "Jurisdiction-aware legal information (not advice).",
    platformFeatureId: "edu-rights-law",
    defaultEnabled: true,
    inputs: ["legal", "identity"],
    outputs: ["legal", "action"],
    eventSubscriptions: ["legal:*", "identity:*"],
    permissions: ["read:legal"],
  },
  {
    id: "advocacy",
    label: "Advocacy",
    description: "Issue framing, requested resolution, communication history.",
    platformFeatureId: "edu-advocacy",
    defaultEnabled: true,
    inputs: ["advocacy", "education"],
    outputs: ["advocacy", "action"],
    eventSubscriptions: ["advocacy:*"],
    permissions: ["read:advocacy", "write:advocacy"],
  },
  {
    id: "ai_guide",
    label: "AI Guide",
    description: "Conversational structuring with clear role boundaries.",
    platformFeatureId: "edu-ai-guide",
    defaultEnabled: true,
    inputs: ["identity", "education", "advocacy", "safety"],
    outputs: ["action", "advocacy"],
    eventSubscriptions: ["*:*"],
    permissions: ["read:context", "write:action"],
  },
  {
    id: "crisis_safety",
    label: "Crisis & Safety",
    description: "Minimum-necessary safety routing to verified resources.",
    platformFeatureId: "edu-crisis",
    safetyCritical: true,
    defaultEnabled: true,
    inputs: ["safety", "identity"],
    outputs: ["safety", "resource", "action"],
    eventSubscriptions: ["safety:*"],
    permissions: ["read:safety", "route:crisis"],
  },
  {
    id: "human_assistance",
    label: "Human Assistance",
    description: "Referral adapters for counselors, advocates, legal aid.",
    platformFeatureId: "edu-human-help",
    defaultEnabled: true,
    inputs: ["resource", "advocacy", "safety"],
    outputs: ["action", "resource"],
    eventSubscriptions: ["resource:*", "action:*"],
    permissions: ["read:resource", "create:referral"],
  },
  {
    id: "opportunity_resources",
    label: "Opportunity & Resources",
    description: "Programs, scholarships, community supports via registry.",
    platformFeatureId: "edu-opportunities",
    defaultEnabled: true,
    inputs: ["resource", "education", "identity"],
    outputs: ["resource", "action"],
    eventSubscriptions: ["resource:*"],
    permissions: ["read:resource"],
  },
  {
    id: "career_pathways",
    label: "Career Pathways",
    description: "Future education and career orientation.",
    platformFeatureId: "edu-career",
    defaultEnabled: true,
    inputs: ["education"],
    outputs: ["education", "action"],
    eventSubscriptions: ["education:*"],
    permissions: ["read:education"],
  },
  {
    id: "story_timeline",
    label: "Story / Education Timeline",
    description: "Chronological education advocacy narrative.",
    platformFeatureId: "edu-story",
    defaultEnabled: true,
    inputs: ["education", "advocacy", "evidence"],
    outputs: ["education", "evidence"],
    eventSubscriptions: ["education:*", "evidence:*"],
    permissions: ["read:timeline", "write:timeline"],
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    description: "Encryption, key management, upload validation, audit.",
    platformFeatureId: "edu-cybersecurity",
    defaultEnabled: true,
    inputs: ["evidence", "identity"],
    outputs: ["evidence"],
    eventSubscriptions: ["evidence:*"],
    permissions: ["secure:vault", "audit:events"],
  },
  {
    id: "evidence_vault",
    label: "Evidence Vault",
    description: "Education Proof Vault (EPV) packages.",
    platformFeatureId: "edu-evidence-vault",
    defaultEnabled: true,
    inputs: ["evidence", "education", "advocacy"],
    outputs: ["evidence"],
    eventSubscriptions: ["evidence:*"],
    permissions: ["write:vault", "seal:vault"],
  },
  {
    id: "verification_ledger",
    label: "Verification Ledger",
    description: "Optional cryptographic anchoring via LedgerAdapter.",
    platformFeatureId: "edu-verification-ledger",
    defaultEnabled: true,
    inputs: ["evidence"],
    outputs: ["evidence"],
    eventSubscriptions: ["evidence:sealed"],
    permissions: ["anchor:proof", "verify:proof"],
  },
];

export function getChannelCapability(id: AdvocacyChannelId): ChannelCapability | undefined {
  return CHANNEL_CAPABILITIES.find((c) => c.id === id);
}
