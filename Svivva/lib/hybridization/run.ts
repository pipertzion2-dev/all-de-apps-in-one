import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { SCIENTIFIC_PROTOCOL_VERSION } from "./principles";
import { HYBRIDIZATION_SYSTEM_PROMPT, buildHybridizationUserPrompt } from "./prompts";
import type { HybridizationRequest, HybridizationResult, HybridDesign } from "./types";

function normalizeResult(
  raw: Partial<HybridizationResult> & { hybrids?: Partial<HybridDesign>[] },
  surface: string,
): HybridizationResult {
  const hybrids = (raw.hybrids || []).map((h) => ({
    name: String(h.name || h.title || "Hybrid design"),
    title: String(h.title || h.name || "Hybrid design"),
    scientificBasis: String(h.scientificBasis || ""),
    topologyDescription: String(h.topologyDescription || ""),
    coreComponents: Array.isArray(h.coreComponents) ? h.coreComponents.map(String) : [],
    emergentProperties: Array.isArray(h.emergentProperties)
      ? h.emergentProperties.map(String)
      : h.emergentBehavior
        ? [String(h.emergentBehavior)]
        : [],
    emergentBehavior:
      h.emergentBehavior ||
      (Array.isArray(h.emergentProperties) ? h.emergentProperties.join("; ") : undefined),
    performanceGains:
      h.performanceGains && typeof h.performanceGains === "object"
        ? (h.performanceGains as Record<string, string>)
        : {},
    biomimeticAnalogue: h.biomimeticAnalogue ? String(h.biomimeticAnalogue) : undefined,
    manufacturingPathway: h.manufacturingPathway ? String(h.manufacturingPathway) : undefined,
    challenges: Array.isArray(h.challenges) ? h.challenges.map(String) : [],
    noveltyScore: Number(h.noveltyScore ?? 50),
    patentLandscape: h.patentLandscape ? String(h.patentLandscape) : undefined,
    estimatedRnDMonths: h.estimatedRnDMonths ? Number(h.estimatedRnDMonths) : undefined,
    trlLevel: h.trlLevel ? Number(h.trlLevel) : undefined,
  }));

  return {
    topologicalBridge: String(raw.topologicalBridge || ""),
    domainBridgingPrinciple: String(raw.domainBridgingPrinciple || ""),
    materialCompatibilityNote: String(raw.materialCompatibilityNote || ""),
    hybrids,
    optimalHybridIndex: Number(raw.optimalHybridIndex ?? 0),
    requiredCharacterizationTests: Array.isArray(raw.requiredCharacterizationTests)
      ? raw.requiredCharacterizationTests.map(String)
      : [],
    referenceDesigns: Array.isArray(raw.referenceDesigns) ? raw.referenceDesigns.map(String) : [],
    nextSteps: Array.isArray(raw.nextSteps) ? raw.nextSteps.map(String) : [],
    scientificProtocolVersion: SCIENTIFIC_PROTOCOL_VERSION,
    surface,
  };
}

export async function runHybridization(input: HybridizationRequest): Promise<HybridizationResult> {
  const userText = buildHybridizationUserPrompt(
    input.schematicA,
    input.schematicB,
    input.hybridizationMode,
    input.targetApplication,
    input.scientificDepth,
  );

  type MessageContent =
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string; detail: "high" } }
      >;

  const userContent: MessageContent =
    input.schematicA.imageBase64 || input.schematicB.imageBase64
      ? [
          { type: "text", text: userText },
          ...(input.schematicA.imageBase64
            ? [
                {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:image/jpeg;base64,${input.schematicA.imageBase64}`,
                    detail: "high" as const,
                  },
                },
              ]
            : []),
          ...(input.schematicB.imageBase64
            ? [
                {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:image/jpeg;base64,${input.schematicB.imageBase64}`,
                    detail: "high" as const,
                  },
                },
              ]
            : []),
        ]
      : userText;

  const resp = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.85,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HYBRIDIZATION_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<HybridizationResult>;
  return normalizeResult(parsed, input.surface || "hardware");
}
