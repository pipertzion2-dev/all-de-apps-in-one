import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";

const reqSchema = z.object({
  systemA: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(""),
    components: z.array(z.string()).optional().default([]),
    properties: z.array(z.string()).optional().default([]),
  }),
  systemB: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(""),
    components: z.array(z.string()).optional().default([]),
    properties: z.array(z.string()).optional().default([]),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const data = parsed.data;

    const resp = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.9,
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content: `You are a Cross-Domain Hybridization Engine. You take two different physical/hardware systems, convert them to a shared representation, blend them, and generate 3-5 novel hybrid systems with emergent properties that neither original system has alone. Think like an inventor — find unexpected combinations. Return JSON only.`,
        },
        {
          role: "user",
          content: `System A: "${data.systemA.name}"
Description: ${data.systemA.description || "N/A"}
Components: ${data.systemA.components.join(", ") || "General"}
Properties: ${data.systemA.properties.join(", ") || "Standard"}

System B: "${data.systemB.name}"
Description: ${data.systemB.description || "N/A"}
Components: ${data.systemB.components.join(", ") || "General"}
Properties: ${data.systemB.properties.join(", ") || "Standard"}

Generate 3-5 hybrid systems. Return JSON:
{
  "hybrids": [
    {
      "title": "Hybrid name",
      "description": "1-2 line summary",
      "fromSystemA": "What it inherits from System A",
      "fromSystemB": "What it inherits from System B",
      "emergentBehavior": "New capability that neither system has alone",
      "noveltyScore": 85,
      "feasibility": "High/Medium/Low",
      "potentialApplications": ["app1", "app2"]
    }
  ],
  "sharedRepresentation": "Brief description of how the systems were converted to a common representation",
  "blendingStrategy": "How the systems were merged"
}`,
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Hybridization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
