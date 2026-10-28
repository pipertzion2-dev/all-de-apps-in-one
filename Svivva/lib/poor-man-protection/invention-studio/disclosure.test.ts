import { describe, expect, it } from "vitest";
import { buildInventionDisclosure, disclosureToMarkdown } from "./disclosure";
import { computeDocumentationProgress } from "./progress";
import { sha256Text, chainEventHash } from "./hashing";
import {
  IMPLEMENTED_VERIFICATION_METHODS,
  NOT_IMPLEMENTED_VERIFICATION_METHODS,
} from "./certificate";
import type { InventionBundle } from "./types";

function sampleBundle(): InventionBundle {
  return {
    invention: {
      id: "inv_test",
      ownerKey: "local",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      status: "documenting",
      currentVersion: 1,
      documentationProgress: 40,
      privacy: "private",
      fields: {
        title: "Sample Widget",
        description: "A user-written description of the widget.",
        category: "mechanical",
        inventors: [{ name: "Ada Example", role: "sole_inventor" }],
        conceptionDate: "2025-06-01",
        problemSolved: "Loose fasteners",
        howItWorks: "A clamp engages a rail.",
        uniqueFeatures: "Self-locking tooth",
        technicalSpecs: "",
        materials: "Aluminum",
        componentsText: "Clamp, rail, tooth",
        alternativeImplementations: "",
        prototypeStatus: "sketch",
        developmentHistory: "",
        collaborators: [],
      },
    },
    versions: [],
    notebook: [],
    evidence: [
      {
        id: "ev_1",
        inventionId: "inv_test",
        originalFilename: "sketch.png",
        fileType: "image/png",
        byteLength: 12,
        uploadDate: "2026-01-01T01:00:00.000Z",
        sha256: "abc123",
        version: 1,
        verificationStatus: "hashed",
      },
    ],
    components: [
      {
        id: "c1",
        inventionId: "inv_test",
        name: "Clamp body",
        shape: "box",
        dimensions: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: "aluminum",
        calloutNumber: 1,
        visible: true,
      },
    ],
    timeline: [],
    audit: [],
    aiSuggestions: [],
  };
}

describe("invention protection studio", () => {
  it("builds a disclosure from user fields only", () => {
    const doc = buildInventionDisclosure(sampleBundle());
    expect(doc.title).toBe("Sample Widget");
    expect(doc.disclaimer.toLowerCase()).toContain("not a filed patent");
    expect(doc.evidenceIndex).toHaveLength(1);
    expect(doc.drawingIndex[0]?.number).toBe(1);
    const md = disclosureToMarkdown(doc);
    expect(md).toContain("Sample Widget");
    expect(md).toContain("FIG. 1");
  });

  it("computes documentation progress from filled fields", () => {
    const progress = computeDocumentationProgress(sampleBundle().invention.fields);
    expect(progress).toBeGreaterThan(30);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it("chains tamper-evident audit hashes", async () => {
    const a = await sha256Text("hello");
    expect(a).toHaveLength(64);
    const h1 = await chainEventHash(undefined, { event: "created" });
    const h2 = await chainEventHash(h1, { event: "updated" });
    expect(h1).not.toEqual(h2);
  });

  it("does not advertise unimplemented verification methods", () => {
    expect(IMPLEMENTED_VERIFICATION_METHODS.every((m) => m.implemented)).toBe(true);
    expect(NOT_IMPLEMENTED_VERIFICATION_METHODS.join(" ")).toMatch(/Blockchain/i);
    expect(IMPLEMENTED_VERIFICATION_METHODS.map((m) => m.id)).not.toContain("blockchain");
  });
});
