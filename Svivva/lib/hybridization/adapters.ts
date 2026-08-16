import { TOPOLOGIES, type EngineeringDomain, type SchematicInput } from "./types";

type Topology = (typeof TOPOLOGIES)[number];

const DOMAIN_KEYWORDS: Array<{ domain: EngineeringDomain; keys: string[] }> = [
  { domain: "thermal", keys: ["heat", "thermal", "cooling", "temp", "vapor", "heatsink"] },
  { domain: "electrical", keys: ["electric", "pcb", "power", "voltage", "circuit", "battery"] },
  { domain: "mechanical", keys: ["mech", "gear", "struct", "actuator", "motor", "frame"] },
  { domain: "rf", keys: ["rf", "antenna", "radio", "wireless", "5g", "microwave"] },
  { domain: "optical", keys: ["optic", "laser", "lens", "photon", "camera", "led"] },
  { domain: "fluidic", keys: ["fluid", "pump", "valve", "hydraulic", "pneumatic", "microfluid"] },
  { domain: "acoustic", keys: ["acoustic", "audio", "speaker", "ultrasound", "mic"] },
  { domain: "chemical", keys: ["chem", "battery chem", "cataly", "react", "polymer"] },
  { domain: "digital", keys: ["api", "software", "endpoint", "saas", "ml", "llm", "data"] },
  { domain: "information", keys: ["info", "signal", "entropy", "network", "protocol"] },
];

export function inferDomain(
  text: string,
  fallback: EngineeringDomain = "mechanical",
): EngineeringDomain {
  const lower = text.toLowerCase();
  for (const row of DOMAIN_KEYWORDS) {
    if (row.keys.some((k) => lower.includes(k))) return row.domain;
  }
  return fallback;
}

export function inferTopology(text: string): Topology {
  const lower = text.toLowerCase();
  if (lower.includes("mesh") || lower.includes("lattice")) return "mesh";
  if (lower.includes("ring") || lower.includes("loop")) return "ring";
  if (lower.includes("tree") || lower.includes("hierarch") || lower.includes("fractal"))
    return "hierarchical";
  if (lower.includes("star") || lower.includes("hub")) return "star";
  return "tree";
}

/** Map free-form legacy systemA/systemB payloads into scientific schematics. */
export function adaptLegacySystems(input: {
  systemA: { name: string; description?: string; components?: string[]; properties?: string[] };
  systemB: { name: string; description?: string; components?: string[]; properties?: string[] };
}): { schematicA: SchematicInput; schematicB: SchematicInput } {
  const textA = `${input.systemA.name} ${input.systemA.description || ""}`;
  const textB = `${input.systemB.name} ${input.systemB.description || ""}`;
  const compsA =
    input.systemA.components && input.systemA.components.length > 0
      ? input.systemA.components.slice(0, 20)
      : [input.systemA.name, ...(input.systemA.description || "").split(/[,;]/).slice(0, 4)].filter(
          Boolean,
        );
  const compsB =
    input.systemB.components && input.systemB.components.length > 0
      ? input.systemB.components.slice(0, 20)
      : [input.systemB.name, ...(input.systemB.description || "").split(/[,;]/).slice(0, 4)].filter(
          Boolean,
        );

  return {
    schematicA: {
      name: input.systemA.name,
      domain: inferDomain(textA),
      topology: inferTopology(textA),
      coreComponents: compsA.length ? compsA : [input.systemA.name],
      physicalProperties: {},
      constraints: input.systemA.properties || [],
    },
    schematicB: {
      name: input.systemB.name,
      domain: inferDomain(textB),
      topology: inferTopology(textB),
      coreComponents: compsB.length ? compsB : [input.systemB.name],
      physicalProperties: {},
      constraints: input.systemB.properties || [],
    },
  };
}

/** Map hypothesis / idea sources into schematics for hybridization. */
export function adaptSourcesToSchematics(
  sources: Array<{ name: string; type?: string; description?: string }>,
): { schematicA: SchematicInput; schematicB: SchematicInput } | null {
  if (sources.length < 2) return null;
  const [a, b] = sources;
  const domainFallback = (t?: string): EngineeringDomain =>
    t?.includes("digital") || t?.includes("api") ? "digital" : "mechanical";

  return {
    schematicA: {
      name: a.name,
      domain: inferDomain(
        `${a.name} ${a.description || ""} ${a.type || ""}`,
        domainFallback(a.type),
      ),
      topology: inferTopology(`${a.description || ""} ${a.type || ""}`),
      coreComponents: [
        a.name,
        a.type || "component",
        ...(a.description || "").split(/\s+/).slice(0, 3),
      ].filter(Boolean),
      physicalProperties: {},
      constraints: [],
    },
    schematicB: {
      name: b.name,
      domain: inferDomain(
        `${b.name} ${b.description || ""} ${b.type || ""}`,
        domainFallback(b.type),
      ),
      topology: inferTopology(`${b.description || ""} ${b.type || ""}`),
      coreComponents: [
        b.name,
        b.type || "component",
        ...(b.description || "").split(/\s+/).slice(0, 3),
      ].filter(Boolean),
      physicalProperties: {},
      constraints: [],
    },
  };
}

/** Normalize hybrids for blueprint PDF (legacy title/emergentBehavior fields). */
export function toBlueprintHybrids(
  hybrids: Array<{
    name?: string;
    title?: string;
    noveltyScore?: number;
    scientificBasis?: string;
    emergentProperties?: string[];
    emergentBehavior?: string;
    challenges?: string[];
    coreComponents?: string[];
  }>,
) {
  return hybrids.map((h) => ({
    title: h.title || h.name || "Hybrid design",
    noveltyScore: h.noveltyScore,
    scientificBasis: h.scientificBasis,
    emergentBehavior:
      h.emergentBehavior ||
      (h.emergentProperties && h.emergentProperties.length
        ? h.emergentProperties.join("; ")
        : undefined),
    challenges: h.challenges,
    components: h.coreComponents,
  }));
}
