import {
  adaptSourcesToSchematics,
  runHybridization,
  type HybridizationResult,
} from "@/lib/hybridization";
import {
  buildScientificAxes,
  createCyberSeal,
  finalizeCertificate,
  mintProtectionCoin,
} from "./attestation";
import { scientificHybridFallback } from "./scientific-hybrid";
import type { PoorManCertificate, ProtectRequest } from "./types";

export async function runPoorManProtection(input: ProtectRequest): Promise<{
  certificate: PoorManCertificate;
  hybridization: HybridizationResult;
}> {
  const axes = buildScientificAxes(input);

  let hybridization: HybridizationResult;
  let usedEngine = false;

  try {
    const adapted = adaptSourcesToSchematics([
      {
        name: "Form / composition axis",
        type: "optical-form",
        description: `${input.formVariable}\n\nWork: ${input.title}\n${input.description}`,
      },
      {
        name: "Color / spectral axis",
        type: "optical-palette",
        description: `${input.paletteVariable}\n\nPalette: ${(input.palette || [])
          .map((p) => `${p.role}:${p.hex}`)
          .join(", ")}`,
      },
    ]);

    if (!adapted) throw new Error("Need two scientific axes");

    hybridization = await runHybridization({
      ...adapted,
      schematicA: {
        ...adapted.schematicA,
        imageBase64: input.imageBase64,
        domain: "optical",
        coreComponents: [
          input.formVariable.slice(0, 80),
          "composition-geometry",
          "sketch-structure",
        ],
      },
      schematicB: {
        ...adapted.schematicB,
        domain: "optical",
        coreComponents: [
          input.paletteVariable.slice(0, 80),
          ...(input.palette || []).slice(0, 5).map((p) => p.hex),
        ],
      },
      hybridizationMode: input.hybridizationMode,
      targetApplication: `Poor man protection / dual-axis prior-art fingerprint for: ${input.title}`,
      scientificDepth: "research",
      surface: "poor-man-protection",
    });
    usedEngine = true;
  } catch {
    hybridization = scientificHybridFallback(input, axes);
  }

  const optimal =
    hybridization.hybrids[hybridization.optimalHybridIndex] || hybridization.hybrids[0];
  const noveltyScore = Number(optimal?.noveltyScore ?? 60);

  const certificate = finalizeCertificate({
    createdAt: new Date().toISOString(),
    title: input.title,
    description: input.description,
    contentHash: input.contentHash.toLowerCase(),
    mimeType: input.mimeType || "image/png",
    fileName: input.fileName,
    scientificAxes: axes,
    hybridization: {
      usedEngine,
      topologicalBridge: hybridization.topologicalBridge,
      domainBridgingPrinciple: hybridization.domainBridgingPrinciple,
      patentLandscape: optimal?.patentLandscape,
      noveltyScore,
      emergentClaims: optimal?.emergentProperties || [],
      optimalHybridName: optimal?.name,
    },
    coin: input.mintCoin ? mintProtectionCoin(input, axes, noveltyScore) : undefined,
    cyberSeal: input.enableCyberSeal ? createCyberSeal(input.contentHash.toLowerCase()) : undefined,
  });

  return { certificate, hybridization };
}

export * from "./types";
export * from "./attestation";
export { scientificHybridFallback } from "./scientific-hybrid";
