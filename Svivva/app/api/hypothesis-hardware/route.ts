import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";

const discoverSchema = z.object({
  question: z.string().min(3).max(500),
  hardwareContext: z
    .object({
      productType: z.string().max(200).optional().default(""),
      materials: z.string().max(500).optional().default(""),
      industry: z.string().max(200).optional().default(""),
      constraints: z.string().max(500).optional().default(""),
    })
    .optional()
    .default({}),
  selectedSources: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().max(200),
        type: z.enum(["digital_api", "external_api", "hardware_component", "seeds_app"]),
        description: z.string().max(500).optional().default(""),
        url: z.string().max(500).optional().default(""),
        inputSchema: z.string().max(2000).optional().default(""),
        sampleResponse: z.string().max(2000).optional().default(""),
      }),
    )
    .min(1)
    .max(6),
  includeDigitalApis: z.boolean().optional().default(false),
  previousInsights: z.array(z.string()).max(20).optional().default([]),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        slug: projects.slug,
        status: projects.status,
      })
      .from(projects)
      .where(eq(projects.ownerId, user.id))
      .orderBy(desc(projects.updatedAt));

    return NextResponse.json({ digitalProjects: userProjects });
  } catch (e) {
    console.error("Hypothesis Hardware GET error:", e);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = discoverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { question, hardwareContext, selectedSources, previousInsights } = parsed.data;

    const sourceSummaries = selectedSources.map((s) => ({
      name: s.name,
      type: s.type,
      description: s.description || s.url || "No description",
      dataFields: s.sampleResponse ? Object.keys(tryParseJson(s.sampleResponse)) : [],
      sampleOutput: s.sampleResponse || "",
      inputSchema: s.inputSchema || "",
    }));

    const hwContext = [
      hardwareContext.productType && `Product type: ${hardwareContext.productType}`,
      hardwareContext.materials && `Materials: ${hardwareContext.materials}`,
      hardwareContext.industry && `Industry: ${hardwareContext.industry}`,
      hardwareContext.constraints && `Constraints: ${hardwareContext.constraints}`,
    ]
      .filter(Boolean)
      .join("\n");

    const prevContext =
      previousInsights.length > 0
        ? `\n\nPREVIOUSLY DISCOVERED (do NOT repeat — build on them or find new angles):\n${previousInsights.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        : "";

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an innovation scientist AI specialized in hardware manufacturing and physical product development, running inside Svivva's Hypothesis Lab (Hardware Edition).

You think across the full ecosystem: physical products, digital APIs, software services, and data sources. You find connections that hardware manufacturers would never think of on their own.

Your process for EACH hypothesis must follow all 5 stages:

STAGE 1 — HYPOTHESIS GENERATION:
Generate hypotheses about innovative connections between hardware/manufacturing and digital systems. Think about:
- How digital data can optimize physical product design (e.g., API data → material selection)
- How hardware sensor data could create new digital services
- Cross-domain innovations (e.g., weather API data → smart packaging design)
- Supply chain optimizations using real-time data feeds
- IoT connections between physical products and digital ecosystems
- Material science innovations informed by data analysis
- Manufacturing process improvements through digital monitoring
- Physical-digital hybrid products that don't exist yet

Categories to generate:
- material_innovation: New material combinations or applications
- process_optimization: Manufacturing efficiency improvements
- iot_integration: Connecting physical products to digital systems
- cross_domain: Unexpected connections between industries
- supply_chain: Logistics and supply chain insights
- hybrid_product: Physical-digital product innovations

STAGE 2 — EXPERIMENT DESIGN:
For each hypothesis, design a concrete experiment:
- Define 3 specific test scenarios
- Specify which data sources (APIs, sensors, databases) to combine
- State what you'd measure and what success looks like

STAGE 3 — SIMULATED EXECUTION:
For each experiment:
- Simulate the data collection and analysis
- Generate realistic results for each scenario
- Include timestamps and measurement units

STAGE 4 — INSIGHT VALIDATION:
Compare results across scenarios:
- Identify manufacturing-relevant patterns
- Note cost/efficiency/quality implications
- Flag any contradictions or risks
- Assign confidence score (0-100):
  90-100: Strong pattern with clear manufacturing application
  70-89: Promising connection, needs prototyping
  40-69: Interesting theory, needs more data
  0-39: Speculative, high-risk idea

STAGE 5 — INSIGHT SYNTHESIS:
Write actionable insights that a hardware manufacturer can act on. Include:
- What to build or change
- Estimated impact (cost savings, new revenue, quality improvement)
- Next steps for prototyping${prevContext}`,
        },
        {
          role: "user",
          content: `Discovery question: "${question}"

${hwContext ? `Hardware Context:\n${hwContext}\n` : ""}
Connected Data Sources:
${JSON.stringify(sourceSummaries, null, 2)}

Generate 4-6 innovative hypotheses connecting physical manufacturing with these data sources. Think of ideas that a hardware manufacturer would NEVER come up with on their own.

Return JSON:
{
  "summary": "one-sentence summary of this discovery session",
  "hypotheses": [
    {
      "id": "h1",
      "hypothesis": "clear hypothesis statement",
      "category": "material_innovation|process_optimization|iot_integration|cross_domain|supply_chain|hybrid_product",
      "innovationScore": 85,
      "experiment": {
        "description": "what this experiment tests",
        "scenarios": [
          { "label": "Scenario A", "inputs": { "key": "value" }, "expectedBehavior": "what we expect" },
          { "label": "Scenario B", "inputs": { "key": "value" }, "expectedBehavior": "what we expect" },
          { "label": "Scenario C", "inputs": { "key": "value" }, "expectedBehavior": "what we expect" }
        ],
        "dataSourcesUsed": ["Source 1", "Source 2"]
      },
      "execution": [
        { "scenario": "Scenario A", "sourceName": "Source 1", "output": { "key": "simulated value" }, "timestamp": "2025-01-15T10:00:00Z", "unit": "kg" }
      ],
      "validation": {
        "patternsFound": ["description of manufacturing-relevant pattern"],
        "contradictions": [],
        "costImpact": "estimated cost savings or revenue potential",
        "statisticalNote": "e.g. efficiency improved by X% across scenarios"
      },
      "result": "confirmed|rejected|unclear",
      "confidence": 75,
      "insight": "actionable insight for the manufacturer (2-3 sentences)",
      "sourcesUsed": ["Source Name 1", "Source Name 2"],
      "nextSteps": ["Step 1 to prototype this", "Step 2"]
    }
  ]
}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content;
    let data: { summary: string; hypotheses: unknown[] };
    try {
      const p = JSON.parse(raw || "{}");
      data = {
        summary: p.summary || "",
        hypotheses: Array.isArray(p.hypotheses) ? p.hypotheses : [],
      };
    } catch {
      data = { summary: "Discovery completed but results could not be parsed.", hypotheses: [] };
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Hypothesis Hardware POST error:", e);
    return NextResponse.json({ error: "Discovery failed. Please try again." }, { status: 500 });
  }
}

function tryParseJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
