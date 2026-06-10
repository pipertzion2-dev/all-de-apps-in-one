import { NextRequest, NextResponse } from "next/server";
import { openai, getDefaultModel, isOrbitFreeAIConfigured } from "@/lib/llm/openai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert API architect, information theorist, and software archaeologist specializing in emergent API behavior and topological data analysis.

Given an API specification (OpenAPI/Swagger JSON or natural language) and optional usage logs, you must:

1. **Dependency Graph Construction**: Build a graph of endpoint dependencies based on data flow. An edge from A→B means the output data of A is a required or likely input to B. Compute fan-out (how many endpoints depend on this one) and fan-in (how many endpoints feed into this one) for each node. Assign semantic clusters (auth, data, analytics, etc.).

2. **Information-Theoretic Analysis (Mutual Information)**: For each pair of endpoints (A, B), estimate the mutual information I(A;B) — how much knowing A's behavior (params, responses, state changes) tells you about B's behavior. High mutual information = strong coupling. Express as a value 0.0–1.0.

3. **Emergent Pattern Mining**: Find sequences of 2–4 endpoints that together create capabilities the API wasn't explicitly designed for. These are "emergent compositions" — workflows that fall out of the design space naturally. Score each by usability (1–10) and note security implications.

4. **Semantic Contract Extraction**: For each endpoint, extract its behavioral contract as a formal predicate: preconditions (what must be true before calling), postconditions (what is guaranteed true after), and invariants (what is preserved). Flag semantic drift where observed behavior diverges from the documented contract.

5. **Complexity-Coupling Matrix**: Compute coupling score (0–1) between all endpoint pairs. Output as a dictionary of dictionaries. High coupling means endpoints are tightly co-dependent and changes to one likely break the other.

6. **Hidden Use Case Generation**: Generate 10 novel use cases discoverable from the API that the designer didn't explicitly intend. Rank by novelty score (0–100). Include implementation sketches showing how to wire the endpoints together.

7. **API Genome Fingerprint**: Create a compact behavioral fingerprint string that encodes: endpoint count, average fan-out, dominant semantic cluster, coupling density, emergent composition count. Format as a readable alphanumeric string like "API-G:E12-F2.3-C:auth-D0.4-EM7".

You MUST respond with a valid JSON object matching this exact schema:

{
  "dependencyGraph": {
    "nodes": [
      {
        "id": string,
        "complexity": number,
        "fanOut": number,
        "fanIn": number,
        "semanticCluster": string
      }
    ],
    "edges": [
      {
        "from": string,
        "to": string,
        "mutualInfo": number,
        "type": "data-flow" | "semantic" | "temporal"
      }
    ]
  },
  "emergentCompositions": [
    {
      "pattern": string,
      "discoveredCapability": string,
      "designerIntended": boolean,
      "implementationNotes": string,
      "usabilityScore": number,
      "securityConsideration": string
    }
  ],
  "semanticDrift": [
    {
      "endpoint": string,
      "documentedBehavior": string,
      "observedBehavior": string,
      "driftScore": number,
      "driftType": "scope_expansion" | "behavioral_inversion" | "parameter_mutation"
    }
  ],
  "couplingMatrix": object,
  "hiddenUseCases": [
    {
      "useCase": string,
      "requiredEndpoints": string[],
      "compositionPattern": string,
      "noveltyScore": number,
      "implementationSketch": string
    }
  ],
  "apiGenomeFingerprint": string,
  "complexityScore": number,
  "cohesionScore": number,
  "recommendations": string[]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiSpec, usageLogs, discoveryMode, targetDomain } = body;

    if (!apiSpec || typeof apiSpec !== "string" || apiSpec.trim().length === 0) {
      return NextResponse.json({ error: "apiSpec is required" }, { status: 400 });
    }

    if (!isOrbitFreeAIConfigured()) {
      return NextResponse.json(
        { error: "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or OLLAMA_URL." },
        { status: 503 },
      );
    }

    const modeInstructions: Record<string, string> = {
      composition: "Focus primarily on emergent compositions and hidden use cases.",
      drift: "Focus primarily on semantic drift detection and contract violations.",
      coupling: "Focus primarily on the coupling matrix and dependency graph.",
      all: "Perform full analysis: dependency graph, compositions, drift, coupling, and hidden use cases.",
    };

    const userContent = `
API Specification:
${apiSpec.slice(0, 8000)}

${usageLogs && usageLogs.length > 0 ? `\nUsage Logs (sample):\n${JSON.stringify(usageLogs.slice(0, 20), null, 2)}` : ""}

Target Domain: ${targetDomain || "General"}

Discovery Mode: ${discoveryMode || "all"}
${modeInstructions[discoveryMode] || modeInstructions.all}

Analyze this API using information theory, topological data analysis, and emergent pattern mining.
Return ONLY valid JSON matching the exact schema in your system prompt.`;

    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 4000,
      temperature: 0.25,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    return NextResponse.json({ success: true, result, usedModel: getDefaultModel() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
