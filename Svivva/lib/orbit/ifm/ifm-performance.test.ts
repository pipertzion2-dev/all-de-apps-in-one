import { describe, expect, it } from "vitest";
import {
  scoreIfmPairing,
  derivePairingStatusAfterScore,
  isIfmPruneCandidate,
  buildIfmLeaderboard,
  indexRecordMatchesPairing,
  DEFAULT_IFM_WINNER_THRESHOLD,
  DEFAULT_IFM_PRUNE_THRESHOLD,
} from "./ifm-performance";
import type { IfmPairing } from "./ifm-types";

function mockPairing(overrides: Partial<IfmPairing> = {}): IfmPairing {
  return {
    id: "pair-1",
    toolA: {
      name: "JSON Validator",
      path: "/tools/json-validator",
      url: "https://example.com/tools/json-validator",
      hub: "ai-tools-hub",
      description: "Validate JSON",
    },
    toolB: {
      name: "Password Checker",
      path: "/tools/password-checker",
      url: "https://example.com/tools/password-checker",
      hub: "cyber-security-mini-apps",
      description: "Check passwords",
    },
    fusionTitle: "JSON × Password Bridge",
    slug: "ifm-tools-json-validator-tools-password-checker",
    bridgePrinciple: "Fuse adjacent intents",
    microToolIdea: "Chain outputs",
    ctaPrimary: { label: "Build", href: "/dashboard" },
    ctaSecondary: { label: "Open", href: "/tools/json-validator" },
    faq: [],
    status: "generated",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe("scoreIfmPairing", () => {
  it("scores indexed + shipped pairings highly", () => {
    const pairing = mockPairing();
    const score = scoreIfmPairing({
      pairing,
      indexRecord: {
        id: "idx-1",
        orbitProjectId: "p1",
        url: "https://example.com/ifm-tools-json-validator-tools-password-checker",
        provider: "indexnow",
        status: "indexed",
        contentAssetId: null,
        canonicalUrl: null,
        submittedAt: null,
        lastCheckedAt: null,
        nextCheckAt: null,
        failureReason: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      events: [
        {
          id: "ev-1",
          orbitProjectId: "p1",
          orbitCampaignId: null,
          contentAssetId: null,
          distributionJobId: null,
          indexRecordId: null,
          routeId: null,
          entityId: null,
          eventType: "ifm_bridge_shipped",
          source: "internal",
          occurredAt: new Date(),
          idempotencyKey: "k1",
          dimensions: {},
          metrics: {},
          metadata: { pairingId: "pair-1" },
        },
      ],
      analyticsBoost: 10,
    });

    expect(score.total).toBeGreaterThanOrEqual(DEFAULT_IFM_WINNER_THRESHOLD);
    expect(score.indexBoost).toBe(40);
    expect(score.eventBoost).toBe(15);
    expect(score.analyticsBoost).toBe(10);
  });

  it("matches index records by slug fragment", () => {
    const pairing = mockPairing();
    expect(
      indexRecordMatchesPairing(
        {
          id: "idx",
          orbitProjectId: "p1",
          url: "https://zzaizzai.com/ifm-tools-json-validator-tools-password-checker",
          provider: "indexnow",
          status: "submitted",
          contentAssetId: null,
          canonicalUrl: null,
          submittedAt: null,
          lastCheckedAt: null,
          nextCheckAt: null,
          failureReason: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        pairing,
      ),
    ).toBe(true);
  });
});

describe("derivePairingStatusAfterScore", () => {
  it("promotes winners at threshold", () => {
    const pairing = mockPairing();
    const score = { total: 60, indexBoost: 40, eventBoost: 15, analyticsBoost: 5, scoredAt: new Date().toISOString() };
    expect(derivePairingStatusAfterScore(pairing, score, DEFAULT_IFM_WINNER_THRESHOLD)).toBe("winner");
  });

  it("keeps archived pairings archived", () => {
    const pairing = mockPairing({ status: "archived" });
    const score = { total: 90, indexBoost: 40, eventBoost: 15, analyticsBoost: 35, scoredAt: new Date().toISOString() };
    expect(derivePairingStatusAfterScore(pairing, score, DEFAULT_IFM_WINNER_THRESHOLD)).toBe("archived");
  });
});

describe("isIfmPruneCandidate", () => {
  it("flags stale low-score generated pairings", () => {
    const pairing = mockPairing({ status: "generated" });
    const score = { total: 10, indexBoost: 5, eventBoost: 5, analyticsBoost: 0, scoredAt: new Date().toISOString() };
    expect(isIfmPruneCandidate(pairing, score, DEFAULT_IFM_PRUNE_THRESHOLD)).toBe(true);
  });

  it("skips winners and recent pairings", () => {
    const winner = mockPairing({ status: "winner" });
    const score = { total: 5, indexBoost: 0, eventBoost: 5, analyticsBoost: 0, scoredAt: new Date().toISOString() };
    expect(isIfmPruneCandidate(winner, score, DEFAULT_IFM_PRUNE_THRESHOLD)).toBe(false);

    const recent = mockPairing({
      status: "generated",
      createdAt: new Date().toISOString(),
    });
    expect(isIfmPruneCandidate(recent, score, DEFAULT_IFM_PRUNE_THRESHOLD)).toBe(false);
  });
});

describe("buildIfmLeaderboard", () => {
  it("sorts by score descending and excludes archived", () => {
    const leaderboard = buildIfmLeaderboard([
      mockPairing({ id: "a", score: { total: 30, indexBoost: 30, eventBoost: 0, analyticsBoost: 0, scoredAt: "" } }),
      mockPairing({ id: "b", score: { total: 70, indexBoost: 40, eventBoost: 30, analyticsBoost: 0, scoredAt: "" } }),
      mockPairing({ id: "c", status: "archived", score: { total: 99, indexBoost: 99, eventBoost: 0, analyticsBoost: 0, scoredAt: "" } }),
    ]);
    expect(leaderboard.map((p) => p.id)).toEqual(["b", "a"]);
  });
});
