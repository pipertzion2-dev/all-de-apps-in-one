import { describe, expect, it } from "vitest";
import {
  buildFusionProductSpec,
  embedFusionSpecInContent,
  fusionProductPath,
  parseFusionSpecFromContent,
} from "./fusion-product-spec";
import type { OrbitRoadmapItem } from "./roadmap-types";
import { isRoadmapApprovalCandidate, isRoadmapShipCandidate } from "./roadmap-performance";

const item: OrbitRoadmapItem = {
  id: "r1",
  pairingId: "p1",
  fusionTitle: "Prompt × JSON Validator",
  slug: "ifm-prompt-json",
  toolAPath: "/tools/prompt-forge",
  toolBPath: "/tools/json-schema-validator",
  toolAName: "Prompt Forge",
  toolBName: "JSON Schema Validator",
  score: 72,
  sessions7d: 15,
  conversions7d: 1,
  status: "proposed",
  promotedAt: new Date().toISOString(),
  microToolShipped: true,
};

describe("fusion-product-spec", () => {
  it("builds a product spec with fusion slug path", () => {
    const spec = buildFusionProductSpec(item);
    expect(spec.slug).toBe("prompt-json");
    expect(fusionProductPath(item.slug)).toBe("/tools/ifm-fusion/prompt-json");
    expect(spec.workflowSteps.length).toBeGreaterThan(0);
  });

  it("round-trips spec through content marker", () => {
    const spec = buildFusionProductSpec(item);
    const content = embedFusionSpecInContent("<p>Hello</p>", spec);
    expect(parseFusionSpecFromContent(content)?.fusionTitle).toBe(item.fusionTitle);
  });
});

describe("roadmap-performance gates", () => {
  it("requires micro-tool before approval", () => {
    expect(isRoadmapApprovalCandidate({ ...item, microToolShipped: false }, 55)).toBe(false);
    expect(isRoadmapApprovalCandidate(item, 55)).toBe(true);
  });

  it("requires traction before ship", () => {
    const approved = {
      ...item,
      status: "approved" as const,
      productSpec: buildFusionProductSpec(item),
    };
    expect(isRoadmapShipCandidate({ ...approved, sessions7d: 2, conversions7d: 0 }, 55)).toBe(false);
    expect(isRoadmapShipCandidate(approved, 55)).toBe(true);
  });
});
