/**
 * Deterministic scientific hybridization calculator.
 * Runs without an LLM — scores domain affinity, topology fit, manufacturing readiness,
 * novelty, and risk like an automatic scientific instrument. AI results (when available)
 * are layered on top by the hybridize API.
 */

export type HybridDomain =
  | "thermal"
  | "electrical"
  | "mechanical"
  | "rf"
  | "optical"
  | "fluidic"
  | "acoustic"
  | "chemical";

export type HybridTopology = "star" | "mesh" | "tree" | "ring" | "hierarchical";

export type HybridizationMode = "complementary" | "antagonistic" | "emergent" | "biomimetic";

export type ScientificDepth = "prototype" | "research" | "production";

export type SchematicInput = {
  name: string;
  domain: HybridDomain;
  topology: HybridTopology;
  coreComponents: string[];
  physicalProperties?: {
    material?: string;
    operatingTemp?: string;
    powerDensity?: string;
    dimensions?: string;
    frequencyRange?: string;
  };
  constraints?: string[];
};

/** Laplace-family transport affinity (Fourier ↔ Ohm ↔ Darcy, etc.) — 0..1 */
const DOMAIN_AFFINITY: Record<HybridDomain, Partial<Record<HybridDomain, number>>> = {
  thermal: { thermal: 1, electrical: 0.92, fluidic: 0.78, mechanical: 0.55, optical: 0.4, rf: 0.35, acoustic: 0.3, chemical: 0.45 },
  electrical: { electrical: 1, thermal: 0.92, rf: 0.85, optical: 0.7, mechanical: 0.5, fluidic: 0.4, acoustic: 0.35, chemical: 0.4 },
  mechanical: { mechanical: 1, acoustic: 0.8, thermal: 0.55, fluidic: 0.65, electrical: 0.5, optical: 0.35, rf: 0.3, chemical: 0.4 },
  rf: { rf: 1, electrical: 0.85, optical: 0.75, acoustic: 0.55, thermal: 0.35, mechanical: 0.3, fluidic: 0.25, chemical: 0.2 },
  optical: { optical: 1, rf: 0.75, electrical: 0.7, chemical: 0.5, thermal: 0.4, acoustic: 0.35, mechanical: 0.35, fluidic: 0.3 },
  fluidic: { fluidic: 1, thermal: 0.78, chemical: 0.82, mechanical: 0.65, acoustic: 0.5, electrical: 0.4, optical: 0.3, rf: 0.25 },
  acoustic: { acoustic: 1, mechanical: 0.8, rf: 0.55, fluidic: 0.5, optical: 0.35, thermal: 0.3, electrical: 0.35, chemical: 0.25 },
  chemical: { chemical: 1, fluidic: 0.82, thermal: 0.45, optical: 0.5, electrical: 0.4, mechanical: 0.4, acoustic: 0.25, rf: 0.2 },
};

const TOPOLOGY_COMPAT: Record<HybridTopology, Partial<Record<HybridTopology, number>>> = {
  star: { star: 1, hierarchical: 0.85, tree: 0.7, mesh: 0.45, ring: 0.4 },
  mesh: { mesh: 1, ring: 0.7, hierarchical: 0.55, star: 0.45, tree: 0.5 },
  tree: { tree: 1, hierarchical: 0.9, star: 0.7, mesh: 0.5, ring: 0.35 },
  ring: { ring: 1, mesh: 0.7, star: 0.4, hierarchical: 0.4, tree: 0.35 },
  hierarchical: { hierarchical: 1, tree: 0.9, star: 0.85, mesh: 0.55, ring: 0.4 },
};

const MODE_WEIGHTS: Record<
  HybridizationMode,
  { affinityBias: number; noveltyBias: number; riskBias: number }
> = {
  complementary: { affinityBias: 1.15, noveltyBias: 0.85, riskBias: 0.9 },
  antagonistic: { affinityBias: 0.75, noveltyBias: 1.1, riskBias: 1.15 },
  emergent: { affinityBias: 0.7, noveltyBias: 1.35, riskBias: 1.2 },
  biomimetic: { affinityBias: 1.05, noveltyBias: 1.15, riskBias: 0.95 },
};

const GOVERNING_LAWS: Record<HybridDomain, string> = {
  thermal: "Fourier's law q = −k∇T (Laplace ∇²T = 0 in steady state)",
  electrical: "Ohm's law J = σE / Kirchhoff current law (Laplace ∇²V = 0)",
  mechanical: "Navier–Cauchy / Hooke's law; modal wave equation",
  rf: "Maxwell curl equations; Helmholtz wave equation",
  optical: "Wave optics / eikonal; Maxwell at optical frequencies",
  fluidic: "Darcy / Navier–Stokes; continuity ∇·v = 0",
  acoustic: "Linear wave equation; Helmholtz Helmholtz(k)",
  chemical: "Fick's laws + reaction–diffusion (∇·D∇c + R = ∂c/∂t)",
};

const BIOMIMETIC_HINTS: Record<string, string> = {
  "thermal|electrical": "Termite mound passive convection + vascular leaf venation (Murray’s law)",
  "thermal|fluidic": "Counter-current fish gill heat exchange / desert beetle fog harvesting",
  "electrical|optical": "Moth-eye anti-reflection nanostructures + retinal photoreceptor tiling",
  "mechanical|acoustic": "Owl wing fringe noise suppression / cicada tymbal resonance",
  "rf|optical": "Photonic crystal bandgap dual of phononic/EM metamaterials",
  "fluidic|chemical": "Kidney nephron cascade / plant xylem–phloem coupled transport",
  "mechanical|thermal": "Pine cone hygromorphic bilayers / SMA thermomechanical cycles",
  "electrical|mechanical": "Gecko setae van der Waals adhesion + electrostatic MEMS switches",
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function domainPairKey(a: HybridDomain, b: HybridDomain) {
  return [a, b].sort().join("|");
}

export function inferDomainFromText(text: string): HybridDomain {
  const t = text.toLowerCase();
  if (/(rf|microwave|antenna|radar|5g|mmwave)/.test(t)) return "rf";
  if (/(optic|laser|photon|lens|fiber|led)/.test(t)) return "optical";
  if (/(fluid|pump|valve|hydraulic|pneumatic|flow|microfluidic)/.test(t)) return "fluidic";
  if (/(acoustic|ultrasound|speaker|mic|sonar|piezo)/.test(t)) return "acoustic";
  if (/(chem|battery|electrolyte|catalyst|polymer|corrosion)/.test(t)) return "chemical";
  if (/(thermal|heat|cool|vapor|heatsink|thermo|peltier)/.test(t)) return "thermal";
  if (/(mech|gear|spring|actuator|structur|frame|bearing)/.test(t)) return "mechanical";
  if (/(electr|pcb|circuit|voltage|current|motor|sensor|chip)/.test(t)) return "electrical";
  return "mechanical";
}

export function inferTopologyFromText(text: string): HybridTopology {
  const t = text.toLowerCase();
  if (/mesh|grid|lattice|network/.test(t)) return "mesh";
  if (/ring|loop|circular/.test(t)) return "ring";
  if (/hierarch|layered|stack/.test(t)) return "hierarchical";
  if (/tree|branch|fractal|venation/.test(t)) return "tree";
  if (/star|hub|central|spoke/.test(t)) return "star";
  return "mesh";
}

/** Normalize free-form systemA/systemB payloads into schematics. */
export function schematicFromLoose(input: {
  name?: string;
  description?: string;
  components?: string[];
  properties?: string[];
  domain?: string;
  topology?: string;
}): SchematicInput {
  const blob = `${input.name ?? ""} ${input.description ?? ""} ${(input.components ?? []).join(" ")}`;
  const domain =
    (input.domain as HybridDomain) ||
    inferDomainFromText(blob);
  const topology =
    (input.topology as HybridTopology) ||
    inferTopologyFromText(blob);
  const comps =
    input.components?.filter(Boolean).length
      ? input.components.filter(Boolean).slice(0, 12)
      : blob
          .split(/[,;/]| and /i)
          .map((s) => s.trim())
          .filter((s) => s.length > 2 && s.length < 60)
          .slice(0, 6);
  return {
    name: (input.name || "Untitled system").slice(0, 200),
    domain: (
      [
        "thermal",
        "electrical",
        "mechanical",
        "rf",
        "optical",
        "fluidic",
        "acoustic",
        "chemical",
      ] as HybridDomain[]
    ).includes(domain)
      ? domain
      : inferDomainFromText(blob),
    topology: (
      ["star", "mesh", "tree", "ring", "hierarchical"] as HybridTopology[]
    ).includes(topology)
      ? topology
      : "mesh",
    coreComponents: comps.length ? comps : ["primary transducer", "structure", "interface"],
    constraints: input.properties?.slice(0, 8) ?? [],
    physicalProperties: {},
  };
}

export type ScientificHybridReport = {
  calculatorVersion: "1.0";
  scores: {
    domainAffinity: number;
    topologyFit: number;
    materialInterfaceRisk: number;
    noveltyIndex: number;
    manufacturingReadiness: number;
    hybridViability: number;
    estimatedTrl: number;
    estimatedRnDMonths: number;
  };
  equations: {
    domainA: string;
    domainB: string;
    bridgingPrinciple: string;
  };
  biomimeticAnalogue: string;
  materialCompatibilityNote: string;
  topologicalBridge: string;
  automaticHybrids: Array<{
    name: string;
    scientificBasis: string;
    topologyDescription: string;
    coreComponents: string[];
    emergentProperties: string[];
    performanceGains: Record<string, string>;
    biomimeticAnalogue: string;
    manufacturingPathway: string;
    challenges: string[];
    noveltyScore: number;
    patentLandscape: string;
    estimatedRnDMonths: number;
    trlLevel: number;
  }>;
  requiredCharacterizationTests: string[];
  nextSteps: string[];
  interpretation: string;
};

function materialRisk(a: SchematicInput, b: SchematicInput): number {
  const ma = (a.physicalProperties?.material || "").toLowerCase();
  const mb = (b.physicalProperties?.material || "").toLowerCase();
  if (!ma || !mb) return 42; // unknown → moderate
  if (ma === mb) return 12;
  const galvanicBad =
    (/(aluminum|aluminium)/.test(ma) && /copper/.test(mb)) ||
    (/(aluminum|aluminium)/.test(mb) && /copper/.test(ma));
  if (galvanicBad) return 78;
  if (/polymer|plastic|resin/.test(ma) && /metal|copper|steel|aluminum/.test(mb)) return 55;
  if (/polymer|plastic|resin/.test(mb) && /metal|copper|steel|aluminum/.test(ma)) return 55;
  return 35;
}

export function runScientificHybridization(opts: {
  schematicA: SchematicInput;
  schematicB: SchematicInput;
  hybridizationMode: HybridizationMode;
  targetApplication: string;
  scientificDepth: ScientificDepth;
}): ScientificHybridReport {
  const { schematicA: a, schematicB: b, hybridizationMode: mode, targetApplication, scientificDepth: depth } =
    opts;
  const w = MODE_WEIGHTS[mode];

  const rawAffinity = DOMAIN_AFFINITY[a.domain]?.[b.domain] ?? DOMAIN_AFFINITY[b.domain]?.[a.domain] ?? 0.35;
  const domainAffinity = clamp(rawAffinity * 100 * w.affinityBias);

  const rawTopo = TOPOLOGY_COMPAT[a.topology]?.[b.topology] ?? TOPOLOGY_COMPAT[b.topology]?.[a.topology] ?? 0.4;
  const topologyFit = clamp(rawTopo * 100);

  const materialInterfaceRisk = clamp(materialRisk(a, b) * w.riskBias);

  const domainDistance = 1 - rawAffinity;
  const noveltyIndex = clamp((35 + domainDistance * 55 + (mode === "emergent" ? 12 : 0)) * w.noveltyBias);

  const depthBase = depth === "production" ? 72 : depth === "research" ? 48 : 58;
  const sharedHints = a.coreComponents.filter((c) =>
    b.coreComponents.some((d) => d.toLowerCase().includes(c.toLowerCase().slice(0, 5))),
  ).length;
  const manufacturingReadiness = clamp(
    depthBase + topologyFit * 0.15 - materialInterfaceRisk * 0.25 + sharedHints * 4,
  );

  const hybridViability = clamp(
    domainAffinity * 0.35 +
      topologyFit * 0.25 +
      (100 - materialInterfaceRisk) * 0.2 +
      manufacturingReadiness * 0.2,
  );

  const estimatedTrl = clamp(
    Math.round(
      depth === "production"
        ? 4 + hybridViability / 25
        : depth === "research"
          ? 2 + hybridViability / 35
          : 3 + hybridViability / 30,
    ),
    1,
    9,
  );

  const estimatedRnDMonths = Math.round(
    clamp(36 - hybridViability * 0.22 + noveltyIndex * 0.12 + (depth === "research" ? 8 : 0), 4, 48),
  );

  const pair = domainPairKey(a.domain, b.domain);
  const biomimetic =
    BIOMIMETIC_HINTS[pair] ||
    "Bouligand helicoidal composites / hierarchical nacre brick-and-mortar toughening";

  const bridgingPrinciple =
    rawAffinity >= 0.7
      ? `Both domains admit a Laplace/Poisson potential formulation — map ${a.domain} potentials onto ${b.domain} fluxes via isomorphism of ∇²φ = 0 transport.`
      : `Bridge via multi-physics interface: conserve energy/momentum at the ${a.domain}–${b.domain} boundary; use weakly coupled FEM with shared DOFs.`;

  const topologicalBridge = `G_A (${a.topology}, ${a.coreComponents.length} nodes) ↔ G_B (${b.topology}, ${b.coreComponents.length} nodes). Topology fit ${round1(topologyFit)}/100. Prefer ${
    topologyFit >= 70 ? "subgraph isomorphism merge" : "hierarchical encapsulation with adapter edges"
  }.`;

  const materialCompatibilityNote =
    materialInterfaceRisk >= 60
      ? `Elevated interface risk (${round1(materialInterfaceRisk)}/100). Specify barrier layers, CTE-matched interposers, and galvanic isolation.`
      : `Moderate interface risk (${round1(materialInterfaceRisk)}/100). Standard joining + thermal/electrical isolation usually sufficient.`;

  const hybridName = `${a.domain[0].toUpperCase()}${a.domain.slice(1)}–${b.domain} ${mode} hybrid for ${targetApplication.slice(0, 48)}`;

  const automaticHybrids = [
    {
      name: hybridName,
      scientificBasis: `${bridgingPrinciple} Mode=${mode}. Affinity ${round1(domainAffinity)}/100.`,
      topologyDescription: topologicalBridge,
      coreComponents: [
        ...a.coreComponents.slice(0, 3),
        ...b.coreComponents.slice(0, 3),
        "multi-physics interface layer",
      ],
      emergentProperties: [
        mode === "emergent"
          ? "Phase-transition capability neither parent exhibits alone"
          : "Cross-domain transport efficiency gain",
        "Shared control surface across both physical domains",
      ],
      performanceGains: {
        hybrid_viability: `${round1(hybridViability)}/100 composite score`,
        domain_affinity: `${round1(domainAffinity)}/100`,
        novelty_index: `${round1(noveltyIndex)}/100`,
      },
      biomimeticAnalogue: biomimetic,
      manufacturingPathway:
        depth === "production"
          ? "DFM review → process FMEA → pilot tooling → PPAP/FAI → ramp"
          : depth === "research"
            ? "Coupled multiphysics sim → coupon tests → instrumented prototype → characterization matrix"
            : "Off-the-shelf modules → breadboard interface → benchtop validation → iterate",
      challenges: [
        materialInterfaceRisk >= 50 ? "Interface reliability under thermal cycling" : "Calibration across domains",
        "Cross-domain sensing & closed-loop control",
        noveltyIndex >= 70 ? "Limited prior art — higher validation burden" : "Integration packaging constraints",
      ],
      noveltyScore: Math.round(noveltyIndex),
      patentLandscape: "Run freedom-to-operate on interface topology + dual-domain claims before tooling.",
      estimatedRnDMonths,
      trlLevel: estimatedTrl,
    },
    {
      name: `${mode} adapter capsule: ${a.name} × ${b.name}`,
      scientificBasis: `Encapsulate weaker topology inside stronger (${topologyFit >= 60 ? a.topology : "hierarchical"} backbone) with energy-conserving ports.`,
      topologyDescription: `Adapter edges between ${a.topology} and ${b.topology}; preserve degree-critical hubs.`,
      coreComponents: ["adapter PCB/manifold", ...a.coreComponents.slice(0, 2), ...b.coreComponents.slice(0, 2)],
      emergentProperties: ["Hot-swappable domain modules", "Fail-soft isolation between parents"],
      performanceGains: {
        modularity: "+1 integration axis",
        risk_reduction: `${round1(100 - materialInterfaceRisk * 0.5)}% relative`,
      },
      biomimeticAnalogue: biomimetic,
      manufacturingPathway: "Modular subassemblies → connectorized test → system integration",
      challenges: ["Connector reliability", "EMI / fluid / thermal cross-talk at adapters"],
      noveltyScore: Math.round(clamp(noveltyIndex * 0.85)),
      patentLandscape: "Focus claims on adapter geometry and dual-domain port mapping.",
      estimatedRnDMonths: Math.max(4, estimatedRnDMonths - 4),
      trlLevel: Math.min(9, estimatedTrl + 1),
    },
  ];

  const requiredCharacterizationTests = [
    `Coupled ${a.domain}/${b.domain} bench test under target loads for "${targetApplication}"`,
    "Interface thermal/electrical/mechanical cycling (per material risk)",
    depth === "production" ? "Reliability demonstration (HALT/HASS sample)" : "Uncertainty quantification on governing-equation residuals",
  ];

  const nextSteps = [
    "Lock interface ICD (inputs/outputs, tolerances, environments)",
    "Run multiphysics simulation validating the bridging principle",
    "Build a minimum hybrid coupon and measure emergent metrics",
    "Feed results into Manufacture Studio → sourcing + blueprint",
  ];

  const interpretation =
    hybridViability >= 70
      ? `Strong hybrid candidate — proceed to ${depth} pathway with confidence.`
      : hybridViability >= 45
        ? "Viable with focused interface engineering — prioritize material stack and topology adapters."
        : "Speculative hybrid — treat as research probe; reduce novelty or increase affinity before tooling.";

  return {
    calculatorVersion: "1.0",
    scores: {
      domainAffinity: round1(domainAffinity),
      topologyFit: round1(topologyFit),
      materialInterfaceRisk: round1(materialInterfaceRisk),
      noveltyIndex: round1(noveltyIndex),
      manufacturingReadiness: round1(manufacturingReadiness),
      hybridViability: round1(hybridViability),
      estimatedTrl,
      estimatedRnDMonths,
    },
    equations: {
      domainA: GOVERNING_LAWS[a.domain],
      domainB: GOVERNING_LAWS[b.domain],
      bridgingPrinciple,
    },
    biomimeticAnalogue: biomimetic,
    materialCompatibilityNote,
    topologicalBridge,
    automaticHybrids,
    requiredCharacterizationTests,
    nextSteps,
    interpretation,
  };
}
