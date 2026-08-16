import type { HybridizationResult } from "../hybridization/types";
import { SCIENTIFIC_PROTOCOL_VERSION } from "../hybridization/principles";
import type { ProtectRequest, ScientificAxes } from "./types";

/**
 * Deterministic scientific hybridization when the LLM engine is unavailable.
 * Couples form (axis A) with spectral palette (axis B) into patent-style claims.
 */
export function scientificHybridFallback(
  input: ProtectRequest,
  axes: ScientificAxes,
): HybridizationResult {
  const paletteHex = axes.axisB.palette?.map((p) => p.hex).join(", ") || "unspecified";
  const noveltyBase = 55;
  const paletteBoost = Math.min(20, (axes.axisB.palette?.length || 0) * 3);
  const noveltyScore = Math.min(
    92,
    noveltyBase + paletteBoost + (input.description.length > 120 ? 5 : 0),
  );

  const hybridName = `${input.title.trim()} — Dual-Axis Prior Art Hybrid`;

  return {
    topologicalBridge:
      "Optical/information mesh: composition topology (axis A) informs spectral sampling nodes (axis B), producing a joint prior-art signature.",
    domainBridgingPrinciple:
      "Gestalt form constraints couple with CIELAB spectral statistics so neither axis alone reconstitutes the claimed creative fingerprint.",
    materialCompatibilityNote:
      "Digital artwork / sketch media; claims are informational and compositional, not manufacturing recipes.",
    hybrids: [
      {
        name: hybridName,
        title: hybridName,
        scientificBasis:
          "Two-factor factorial disclosure: form_composition × color_spectral, with measurable ΔE* and compositional descriptors as characterization metrics.",
        topologyDescription:
          "Hierarchical claim tree — root creative work → form branch → palette branch → emergent coupling node.",
        coreComponents: [
          axes.axisA.summary.slice(0, 120),
          axes.axisB.summary.slice(0, 120),
          `Palette: ${paletteHex}`,
        ],
        emergentProperties: [
          "Unique form–palette coupling fingerprint",
          "Timestampable evidentiary disclosure package",
          "Mint-ready digital asset metadata (ZZAI-PMP-721)",
        ],
        emergentBehavior: "Form and palette together define a non-separable creative prior.",
        performanceGains: {
          priorArtSpecificity: "+high (dual-axis)",
          reproducibility: "palette + form descriptors",
          cyberIntegrity: "SHA-256 sealed",
        },
        biomimeticAnalogue:
          "Camouflage patterning: morphology and coloration co-evolve as one protective signal.",
        challenges: [
          "Not a government-registered patent",
          "Public disclosure may affect novelty for later filings — seek counsel",
        ],
        noveltyScore,
        patentLandscape:
          "Adjacent art likely covers generic generative art tools and NFT minting UX; novelty here is the dual-axis scientific hybridization + cyber-sealed poor-man evidentiary coin for sketches.",
        estimatedRnDMonths: 1,
        trlLevel: 4,
      },
    ],
    optimalHybridIndex: 0,
    requiredCharacterizationTests: axes.measurableClaims,
    referenceDesigns: [
      "Poor man's copyright (self-addressed timestamped disclosure)",
      "Content-addressed provenance (hash-linked)",
      "Tokenized IP metadata (ERC-721-style attributes)",
    ],
    nextSteps: [
      "Download and archive the ZZAI certificate JSON offline",
      "Enable cyber watch hints in Security Center",
      "Consult IP counsel before public commercial launch",
      "Optionally export coin metadata for future on-chain mint",
    ],
    scientificProtocolVersion: SCIENTIFIC_PROTOCOL_VERSION,
    surface: "poor-man-protection",
  };
}
