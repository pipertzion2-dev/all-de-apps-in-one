import { describe, expect, it } from "vitest";
import {
  matchGa4PageToPairing,
  pairAnalyticsBoost,
  buildPairAnalyticsMap,
} from "./ifm-analytics";
import type { IfmPairing } from "./ifm-types";

function mockPairing(slug: string, id = "p1"): IfmPairing {
  return {
    id,
    toolA: {
      name: "A",
      path: "/tools/a",
      url: "https://example.com/tools/a",
      hub: "ai-tools-hub",
      description: "",
    },
    toolB: {
      name: "B",
      path: "/tools/b",
      url: "https://example.com/tools/b",
      hub: "cyber-security-mini-apps",
      description: "",
    },
    fusionTitle: "A × B Bridge",
    slug,
    bridgePrinciple: "",
    microToolIdea: "",
    ctaPrimary: { label: "Go", href: "/" },
    ctaSecondary: { label: "Open", href: "/" },
    faq: [],
    status: "generated",
    createdAt: new Date().toISOString(),
  };
}

describe("ifm-analytics", () => {
  it("matches GA4 page paths to pairings", () => {
    const pairing = mockPairing("ifm-tools-a-tools-b");
    const matched = matchGa4PageToPairing(
      [{ pagePath: "/ifm-tools-a-tools-b", sessions7d: 30, conversions7d: 2 }],
      pairing,
    );
    expect(matched?.sessions7d).toBe(30);
    expect(matched?.conversions7d).toBe(2);
  });

  it("computes analytics boost from per-pair metrics", () => {
    expect(pairAnalyticsBoost({ sessions7d: 3, conversions7d: 0 })).toBe(0);
    expect(pairAnalyticsBoost({ sessions7d: 10, conversions7d: 0 })).toBe(5);
    expect(pairAnalyticsBoost({ sessions7d: 30, conversions7d: 1 })).toBe(20);
  });

  it("builds analytics map for multiple pairings", () => {
    const p1 = mockPairing("ifm-tools-a-tools-b", "pair-a");
    const p2 = mockPairing("ifm-tools-x-tools-y", "pair-b");
    const map = buildPairAnalyticsMap(
      [p1, p2],
      [
        { pagePath: "/ifm-tools-a-tools-b", sessions7d: 12, conversions7d: 0 },
        { pagePath: "/ifm-tools-x-tools-y", sessions7d: 40, conversions7d: 3 },
      ],
    );
    expect(map.get(p1.id)?.sessions7d).toBe(12);
    expect(map.get(p2.id)?.conversions7d).toBe(3);
  });
});
