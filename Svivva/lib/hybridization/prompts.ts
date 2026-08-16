import type { SchematicInput } from "./types";
import {
  BIOMIMETIC_LIBRARY,
  MODE_GUIDANCE,
  SCIENTIFIC_PROTOCOL_VERSION,
  pickDomainBridge,
} from "./principles";

export const HYBRIDIZATION_SYSTEM_PROMPT = `You are the ZZAI Cross-Domain Hybridization Engine (protocol v${SCIENTIFIC_PROTOCOL_VERSION}).

You specialize in synthesizing two systems into novel hybrids using REAL scientific principles:
- Topology isomorphism / graph invariants (degree sequence, spectral properties)
- Domain bridging via shared governing equations (Fourier ↔ Ohm ↔ Darcy / Laplace; wave equation; reaction–diffusion; Landauer/Shannon for digital)
- Material / interface compatibility (CTE, galvanic, adhesion) OR digital contract compatibility
- Biomimetic structural motifs when relevant
- Emergent properties that are IMPOSSIBLE in either parent alone
- Falsifiable characterization tests

You think like the engineers who invented:
- iPhone vapor chamber (heat-pipe topology × PCB copper plane)
- Phononic crystal heatsinks (photonic bandgap × thermal metamaterials)
- Fractal PCB power planes (Murray's law venation × power distribution)
- Magnetocaloric coolers (magnetic Brayton × Stirling recuperator)

CRITICAL RULES:
1. Every claim must cite a named physical law, equation, or graph invariant.
2. Emergent properties must be non-additive — state why neither parent can achieve them alone.
3. Reject vague "synergy" language.
4. Return ONLY valid JSON matching the requested schema.`;

export function buildHybridizationUserPrompt(
  schematicA: SchematicInput,
  schematicB: SchematicInput,
  mode: string,
  targetApplication: string,
  depth: string,
): string {
  const bridge = pickDomainBridge(schematicA.domain, schematicB.domain);
  const propsA = schematicA.physicalProperties ?? {};
  const propsB = schematicB.physicalProperties ?? {};
  const biomimetic = BIOMIMETIC_LIBRARY.map((b) => `- ${b.name}: ${b.principle}`).join("\n");

  return `SCIENTIFIC PROTOCOL v${SCIENTIFIC_PROTOCOL_VERSION}

PREFERRED DOMAIN BRIDGE (${bridge.id}):
${bridge.principle}
Invariants: ${bridge.invariants.join(", ")}

SCHEMATIC A — "${schematicA.name}"
Domain: ${schematicA.domain}
Topology: ${schematicA.topology} graph
Core Components: ${schematicA.coreComponents.join(", ")}
Physical/Structural Properties: ${JSON.stringify(propsA)}
Constraints: ${schematicA.constraints?.join(", ") || "none specified"}
Has Image: ${schematicA.imageBase64 ? "YES" : "NO"}

SCHEMATIC B — "${schematicB.name}"
Domain: ${schematicB.domain}
Topology: ${schematicB.topology} graph
Core Components: ${schematicB.coreComponents.join(", ")}
Physical/Structural Properties: ${JSON.stringify(propsB)}
Constraints: ${schematicB.constraints?.join(", ") || "none specified"}
Has Image: ${schematicB.imageBase64 ? "YES" : "NO"}

HYBRIDIZATION MODE: ${mode}
${MODE_GUIDANCE[mode] || ""}

TARGET APPLICATION: ${targetApplication}
SCIENTIFIC DEPTH: ${depth}
${depth === "production" ? "Emphasize manufacturing readiness, supply chain, qualification tests, IP." : ""}
${depth === "research" ? "Emphasize novel mechanisms, experiments, theoretical models." : ""}
${depth === "prototype" ? "Emphasize off-the-shelf parts and near-term validation." : ""}

BIOMIMETIC LIBRARY (use when relevant):
${biomimetic}

REQUIRED ANALYSIS STEPS:
1. TOPOLOGY ISOMORPHISM — map G_A and G_B; node correspondence; shared invariants
2. DOMAIN BRIDGING — name the governing PDE / transport law unifying both domains
3. INTERFACE COMPATIBILITY — materials OR digital contracts / data schemas at the boundary
4. EMERGENT PROPERTY — at least one capability impossible in either parent alone
5. FALSIFIABLE TESTS — requiredCharacterizationTests must be measurable

Return this exact JSON:
{
  "topologicalBridge": "...",
  "domainBridgingPrinciple": "...",
  "materialCompatibilityNote": "...",
  "hybrids": [
    {
      "name": "...",
      "scientificBasis": "...",
      "topologyDescription": "...",
      "coreComponents": ["..."],
      "emergentProperties": ["..."],
      "performanceGains": { "metric": "value + mechanism" },
      "biomimeticAnalogue": "...",
      "manufacturingPathway": "...",
      "challenges": ["..."],
      "noveltyScore": 85,
      "patentLandscape": "...",
      "estimatedRnDMonths": 18,
      "trlLevel": 3
    }
  ],
  "optimalHybridIndex": 0,
  "requiredCharacterizationTests": ["..."],
  "referenceDesigns": ["..."],
  "nextSteps": ["..."]
}

Generate 3-4 hybrids.`;
}
