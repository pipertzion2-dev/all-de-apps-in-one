import { describe, expect, it } from "vitest";
import {
  isIfmRoadmapCandidate,
  ifmPairingToRoadmapItem,
  DEFAULT_ROADMAP_PROMOTE_THRESHOLD,
} from "./promote-ifm-winner";
import type { IfmPairing } from "../ifm/ifm-types";

function mockPairing(overrides: Partial<IfmPairing> = {}): IfmPairing {
  return {
    id: "p1",
    toolA: {
      name: "A",
      path: "/tools/a",
      url: "https://example.com/a",
      hub: "ai-tools-hub",
      description: "",
    },
    toolB: {
      name: "B",
      path: "/tools/b",
      url: "https://example.com/b",
      hub: "cyber-security-mini-apps",
      description: "",
    },
    fusionTitle: "A × B",
    slug: "ifm-a-b",
    bridgePrinciple: "",
    microToolIdea: "",
    ctaPrimary: { label: "Go", href: "/" },
    ctaSecondary: { label: "Open", href: "/" },
    faq: [],
    status: "winner",
    createdAt: new Date().toISOString(),
    score: {
      total: 70,
      indexBoost: 40,
      eventBoost: 15,
      analyticsBoost: 15,
      sessions7d: 20,
      conversions7d: 1,
      scoredAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

describe("isIfmRoadmapCandidate", () => {
  it("accepts winners above threshold", () => {
    expect(isIfmRoadmapCandidate(mockPairing(), DEFAULT_ROADMAP_PROMOTE_THRESHOLD)).toBe(true);
  });

  it("rejects archived pairings", () => {
    expect(
      isIfmRoadmapCandidate(
        mockPairing({ status: "archived" }),
        DEFAULT_ROADMAP_PROMOTE_THRESHOLD,
      ),
    ).toBe(false);
  });

  it("can require conversions", () => {
    expect(
      isIfmRoadmapCandidate(
        mockPairing({ score: { total: 60, indexBoost: 40, eventBoost: 20, analyticsBoost: 0, scoredAt: "" } }),
        DEFAULT_ROADMAP_PROMOTE_THRESHOLD,
        true,
      ),
    ).toBe(false);
  });
});

describe("ifmPairingToRoadmapItem", () => {
  it("maps pairing fields to roadmap item", () => {
    const item = ifmPairingToRoadmapItem(mockPairing());
    expect(item.pairingId).toBe("p1");
    expect(item.score).toBe(70);
    expect(item.status).toBe("proposed");
    expect(item.sessions7d).toBe(20);
  });
});
