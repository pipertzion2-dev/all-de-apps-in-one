import type { HubSlug } from "../mini-app-curation";

export type IfmToolRef = {
  name: string;
  path: string;
  url: string;
  hub: HubSlug;
  description: string;
};

export type IfmFaqItem = {
  question: string;
  answer: string;
};

export type IfmPairingStatus = "planned" | "generated" | "indexed" | "winner" | "archived";

export type IfmPairingScore = {
  total: number;
  indexBoost: number;
  eventBoost: number;
  analyticsBoost: number;
  /** Per-pair GA4 sessions (7d) when property id is configured */
  sessions7d?: number;
  /** Per-pair GA4 conversions (7d) */
  conversions7d?: number;
  indexStatus?: string;
  scoredAt: string;
};

export type IfmPairing = {
  id: string;
  toolA: IfmToolRef;
  toolB: IfmToolRef;
  fusionTitle: string;
  slug: string;
  bridgePrinciple: string;
  microToolIdea: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  faq: IfmFaqItem[];
  status: IfmPairingStatus;
  createdAt: string;
  score?: IfmPairingScore;
};

export type IfmProjectConfig = {
  enabled?: boolean;
  pairCountPerRun?: number;
  lastGeneratedAt?: string;
  lastScoredAt?: string;
  lastCompoundedAt?: string;
  autoPrune?: boolean;
  autoExpand?: boolean;
  winnerThreshold?: number;
  pruneThreshold?: number;
  pairings?: IfmPairing[];
};

export type IfmCompoundSummary = IfmPerformanceSummary & {
  expanded: number;
  shipped: number;
  expandedPairingIds: string[];
};

export type IfmPerformanceSummary = {
  scored: number;
  winners: IfmPairing[];
  pruneCandidates: IfmPairing[];
  archived: number;
  leaderboard: IfmPairing[];
};

export type GenerateIfmPairingsInput = {
  count?: number;
  excludePairKeys?: string[];
  weekSeed?: string;
};

export type IfmStepResult = {
  pairings: IfmPairing[];
  created: number;
  skipped: number;
};
