import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";

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

const reqSchema = z.object({
  schematicA: schematicSchema,
  schematicB: schematicSchema,
  hybridizationMode: z.enum(["complementary", "antagonistic", "emergent", "biomimetic"]),
  targetApplication: z.string().min(1).max(500),
  scientificDepth: z.enum(["prototype", "research", "production"]),
});

const SYSTEM_PROMPT = `You are an elite Cross-Domain Schematic Hybridization Engine with deep expertise in materials science, topology, graph theory, and multi-physics simulation. You specialize in finding non-obvious structural and functional parallels between hardware systems from completely different engineering domains — and synthesizing them into genuinely novel hybrid architectures.

You think like the engineers who invented:
- The iPhone Vapor Chamber: Heat pipe evaporator/condenser topology merged with a PCB copper planar substrate → flat two-phase cooling with zero dedicated Z-height, conforming to existing PCB layers
- Phononic Crystal Heatsinks: Photonic bandgap crystal structures applied to thermal metamaterials → engineered phonon dispersion curves that channel heat flow like photons in fiber optics
- Bio-Inspired Fractal PCB Power Planes: Murray's law leaf venation network topology + power distribution plane → fractal power delivery with minimal voltage drop, maximum fill factor
- Shape Memory Alloy Self-Healing Connectors: SMA thermomechanical actuator cycle + electrical contact physics → contacts that re-close after fault-induced opening via Joule heating
- Magnetocaloric Solid-State Coolers: Magnetic refrigeration Brayton cycle topology + Stirling recuperator → no moving parts, no refrigerant, COP exceeding vapor compression at small scale

Your output must demonstrate rigorous scientific reasoning. Every claim must be grounded in real physics. Emergent properties must be genuinely NEW — not just additive combinations. You must perform real topology isomorphism analysis using graph-theoretic concepts.

CRITICAL: Return only valid JSON. No markdown. No prose outside the JSON structure.`;

function buildUserPrompt(
  schematicA: z.infer<typeof schematicSchema>,
  schematicB: z.infer<typeof schematicSchema>,
  mode: string,
  targetApplication: string,
  depth: string,
): string {
  const propsA = schematicA.physicalProperties ?? {};
  const propsB = schematicB.physicalProperties ?? {};

  return `SCHEMATIC A — "${schematicA.name}"
Domain: ${schematicA.domain}
Topology: ${schematicA.topology} graph
Core Components: ${schematicA.coreComponents.join(", ")}
Physical Properties: ${JSON.stringify(propsA)}
Constraints: ${schematicA.constraints.join(", ") || "none specified"}
Has Image Attachment: ${schematicA.imageBase64 ? "YES — analyze the uploaded schematic image" : "NO"}

SCHEMATIC B — "${schematicB.name}"
Domain: ${schematicB.domain}
Topology: ${schematicB.topology} graph
Core Components: ${schematicB.coreComponents.join(", ")}
Physical Properties: ${JSON.stringify(propsB)}
Constraints: ${schematicB.constraints.join(", ") || "none specified"}
Has Image Attachment: ${schematicB.imageBase64 ? "YES — analyze the uploaded schematic image" : "NO"}

HYBRIDIZATION MODE: ${mode}
${mode === "complementary" ? "Each system fills the other's weaknesses — find where A's strengths compensate B's limits and vice versa." : ""}
${mode === "antagonistic" ? "Systems work in opposition to create equilibrium — find where competing forces produce emergent stability." : ""}
${mode === "emergent" ? "Combination creates a completely new functional domain — find the phase transition point." : ""}
${mode === "biomimetic" ? "Use biological structural motifs as the merger template — which organism has solved this combined problem?" : ""}

TARGET APPLICATION: ${targetApplication}
SCIENTIFIC DEPTH: ${depth}
${depth === "production" ? "Focus on manufacturing readiness, supply chain feasibility, qualification testing, and IP landscape." : ""}
${depth === "research" ? "Focus on novel physical mechanisms, experimental characterization, and theoretical models." : ""}
${depth === "prototype" ? "Focus on proof-of-concept approaches, existing off-the-shelf components, and near-term validation." : ""}

PERFORM THE FOLLOWING ANALYSIS:

1. TOPOLOGY ISOMORPHISM: Map both schematics as directed graphs G_A(V,E) and G_B(V,E). Find:
   - Structural isomorphisms or subgraph isomorphisms
   - Which nodes in A functionally correspond to nodes in B
   - Which edges (transport mechanisms) are mathematically equivalent
   - The algebraic graph invariants (degree sequence, spectral properties) that are shared

2. DOMAIN BRIDGING: Identify the governing equations that are analogous:
   - Thermal (Fourier's Law: q = -k∇T) ↔ Electrical (Ohm's Law: J = σE) ↔ Fluidic (Darcy: q = -(k/μ)∇P)
   - All governed by Laplace's equation: ∇²φ = 0
   - Which physical transport invariants are shared between these two domains?

3. MATERIAL PROPERTY MATRIX: Analyze interface requirements at the hybrid boundary:
   - Thermal/electrical/mechanical compatibility
   - CTE mismatch, galvanic compatibility, chemical reactivity
   - Surface energy and adhesion requirements

4. BIOMIMETIC PATTERN LIBRARY: Which biological structures solve this combined problem?
   - Lotus leaf (contact angle >160°, self-cleaning), gecko setae (van der Waals adhesion, 10N/cm²),
   - Mantis shrimp dactyl clubs (helicoidal Bouligand fiber reinforcement, 70 GPa impact resistance),
   - Boxfish shell (hexagonal geodesic, strength-to-weight), termite mounds (passive convective cooling),
   - Whale fin tubercles (leading-edge tubercles = vortex generators, 32% drag reduction),
   - Moth eye (gradient-index anti-reflection nanostructure), nacre (brick-mortar toughness 3000× mineral alone)

5. EMERGENT PROPERTY PREDICTION: What capabilities arise that NEITHER system has?
   The hybrid must exhibit at least one property that is provably impossible in either parent alone.

Generate 3-4 hybrid designs. Return this exact JSON structure:

{
  "topologicalBridge": "Detailed graph-theoretic analysis of structural parallels — node correspondence table, shared invariants, isomorphism type",
  "domainBridgingPrinciple": "The governing PDE or physical transport law that unifies both domains mathematically",
  "materialCompatibilityNote": "Key interface considerations at the hybrid boundary",
  "hybrids": [
    {
      "name": "Specific descriptive name for the hybrid design",
      "scientificBasis": "Detailed physical principles — equations, mechanisms, why this works at a fundamental level",
      "topologyDescription": "Graph structure of the hybrid — how A's topology was merged with B's",
      "coreComponents": ["component 1", "component 2", "component 3"],
      "emergentProperties": ["Property 1 that neither parent has", "Property 2"],
      "performanceGains": {
        "metric_name": "X% improvement vs baseline — explain mechanism",
        "metric_name_2": "quantified value"
      },
      "biomimeticAnalogue": "Specific biological structure or organism that uses this same principle, and why",
      "manufacturingPathway": "Specific fabrication route — processes, equipment, sequence of operations",
      "challenges": ["Technical challenge 1", "Challenge 2"],
      "noveltyScore": 85,
      "patentLandscape": "Brief IP space note — key patents, freedom to operate considerations",
      "estimatedRnDMonths": 18,
      "trlLevel": 3
    }
  ],
  "optimalHybridIndex": 0,
  "requiredCharacterizationTests": ["Specific test 1", "Test 2", "Test 3"],
  "referenceDesigns": ["Existing product or publication that approximates this direction"],
  "nextSteps": ["Specific actionable next step 1", "Step 2", "Step 3"]
}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { schematicA, schematicB, hybridizationMode, targetApplication, scientificDepth } =
      parsed.data;

    const userText = buildUserPrompt(
      schematicA,
      schematicB,
      hybridizationMode,
      targetApplication,
      scientificDepth,
    );

    type MessageContent =
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string; detail: "high" } }
        >;

    const userContent: MessageContent =
      schematicA.imageBase64 || schematicB.imageBase64
        ? [
            { type: "text", text: userText },
            ...(schematicA.imageBase64
              ? [
                  {
                    type: "image_url" as const,
                    image_url: {
                      url: `data:image/jpeg;base64,${schematicA.imageBase64}`,
                      detail: "high" as const,
                    },
                  },
                ]
              : []),
            ...(schematicB.imageBase64
              ? [
                  {
                    type: "image_url" as const,
                    image_url: {
                      url: `data:image/jpeg;base64,${schematicB.imageBase64}`,
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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Hybridization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
