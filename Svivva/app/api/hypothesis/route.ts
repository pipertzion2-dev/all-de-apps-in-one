import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";

const discoverSchema = z.object({
  question: z.string().min(3).max(500),
  projectIds: z.array(z.string()).min(0).max(4),
  externalApis: z.array(z.object({
    name: z.string().max(200),
    url: z.string().url("Must be a valid URL").max(500),
    description: z.string().max(500).optional().default(""),
    inputSchema: z.string().max(2000).optional().default(""),
    sampleResponse: z.string().max(2000).optional().default(""),
  })).max(4).optional().default([]),
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

    return NextResponse.json({ projects: userProjects });
  } catch (e) {
    console.error("Hypothesis GET error:", e);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = discoverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { question, projectIds, externalApis: extApis, previousInsights } = parsed.data;
    const realIds = projectIds.filter((id) => id !== "__none__");

    let svivvaSummaries: { name: string; type: string; purpose: string; outputFields: string[]; sampleOutput: string }[] = [];

    if (realIds.length > 0) {
      const selectedProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          systemPrompt: projects.systemPrompt,
          outputSchema: projects.outputSchema,
        })
        .from(projects)
        .where(eq(projects.ownerId, user.id));

      const filtered = selectedProjects.filter((p) => realIds.includes(p.id));

      svivvaSummaries = filtered.map((p) => {
        const schema = p.outputSchema as Record<string, unknown>;
        const props = (schema?.properties || schema || {}) as Record<string, unknown>;
        return {
          name: p.name,
          type: "svivva",
          purpose: p.description || p.systemPrompt.slice(0, 200),
          outputFields: Object.keys(props),
          sampleOutput: JSON.stringify(
            Object.fromEntries(Object.entries(props).slice(0, 5).map(([k, v]) => [k, `<${(v as Record<string, string>)?.type || "value"}>`])),
          ),
        };
      });
    }

    const extSummaries = (extApis || []).map((a) => ({
      name: a.name,
      type: "external",
      purpose: a.description || `External API at ${a.url}`,
      outputFields: a.sampleResponse ? Object.keys(tryParseJson(a.sampleResponse)) : [],
      sampleOutput: a.sampleResponse || "{}",
      inputSchema: a.inputSchema || "",
    }));

    const allApis = [...svivvaSummaries, ...extSummaries];

    if (allApis.length === 0) {
      return NextResponse.json({ error: "Select at least one API to analyze" }, { status: 400 });
    }

    const prevContext = previousInsights.length > 0
      ? `\n\nPREVIOUSLY DISCOVERED (do NOT repeat these — build on them or find new angles):\n${previousInsights.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "";

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a research scientist AI running inside Svivva's Hypothesis Lab. You autonomously generate hypotheses, design experiments, run simulated tests, validate findings, and produce actionable insights.

Your process for EACH hypothesis must follow all 5 stages:

STAGE 1 — HYPOTHESIS GENERATION:
Generate hypotheses about relationships between the provided APIs. Include:
- Correlations (A increases when B increases)
- Inverse relationships (A goes up, B goes down)
- Anomalies (unexpected behavior under specific conditions)
- Conditional behaviors (A only affects B when C is true)
- Dependencies (B cannot function without A's output)

STAGE 2 — EXPERIMENT DESIGN:
For each hypothesis, design a concrete experiment:
- Define 3 specific input scenarios (varied inputs to test the hypothesis)
- Specify which APIs get called and in what order
- State what you'd measure in the outputs

STAGE 3 — SIMULATED EXECUTION:
For each experiment:
- Simulate calling the APIs with the designed inputs
- Generate realistic output pairs for each scenario
- Record timestamps for each simulated call

STAGE 4 — INSIGHT VALIDATION:
Compare outputs across all scenarios:
- Identify consistent patterns vs contradictions
- Note statistical differences (e.g., "output varied by 40% across scenarios")
- Flag anomalies or unexpected results
- Assign a confidence score (0-100) using this heuristic:
  90-100: Strong pattern, consistent across all scenarios
  70-89: Clear trend with minor variance
  40-69: Possible relationship but needs more data
  0-39: Weak or contradictory evidence

STAGE 5 — INSIGHT SYNTHESIS:
Write a plain-English insight that non-technical users can understand and act on.

Be creative but grounded. Find non-obvious connections.${prevContext}`,
        },
        {
          role: "user",
          content: `Discovery question: "${question}"

Available APIs and their data:
${JSON.stringify(allApis, null, 2)}

Generate 4-6 hypotheses. For EACH, run through all 5 stages.

Return JSON:
{
  "summary": "one-sentence summary of this discovery session",
  "hypotheses": [
    {
      "id": "h1",
      "hypothesis": "clear hypothesis statement",
      "category": "correlation|inverse|anomaly|conditional|dependency",
      "experiment": {
        "description": "what this experiment tests",
        "scenarios": [
          { "label": "Scenario A", "inputs": { "key": "value" }, "expectedBehavior": "what we expect" },
          { "label": "Scenario B", "inputs": { "key": "value" }, "expectedBehavior": "what we expect" },
          { "label": "Scenario C", "inputs": { "key": "value" }, "expectedBehavior": "what we expect" }
        ],
        "apisCalledInOrder": ["API 1", "API 2"]
      },
      "execution": [
        { "scenario": "Scenario A", "apiName": "API 1", "output": { "key": "simulated value" }, "timestamp": "2025-01-15T10:00:00Z" },
        { "scenario": "Scenario A", "apiName": "API 2", "output": { "key": "simulated value" }, "timestamp": "2025-01-15T10:00:01Z" }
      ],
      "validation": {
        "patternsFound": ["description of consistent pattern"],
        "contradictions": ["any contradictory findings or empty array"],
        "statisticalNote": "e.g. output varied by X% across scenarios"
      },
      "result": "confirmed|rejected|unclear",
      "confidence": 75,
      "insight": "plain English finding (2-3 sentences, actionable)",
      "apisUsed": ["API Name 1", "API Name 2"]
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
    console.error("Hypothesis POST error:", e);
    return NextResponse.json({ error: "Discovery failed. Please try again." }, { status: 500 });
  }
}

function tryParseJson(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}
