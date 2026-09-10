import {
  ANALYSIS_STEPS,
  BIOMIMETIC_LIBRARY,
  DOMAIN_BRIDGES,
  GRAPH_INVARIANTS,
  MODE_GUIDANCE,
  REFERENCE_DESIGNS,
  SCIENTIFIC_PROTOCOL_VERSION,
  matchingDomainBridges,
} from "./principles";
import {
  ENGINEERING_DOMAINS,
  HYBRIDIZATION_MODES,
  SCIENTIFIC_DEPTHS,
  TOPOLOGIES,
} from "./types";

export type ScientificCatalog = {
  protocolVersion: string;
  domainBridges: typeof DOMAIN_BRIDGES;
  biomimeticLibrary: typeof BIOMIMETIC_LIBRARY;
  modeGuidance: typeof MODE_GUIDANCE;
  referenceDesigns: typeof REFERENCE_DESIGNS;
  analysisSteps: typeof ANALYSIS_STEPS;
  graphInvariants: typeof GRAPH_INVARIANTS;
  engineeringDomains: typeof ENGINEERING_DOMAINS;
  topologies: typeof TOPOLOGIES;
  hybridizationModes: typeof HYBRIDIZATION_MODES;
  scientificDepths: typeof SCIENTIFIC_DEPTHS;
};

/** Full scientific protocol — not limited to saved blends or fallback templates. */
export function getScientificCatalog(): ScientificCatalog {
  return {
    protocolVersion: SCIENTIFIC_PROTOCOL_VERSION,
    domainBridges: DOMAIN_BRIDGES,
    biomimeticLibrary: BIOMIMETIC_LIBRARY,
    modeGuidance: MODE_GUIDANCE,
    referenceDesigns: REFERENCE_DESIGNS,
    analysisSteps: ANALYSIS_STEPS,
    graphInvariants: GRAPH_INVARIANTS,
    engineeringDomains: ENGINEERING_DOMAINS,
    topologies: TOPOLOGIES,
    hybridizationModes: HYBRIDIZATION_MODES,
    scientificDepths: SCIENTIFIC_DEPTHS,
  };
}

export function formatAllDomainBridgesForPrompt(): string {
  return DOMAIN_BRIDGES.map(
    (b) =>
      `[${b.id}] domains=${b.domains.join("/")}\n${b.principle}\nInvariants: ${b.invariants.join(", ")}`,
  ).join("\n\n");
}

export function formatReferenceDesignsForPrompt(): string {
  return REFERENCE_DESIGNS.map((r) => `- ${r.name}: ${r.principle}`).join("\n");
}

export function formatAnalysisStepsForPrompt(): string {
  return ANALYSIS_STEPS.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`).join("\n");
}

export function formatBiomimeticLibraryForPrompt(): string {
  return BIOMIMETIC_LIBRARY.map((b) => `- ${b.name}: ${b.principle}`).join("\n");
}

export function bridgesForDomains(domainA: string, domainB: string) {
  const direct = matchingDomainBridges(domainA, domainB);
  if (direct.length > 0) return direct;
  return [...DOMAIN_BRIDGES];
}
