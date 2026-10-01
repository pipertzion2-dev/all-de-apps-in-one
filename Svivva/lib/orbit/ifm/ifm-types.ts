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

export type IfmPairingStatus = "planned" | "generated" | "indexed" | "archived";

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
};

export type IfmProjectConfig = {
  enabled?: boolean;
  pairCountPerRun?: number;
  lastGeneratedAt?: string;
  pairings?: IfmPairing[];
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
