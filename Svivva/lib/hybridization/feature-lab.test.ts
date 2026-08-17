import { describe, expect, it } from "vitest";
import { PLATFORM_FEATURES } from "@/lib/platform/feature-graph";
import {
  assertBlendable,
  buildFeatureLabFallback,
  defaultTargetApplication,
  featurePairCount,
  featureToSchematic,
  formatLineage,
  listFeatureHybridPairs,
  listHybridizableFeatures,
  mergeLineage,
  nextHybridOrder,
  pairId,
  resolveParent,
} from "./feature-lab";

describe("feature hybrid matrix", () => {
  it("lets every channel hybridize with every other channel", () => {
    const features = listHybridizableFeatures(true);
    const pairs = listFeatureHybridPairs(true);
    expect(features.length).toBe(PLATFORM_FEATURES.length);
    expect(pairs.length).toBe(featurePairCount(features.length));
    expect(pairs.length).toBeGreaterThan(50);

    const ids = new Set(pairs.map((p) => p.id));
    expect(ids.size).toBe(pairs.length);
    for (const pair of pairs) {
      expect(pair.a.id).not.toBe(pair.b.id);
      expect(pair.id).toBe(pairId(pair.b.id, pair.a.id));
    }
  });

  it("maps a channel into a schematic the engine can fuse", () => {
    const seeds = PLATFORM_FEATURES.find((f) => f.id === "seeds");
    expect(seeds).toBeTruthy();
    const schematic = featureToSchematic(seeds!);
    expect(schematic.name).toContain("Seeds");
    expect(schematic.coreComponents.length).toBeGreaterThan(1);
    expect(schematic.domain).toBeTruthy();
  });
});

describe("hybridization to the 2nd power", () => {
  it("treats feature × feature as H¹ and any hybrid parent as H²", () => {
    expect(nextHybridOrder(0, 0)).toBe(1);
    expect(nextHybridOrder(1, 0)).toBe(2);
    expect(nextHybridOrder(1, 1)).toBe(2);
    expect(nextHybridOrder(2, 1)).toBe(2);
  });

  it("unions lineage so H² keeps the original channels", () => {
    expect(mergeLineage(["seeds", "play"], ["poor-man-protection"])).toEqual([
      "seeds",
      "play",
      "poor-man-protection",
    ]);
    expect(formatLineage(["seeds", "play"])).toContain("Seeds");
  });

  it("rejects blending a channel with itself", () => {
    expect(() =>
      assertBlendable(
        {
          kind: "feature",
          id: "seeds",
          label: "Seeds",
          description: "",
          order: 0,
          lineage: ["seeds"],
        },
        {
          kind: "feature",
          id: "seeds",
          label: "Seeds",
          description: "",
          order: 0,
          lineage: ["seeds"],
        },
      ),
    ).toThrow(/two different channels/);
  });

  it("resolves a feature parent from the catalog", () => {
    const { schematic, ref } = resolveParent({
      kind: "feature",
      id: "play",
      label: "",
      description: "",
      order: 0,
      lineage: [],
    });
    expect(ref.order).toBe(0);
    expect(ref.lineage).toEqual(["play"]);
    expect(schematic.name).toContain("Play");
  });

  it("builds a deterministic H² fallback product", () => {
    const result = buildFeatureLabFallback({
      schematicA: featureToSchematic(PLATFORM_FEATURES.find((f) => f.id === "seeds")!),
      schematicB: {
        name: "Seeds × Protect H¹",
        domain: "information",
        topology: "hierarchical",
        coreComponents: ["Seeds", "Protect"],
        physicalProperties: {},
        constraints: [],
      },
      order: 2,
      mode: "emergent",
      targetApplication: defaultTargetApplication(2, "H¹ A", "Play"),
      lineage: ["seeds", "poor-man-protection", "play"],
    });
    expect(result.surface).toBe("hybrid-lab");
    expect(result.hybrids[0]?.emergentBehavior).toMatch(/2nd power/i);
    expect(result.hybrids[0]?.noveltyScore).toBeGreaterThan(70);
  });
});
