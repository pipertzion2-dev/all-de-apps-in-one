import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getSession } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";
import {
  runScientificHybridization,
  schematicFromLoose,
  type HybridDomain,
  type HybridTopology,
  type HybridizationMode,
  type ScientificDepth,
  type SchematicInput,
} from "@/lib/hybridization/scientific-engine";

export const maxDuration = 120;

const physicalPropertiesSchema = z.object({
  material: z.string().optional(),
  operatingTemp: z.string().optional(),
  powerDensity: z.string().optional(),
  dimensions: z.string().optional(),
  frequencyRange: z.string().optional(),
});

const schematicSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.enum([
    "thermal",
    "electrical",
    "mechanical",
    "rf",
    "optical",
    "fluidic",
    "acoustic",
    "chemical",
  ]),
  topology: z.enum(["star", "mesh", "tree", "ring", "hierarchical"]),
  coreComponents: z.array(z.string()).min(1).max(20),
  physicalProperties: physicalPropertiesSchema.optional().default({}),
  constraints: z.array(z.string()).optional().default([]),
  imageBase64: z.string().optional(),
});

const looseSystemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().default(""),
  components: z.array(z.string()).optional(),
  properties: z.array(z.string()).optional(),
  domain: z.string().optional(),
  topology: z.string().optional(),
});

const reqSchema = z
  .object({
    schematicA: schematicSchema.optional(),
    schematicB: schematicSchema.optional(),
    systemA: looseSystemSchema.optional(),
    systemB: looseSystemSchema.optional(),
    hybridizationMode: z
      .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
      .optional()
      .default("complementary"),
    targetApplication: z.string().min(1).max(500).optional().default("general multiphysics product"),
    scientificDepth: z
      .enum(["prototype", "research", "production"])
      .optional()
      .default("prototype"),
    /** When true, skip LLM and return calculator-only (instant). */
    calculatorOnly: z.boolean().optional().default(false),
  })
  .superRefine((val, ctx) => {
    if (!val.schematicA && !val.systemA) {
      ctx.addIssue({ code: "custom", message: "schematicA or systemA required", path: ["schematicA"] });
    }
    if (!val.schematicB && !val.systemB) {
      ctx.addIssue({ code: "custom", message: "schematicB or systemB required", path: ["schematicB"] });
    }
  });

const SYSTEM_PROMPT = `You are an elite Cross-Domain Schematic Hybridization Engine with deep expertise in materials science, topology, graph theory, and multi-physics simulation. You specialize in finding non-obvious structural and functional parallels between hardware systems from completely different engineering domains — and synthesizing them into genuinely novel hybrid architectures.

CRITICAL: Return only valid JSON. No markdown. No prose outside the JSON structure.`;

function buildUserPrompt(
  schematicA: SchematicInput,
  schematicB: SchematicInput,
  mode: string,
  targetApplication: string,
  depth: string,
  calculatorSummary: string,
): string {
  return `SCHEMATIC A — "${schematicA.name}"
Domain: ${schematicA.domain}
Topology: ${schematicA.topology}
Core Components: ${schematicA.coreComponents.join(", ")}
Physical Properties: ${JSON.stringify(schematicA.physicalProperties ?? {})}
Constraints: ${(schematicA.constraints ?? []).join(", ") || "none"}

SCHEMATIC B — "${schematicB.name}"
Domain: ${schematicB.domain}
Topology: ${schematicB.topology}
Core Components: ${schematicB.coreComponents.join(", ")}
Physical Properties: ${JSON.stringify(schematicB.physicalProperties ?? {})}
Constraints: ${(schematicB.constraints ?? []).join(", ") || "none"}

HYBRIDIZATION MODE: ${mode}
TARGET APPLICATION: ${targetApplication}
SCIENTIFIC DEPTH: ${depth}

DETERMINISTIC CALCULATOR PRE-SCORE (trust these numbers; elaborate scientifically):
${calculatorSummary}

Generate 3-4 hybrid designs. Return this exact JSON structure:
{
  "topologicalBridge": "...",
  "domainBridgingPrinciple": "...",
  "materialCompatibilityNote": "...",
  "hybrids": [
    {
      "name": "...",
      "scientificBasis": "...",
      "topologyDescription": "...",
      "coreComponents": ["..."],
      "emergentProperties": ["..."],
      "performanceGains": { "metric": "value" },
      "biomimeticAnalogue": "...",
      "manufacturingPathway": "...",
      "challenges": ["..."],
      "noveltyScore": 85,
      "patentLandscape": "...",
      "estimatedRnDMonths": 18,
      "trlLevel": 3
    }
  ],
  "optimalHybridIndex": 0,
  "requiredCharacterizationTests": ["..."],
  "referenceDesigns": ["..."],
  "nextSteps": ["..."]
}`;
}

function toSchematic(
  full?: z.infer<typeof schematicSchema>,
  loose?: z.infer<typeof looseSystemSchema>,
): SchematicInput {
  if (full) {
    return {
      name: full.name,
      domain: full.domain as HybridDomain,
      topology: full.topology as HybridTopology,
      coreComponents: full.coreComponents,
      physicalProperties: full.physicalProperties,
      constraints: full.constraints,
    };
  }
  return schematicFromLoose(loose!);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const admin = await isOrbitAdminAllowed(req);
    const session = await getSession();
    // Instant scientific calculator is public; AI synthesis needs sign-in or Orbit admin.
    if (!data.calculatorOnly && !admin && !session) {
      return NextResponse.json(
        { error: "Sign in required for AI synthesis (instant calculator is free)." },
        { status: 401 },
      );
    }
    const schematicA = toSchematic(data.schematicA, data.systemA);
    const schematicB = toSchematic(data.schematicB, data.systemB);
    const hybridizationMode = data.hybridizationMode as HybridizationMode;
    const scientificDepth = data.scientificDepth as ScientificDepth;
    const targetApplication = data.targetApplication;

    const scientific = runScientificHybridization({
      schematicA,
      schematicB,
      hybridizationMode,
      targetApplication,
      scientificDepth,
    });

    const calculatorPayload = {
      topologicalBridge: scientific.topologicalBridge,
      domainBridgingPrinciple: scientific.equations.bridgingPrinciple,
      materialCompatibilityNote: scientific.materialCompatibilityNote,
      hybrids: scientific.automaticHybrids,
      optimalHybridIndex: 0,
      requiredCharacterizationTests: scientific.requiredCharacterizationTests,
      referenceDesigns: [],
      nextSteps: scientific.nextSteps,
      scientific,
      source: "calculator" as const,
    };

    if (data.calculatorOnly) {
      return NextResponse.json(calculatorPayload);
    }

    try {
      const calculatorSummary = JSON.stringify(scientific.scores);
      const userText = buildUserPrompt(
        schematicA,
        schematicB,
        hybridizationMode,
        targetApplication,
        scientificDepth,
        calculatorSummary,
      );

      const resp = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.85,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
      });

      const raw = resp.choices[0]?.message?.content ?? "{}";
      const ai = JSON.parse(raw) as Record<string, unknown>;
      return NextResponse.json({
        ...calculatorPayload,
        ...ai,
        // Always keep deterministic scores + interpretation
        scientific,
        source: "ai+calculator",
        hybrids:
          Array.isArray(ai.hybrids) && (ai.hybrids as unknown[]).length > 0
            ? ai.hybrids
            : scientific.automaticHybrids,
      });
    } catch (aiErr) {
      console.warn(
        "[hybridize] AI unavailable, returning calculator:",
        aiErr instanceof Error ? aiErr.message : aiErr,
      );
      return NextResponse.json({
        ...calculatorPayload,
        aiFallback: true,
        aiError: aiErr instanceof Error ? aiErr.message : "AI unavailable",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Hybridization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
