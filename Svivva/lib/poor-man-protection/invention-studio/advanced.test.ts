import { describe, expect, it } from "vitest";
import { scanDisclosureRisk } from "./disclosure-risk";
import { buildPatentSearchQueries, linkHitsFromQueries } from "./prior-art-radar";
import { runReadinessAuditLocal } from "./readiness-auditor";
import { buildMemoryGraph, structureVoiceJournal } from "./memory-graph";
import type { InventionBundle } from "./types";

function bundle(): InventionBundle {
  return {
    invention: {
      id: "inv_x",
      ownerKey: "local",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      status: "documenting",
      currentVersion: 1,
      documentationProgress: 20,
      privacy: "private",
      fields: {
        title: "Test Clamp",
        description: "Short",
        category: "mechanical",
        inventors: [{ name: "Ada", role: "sole_inventor" }],
        conceptionDate: "",
        problemSolved: "",
        howItWorks: "",
        uniqueFeatures: "",
        technicalSpecs: "",
        materials: "",
        componentsText: "",
        alternativeImplementations: "",
        prototypeStatus: "concept",
        developmentHistory: "",
        collaborators: [],
      },
    },
    versions: [
      {
        id: "v1",
        inventionId: "inv_x",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        label: "Initial",
        fields: {} as InventionBundle["invention"]["fields"],
        contentHash: "abc",
        source: "user",
      },
    ],
    notebook: [],
    evidence: [],
    components: [],
    timeline: [],
    audit: [],
    aiSuggestions: [],
  };
}

describe("advanced invention protection AI modules", () => {
  it("flags disclosure risk phrases", () => {
    const hits = scanDisclosureRisk("We plan on posting this online and selling kits next month.");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /posting|sale/i.test(h.phrase))).toBe(true);
  });

  it("builds search queries and link hits without fabricating patents", () => {
    const q = buildPatentSearchQueries(bundle().invention.fields, "rail locking");
    expect(q.length).toBeGreaterThan(0);
    const links = linkHitsFromQueries(q);
    expect(links.every((h) => !h.fromLiveApi)).toBe(true);
    expect(links.every((h) => h.sourceUrl.startsWith("http"))).toBe(true);
  });

  it("scores readiness gaps without claiming patentability", () => {
    const audit = runReadinessAuditLocal(bundle());
    expect(audit.disclaimer.toLowerCase()).toContain("not establish patentability");
    expect(audit.issues.length).toBeGreaterThan(0);
    expect(audit.completenessScore).toBeLessThan(100);
  });

  it("builds memory graph and voice drafts pending confirmation", () => {
    const g = buildMemoryGraph(bundle());
    expect(g.nodes.some((n) => n.kind === "disclosure")).toBe(true);
    const draft = structureVoiceJournal(
      "inv_x",
      "Prototype clamp tooth improved grip.",
      "typed_fallback",
    );
    expect(draft.confirmed).toBe(false);
    expect(draft.label).toBe("ai_structured_pending_confirmation");
  });
});
