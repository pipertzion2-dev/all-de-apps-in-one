import { PLATFORM_FEATURES, getFeature, type PlatformFeature } from "@/lib/platform/feature-graph";
import { inferDomain, inferTopology } from "./adapters";
import { pickDomainBridge, SCIENTIFIC_PROTOCOL_VERSION } from "./principles";
import type {
  EngineeringDomain,
  HybridizationMode,
  HybridizationResult,
  SchematicInput,
} from "./types";

/** Hybridization² is the lab ceiling: blends of blends, not a third generation. */
export const HYBRID_LAB_MAX_ORDER = 2 as const;

export type HybridOrder = 0 | 1 | 2;

export type HybridParentKind = "feature" | "hybrid";

export type HybridParentRef = {
  kind: HybridParentKind;
  id: string;
  label: string;
  description: string;
  order: HybridOrder;
  lineage: string[];
  components?: string[];
};

export type FeatureHybridPair = {
  id: string;
  a: PlatformFeature;
  b: PlatformFeature;
};

export function listHybridizableFeatures(includeAdmin = true): PlatformFeature[] {
  return PLATFORM_FEATURES.filter((f) => includeAdmin || !f.adminOnly).sort(
    (a, b) => a.channel - b.channel,
  );
}

export function pairId(idA: string, idB: string): string {
  return [idA, idB].sort().join("__");
}

export function listFeatureHybridPairs(includeAdmin = true): FeatureHybridPair[] {
  const features = listHybridizableFeatures(includeAdmin);
  const pairs: FeatureHybridPair[] = [];
  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const a = features[i];
      const b = features[j];
      pairs.push({ id: pairId(a.id, b.id), a, b });
    }
  }
  return pairs;
}

export function featurePairCount(n: number): number {
  return (n * (n - 1)) / 2;
}

export function nextHybridOrder(orderA: HybridOrder, orderB: HybridOrder): 1 | 2 {
  if (orderA === 0 && orderB === 0) return 1;
  return 2;
}

export function mergeLineage(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

export function formatLineage(lineage: string[]): string {
  const titles = lineage.map((id) => getFeature(id)?.shortTitle || id).filter(Boolean);
  if (titles.length === 0) return "No lineage";
  return titles.join(" × ");
}

function domainForFeature(feature: PlatformFeature): EngineeringDomain {
  if (feature.mainBus === "crest") {
    return inferDomain(
      `${feature.title} ${feature.description} ${feature.tags.join(" ")}`,
      "mechanical",
    );
  }
  if (feature.bus === "protect") return "information";
  if (feature.bus === "play") return "acoustic";
  if (feature.bus === "hybrid") return "information";
  return inferDomain(
    `${feature.title} ${feature.description} ${feature.tags.join(" ")}`,
    "digital",
  );
}

export function featureToSchematic(feature: PlatformFeature): SchematicInput {
  const blob = `${feature.title} ${feature.description} ${feature.tags.join(" ")}`;
  return {
    name: `${feature.channelLabel} ${feature.title}`,
    domain: domainForFeature(feature),
    topology: inferTopology(blob),
    coreComponents: [
      feature.shortTitle,
      feature.channelLabel,
      feature.bus,
      ...feature.tags.slice(0, 4),
    ].slice(0, 20),
    physicalProperties: {},
    constraints: [
      `href:${feature.href}`,
      `mainBus:${feature.mainBus}`,
      `connectsTo:${feature.connectsTo.join(",")}`,
    ],
  };
}

export function hybridParentToSchematic(parent: HybridParentRef): SchematicInput {
  const blob = `${parent.label} ${parent.description}`;
  return {
    name: parent.label,
    domain: inferDomain(blob, parent.order >= 1 ? "information" : "digital"),
    topology:
      inferTopology(blob) === "tree" && parent.order === 2 ? "hierarchical" : inferTopology(blob),
    coreComponents:
      parent.components && parent.components.length > 0
        ? parent.components.slice(0, 20)
        : [parent.label, `H${parent.order}`, ...parent.lineage.slice(0, 6)],
    physicalProperties: {},
    constraints: [`hybridOrder:${parent.order}`, `lineage:${parent.lineage.join(",")}`],
  };
}

export function resolveParent(parent: HybridParentRef): {
  schematic: SchematicInput;
  ref: HybridParentRef;
} {
  if (parent.kind === "feature") {
    const feature = getFeature(parent.id);
    if (!feature) {
      throw new Error(`Unknown channel: ${parent.id}`);
    }
    const ref: HybridParentRef = {
      kind: "feature",
      id: feature.id,
      label: `${feature.channelLabel} ${feature.shortTitle}`,
      description: feature.description,
      order: 0,
      lineage: [feature.id],
      components: featureToSchematic(feature).coreComponents,
    };
    return { schematic: featureToSchematic(feature), ref };
  }
  if (parent.order < 1) {
    throw new Error("A hybrid parent must already be a first- or second-order blend.");
  }
  return { schematic: hybridParentToSchematic(parent), ref: parent };
}

export function assertBlendable(a: HybridParentRef, b: HybridParentRef): void {
  if (a.kind === "feature" && b.kind === "feature" && a.id === b.id) {
    throw new Error("Pick two different channels — a feature hybridizes with another feature.");
  }
  if (a.kind === "hybrid" && b.kind === "hybrid" && a.id === b.id) {
    throw new Error("Pick two different listed blends for hybridization².");
  }
}

export function buildFeatureLabFallback(input: {
  schematicA: SchematicInput;
  schematicB: SchematicInput;
  order: 1 | 2;
  mode: HybridizationMode;
  targetApplication: string;
  lineage: string[];
}): HybridizationResult {
  const bridge = pickDomainBridge(input.schematicA.domain, input.schematicB.domain);
  const power = input.order === 2 ? "²" : "¹";
  const name = `${input.schematicA.name.split(" ").slice(-1)[0]} × ${input.schematicB.name.split(" ").slice(-1)[0]} H${power}`;
  const lineageLabel = formatLineage(input.lineage);

  return {
    topologicalBridge: `${bridge.id} mesh: ${input.schematicA.topology} topology couples to ${input.schematicB.topology} so the joint graph is neither parent.`,
    domainBridgingPrinciple: bridge.principle,
    materialCompatibilityNote:
      input.order === 2
        ? "Second-order interface: each parent is already a hybrid contract; compatibility is lineage-overlap plus bus send, not raw materials."
        : "First-order interface: channel contracts (Signal/Crest/Protect/Aux) meet at the FX insert.",
    hybrids: [
      {
        name,
        title: name,
        scientificBasis: `${bridge.principle} Mode=${input.mode}. Lineage ${lineageLabel}.`,
        topologyDescription:
          input.order === 2
            ? "Hierarchical claim tree — H¹ parents become branches; the H² node is a feature-of-features."
            : "Pairwise FX insert — two channel strips sum through a new hybrid bus send.",
        coreComponents: [
          ...input.schematicA.coreComponents.slice(0, 4),
          ...input.schematicB.coreComponents.slice(0, 4),
          lineageLabel,
        ],
        emergentProperties: [
          input.order === 2
            ? "A product that only exists because two blends already existed"
            : "A product neither parent channel ships alone",
          `Target: ${input.targetApplication}`,
          `Bridge invariants: ${bridge.invariants.join(", ")}`,
        ],
        emergentBehavior:
          input.order === 2
            ? "Hybridization to the 2nd power: features of features that blend features."
            : "Cross-channel hybridization: two ZZAI modules become one shippable surface.",
        performanceGains: {
          coverage: `lineage ${input.lineage.length} channels`,
          order: `H${power}`,
          mode: input.mode,
        },
        biomimeticAnalogue:
          input.order === 2
            ? "Symbiosis of symbionts — lichen-on-lichen community structure."
            : "Lichen: fungus × alga, a new organism from two kingdoms.",
        challenges: [
          "Keep the hybrid shippable as one Master-bus output",
          "Do not collapse back into either parent channel",
        ],
        noveltyScore: input.order === 2 ? 78 : 64,
        estimatedRnDMonths: input.order === 2 ? 3 : 2,
        trlLevel: input.order === 2 ? 3 : 4,
      },
    ],
    optimalHybridIndex: 0,
    requiredCharacterizationTests: [
      "Name one behavior impossible in parent A alone",
      "Name one behavior impossible in parent B alone",
      input.order === 2
        ? "Show the H¹ parents remain visible in the lineage"
        : "Patch both parent hrefs from the hybrid",
    ],
    referenceDesigns: [bridge.id, "OaaS patch bay", "ZZAI Hybrid² lab"],
    nextSteps: [
      "List this blend on the Hybrid² marketplace floor",
      input.order === 1
        ? "Pick a second H¹ listing and run hybridization²"
        : "Ship the H² surface to Master (deploy / launch / court pack)",
    ],
    scientificProtocolVersion: SCIENTIFIC_PROTOCOL_VERSION,
    surface: "hybrid-lab",
  };
}

export function defaultTargetApplication(order: 1 | 2, labelA: string, labelB: string): string {
  return order === 2
    ? `Hybridization² marketplace product from (${labelA}) × (${labelB})`
    : `Cross-channel product from ${labelA} × ${labelB}`;
}
