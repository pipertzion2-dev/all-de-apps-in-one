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
import { FLAGSHIP_PRESETS } from "@/lib/hybridization/manufacture-plan";

export const maxDuration = 180;

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
    /** Load a built-in flagship preset (e.g. iphone-17-promax-vc). */
    presetId: z.string().optional(),
    hybridizationMode: z
      .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
      .optional()
      .default("complementary"),
    targetApplication: z.string().min(1).max(500).optional().default("general multiphysics product"),
    scientificDepth: z
      .enum(["prototype", "research", "production"])
      .optional()
      .default("prototype"),
    calculatorOnly: z.boolean().optional().default(false),
    /** Grand automation: production-depth manufacture plan + richer hybrids. */
    grand: z.boolean().optional().default(false),
  })
  .superRefine((val, ctx) => {
    if (val.presetId) return;
    if (!val.schematicA && !val.systemA) {
      ctx.addIssue({ code: "custom", message: "schematicA or systemA required", path: ["schematicA"] });
    }
    if (!val.schematicB && !val.systemB) {
      ctx.addIssue({ code: "custom", message: "schematicB or systemB required", path: ["schematicB"] });
    }
  });

const SYSTEM_PROMPT = `You are an elite Cross-Domain Schematic Hybridization & Manufacturing Automation Engine.
You design flagship-grade hardware hybrids at the sophistication of smartphone vapor-chamber cool modules (e.g. iPhone Pro Max class thin two-phase chambers), phononic heatsinks, and SMA interconnects.

You MUST:
- Ground every claim in real physics (Fourier, two-phase wick capillary limit, CTE, Maxwell, etc.)
- Deliver manufacturable detail: BOM hints, process sequence, DFM, suppliers classes, qual tests
- Prefer emergent properties that neither parent has alone
- Return ONLY valid JSON — no markdown`;

function buildUserPrompt(
  schematicA: SchematicInput,
  schematicB: SchematicInput,
  mode: string,
  targetApplication: string,
  depth: string,
  calculatorSummary: string,
  manufacturePlanSummary: string,
  grand: boolean,
): string {
  return `SCHEMATIC A — "${schematicA.name}"
Domain: ${schematicA.domain} | Topology: ${schematicA.topology}
Components: ${schematicA.coreComponents.join(", ")}
Props: ${JSON.stringify(schematicA.physicalProperties ?? {})}
Constraints: ${(schematicA.constraints ?? []).join(", ") || "none"}

SCHEMATIC B — "${schematicB.name}"
Domain: ${schematicB.domain} | Topology: ${schematicB.topology}
Components: ${schematicB.coreComponents.join(", ")}
Props: ${JSON.stringify(schematicB.physicalProperties ?? {})}
Constraints: ${(schematicB.constraints ?? []).join(", ") || "none"}

MODE: ${mode}
TARGET: ${targetApplication}
DEPTH: ${depth}
GRAND AUTOMATION: ${grand ? "YES — flagship cool-chamber / production class" : "standard"}

DETERMINISTIC SCORES:
${calculatorSummary}

AUTOMATED MANUFACTURE PLAN (elaborate; do not contradict):
${manufacturePlanSummary}

Return JSON:
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
      "manufacturingPathway": "step-by-step factory route",
      "challenges": ["..."],
      "noveltyScore": 85,
      "patentLandscape": "...",
      "estimatedRnDMonths": 12,
      "trlLevel": 6
    }
  ],
  "optimalHybridIndex": 0,
  "requiredCharacterizationTests": ["..."],
  "referenceDesigns": ["flagship phone VC / published analogues"],
  "nextSteps": ["actionable"],
  "manufactureNarrative": "How to build this at scale in plain language"
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

    let data = parsed.data;
    if (data.presetId) {
      const preset = FLAGSHIP_PRESETS.find((p) => p.id === data.presetId);
      if (!preset) {
        return NextResponse.json({ error: `Unknown presetId: ${data.presetId}` }, { status: 400 });
      }
      data = {
        ...data,
        systemA: { ...preset.systemA, description: preset.systemA.description },
        systemB: { ...preset.systemB, description: preset.systemB.description },
        targetApplication: preset.target,
        hybridizationMode: preset.mode,
        scientificDepth: preset.depth,
        grand: true,
      };
    }

    const admin = await isOrbitAdminAllowed(req);
    const session = await getSession();
    if (!data.calculatorOnly && !admin && !session) {
      return NextResponse.json(
        { error: "Sign in required for AI synthesis (instant calculator is free)." },
        { status: 401 },
      );
    }

    const schematicA = toSchematic(data.schematicA, data.systemA);
    const schematicB = toSchematic(data.schematicB, data.systemB);
    const hybridizationMode = data.hybridizationMode as HybridizationMode;
    const scientificDepth = (data.grand ? "production" : data.scientificDepth) as ScientificDepth;
    const targetApplication = data.targetApplication;
    const grand = !!data.grand || !!data.presetId;

    const scientific = runScientificHybridization({
      schematicA,
      schematicB,
      hybridizationMode,
      targetApplication,
      scientificDepth,
      grand,
    });

    const calculatorPayload = {
      topologicalBridge: scientific.topologicalBridge,
      domainBridgingPrinciple: scientific.equations.bridgingPrinciple,
      materialCompatibilityNote: scientific.materialCompatibilityNote,
      hybrids: scientific.automaticHybrids,
      optimalHybridIndex: 0,
      requiredCharacterizationTests: scientific.requiredCharacterizationTests,
      referenceDesigns: scientific.grand
        ? ["Flagship smartphone vapor chamber cool modules", "Published Cu wick / two-phase chamber literature"]
        : [],
      nextSteps: scientific.nextSteps,
      scientific,
      manufacturePlan: scientific.manufacturePlan,
      source: "calculator" as const,
      grand,
    };

    if (data.calculatorOnly) {
      return NextResponse.json(calculatorPayload);
    }

    try {
      const userText = buildUserPrompt(
        schematicA,
        schematicB,
        hybridizationMode,
        targetApplication,
        scientificDepth,
        JSON.stringify(scientific.scores),
        JSON.stringify({
          codename: scientific.manufacturePlan.productCodename,
          class: scientific.manufacturePlan.class,
          bomCount: scientific.manufacturePlan.bom.length,
          steps: scientific.manufacturePlan.processFlow.map((s) => s.name),
          cost: scientific.manufacturePlan.costModel,
        }),
        grand,
      );

      const resp = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: grand ? 0.7 : 0.85,
        max_tokens: grand ? 6000 : 4096,
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
        scientific,
        manufacturePlan: scientific.manufacturePlan,
        source: "ai+calculator",
        grand,
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
