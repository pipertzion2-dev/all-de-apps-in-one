import { describe, expect, it } from "vitest";
import {
  buildScientificAxes,
  finalizeCertificate,
  hexToLab,
  mintProtectionCoin,
  verifyCertificateHash,
} from "./attestation";
import { scientificHybridFallback } from "./scientific-hybrid";
import type { ProtectRequest } from "./types";

const sample: ProtectRequest = {
  title: "Crest Bloom Sketch",
  description: "A dual-tone crest study for ZZAI Signal branding.",
  formVariable: "Centered crest silhouette with radial petal hierarchy",
  paletteVariable: "Steel teal dominant with burgundy accent",
  contentHash: "a".repeat(64),
  mimeType: "image/png",
  fileName: "crest.png",
  palette: [
    { hex: "#5B8DA8", role: "dominant", weight: 0.45 },
    { hex: "#6B2C4E", role: "accent", weight: 0.25 },
    { hex: "#1A1A1A", role: "shadow", weight: 0.2 },
  ],
  hybridizationMode: "emergent",
  enableCyberSeal: true,
  mintCoin: true,
};

describe("poor-man-protection", () => {
  it("converts hex to CIELAB", () => {
    const lab = hexToLab("#5B8DA8");
    expect(lab.L).toBeGreaterThan(40);
    expect(lab.L).toBeLessThan(70);
  });

  it("builds dual scientific axes and a mint-ready coin", () => {
    const axes = buildScientificAxes(sample);
    expect(axes.axisA.name).toBe("form_composition");
    expect(axes.axisB.palette?.[0]?.hex).toBe("#5B8DA8");
    expect(axes.measurableClaims.length).toBeGreaterThan(2);

    const coin = mintProtectionCoin(sample, axes, 70);
    expect(coin.contractAddress).toMatch(/^0x[a-f0-9]{40}$/);
    expect(coin.standard).toBe("ZZAI-PMP-721");
    expect(coin.supply).toBe(1);
  });

  it("seals a verifiable certificate", () => {
    const axes = buildScientificAxes(sample);
    const hybrid = scientificHybridFallback(sample, axes);
    const cert = finalizeCertificate({
      createdAt: "2026-08-16T00:00:00.000Z",
      title: sample.title,
      description: sample.description,
      contentHash: sample.contentHash,
      mimeType: "image/png",
      scientificAxes: axes,
      hybridization: {
        usedEngine: false,
        topologicalBridge: hybrid.topologicalBridge,
        domainBridgingPrinciple: hybrid.domainBridgingPrinciple,
        noveltyScore: hybrid.hybrids[0].noveltyScore,
        emergentClaims: hybrid.hybrids[0].emergentProperties,
      },
    });
    expect(cert.certificateHash).toHaveLength(64);
    expect(verifyCertificateHash(cert)).toBe(true);
    expect(verifyCertificateHash({ ...cert, title: "tampered" })).toBe(false);
  });
});
