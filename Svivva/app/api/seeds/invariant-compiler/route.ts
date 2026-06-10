import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

interface GeneratedApp {
  name: string;
  description: string;
  features: string[];
}

type InvariantType = "safety" | "liveness" | "fairness" | "security" | "performance";

interface RequestBody {
  originalSpec: string;
  generatedApps: GeneratedApp[];
  invariantTypes: InvariantType[];
}

interface ExtractedInvariant {
  id: string;
  type: InvariantType;
  naturalLanguage: string;
  formalSpec: string;
  criticalityLevel: "P0" | "P1" | "P2" | "P3";
  sourceClause: string;
  category: string;
}

interface VerificationResult {
  appName: string;
  invariantId: string;
  verdict: "HOLDS" | "VIOLATED" | "UNKNOWN";
  confidence: number;
  counterexample: string;
  violationType: string;
  fixSuggestion: string;
  severityScore: number;
}

interface HealthMatrix {
  [appName: string]: {
    safety?: number;
    liveness?: number;
    fairness?: number;
    security?: number;
    performance?: number;
  };
}

interface InvariantCompilerResponse {
  extractedInvariants: ExtractedInvariant[];
  verificationResults: VerificationResult[];
  overallHealthMatrix: HealthMatrix;
  tlaSpecFragment: string;
  criticalViolations: string[];
  recommendedAppOrder: string[];
  specCoverageScore: number;
}

const INVARIANT_SYSTEM_PROMPT = `You are a formal verification engineer and symbolic AI expert with deep expertise in:
- Hoare logic and program correctness proofs ({P} C {Q} triples)
- Bounded model checking and temporal logic (LTL, CTL)
- Abstract interpretation (Cousot & Cousot 1977) — over-approximating program behaviors
- TLA+ (Lamport's Temporal Logic of Actions) specification language
- Safety vs. liveness properties in concurrent and reactive systems
- Information flow analysis and non-interference for security properties

Your task is to act as a **Behavioral Invariant Compiler** — extracting formal invariants from natural-language specs and verifying generated app descriptions against them.

## Step 1: Invariant Extraction
Parse the specification and extract formal behavioral invariants. For each invariant:
- Assign an ID (INV-001, INV-002, ...)
- Classify by type: safety (nothing bad ever happens), liveness (something good eventually happens), fairness (equitable resource access), security (information non-interference), performance (bounded response time)
- Write it in natural language
- Write it in formal notation: ∀ implementations I: P(I) or temporal logic form
- Assign criticality: P0 (system-breaking), P1 (major), P2 (significant), P3 (minor)
- Quote the source clause from the spec

## Step 2: Abstract Interpretation
For each generated app, abstract its behavior:
- Identify the set of possible execution traces (sequences of state transitions)
- Over-approximate: include all possible behaviors, not just intended ones
- Check if any trace in the abstraction could violate an invariant

## Step 3: Counterexample Generation
For each violation, construct a minimal concrete counterexample:
- A specific user scenario / sequence of actions
- The exact state where the invariant fails
- Why it fails (which precondition is violated)

## Step 4: Refinement Suggestions
For each violation, suggest the minimal code/design fix to restore invariant satisfaction.

## Step 5: TLA+ Specification
Generate a TLA+ style spec fragment showing the key invariants as INVARIANT declarations and the system state as VARIABLES.

Return a single JSON object (no markdown outside JSON) matching this exact schema:
{
  "extractedInvariants": [
    {
      "id": "INV-NNN",
      "type": "safety|liveness|fairness|security|performance",
      "naturalLanguage": "plain English description",
      "formalSpec": "∀ or temporal logic formula",
      "criticalityLevel": "P0|P1|P2|P3",
      "sourceClause": "From spec: '...' (direct quote)",
      "category": "domain category e.g. privacy, data-integrity, auth, availability"
    }
  ],
  "verificationResults": [
    {
      "appName": "app name",
      "invariantId": "INV-NNN",
      "verdict": "HOLDS|VIOLATED|UNKNOWN",
      "confidence": float 0-1,
      "counterexample": "concrete scenario description or empty string if HOLDS",
      "violationType": "type of violation or empty string if HOLDS",
      "fixSuggestion": "minimal fix or empty string if HOLDS",
      "severityScore": float 0-10
    }
  ],
  "overallHealthMatrix": {
    "appName": { "safety": float 0-1, "liveness": float 0-1, "fairness": float 0-1, "security": float 0-1, "performance": float 0-1 }
  },
  "tlaSpecFragment": "TLA+ MODULE fragment as a string (use \\n for newlines)",
  "criticalViolations": [ "INV-NNN violated by AppName: brief description", ... ],
  "recommendedAppOrder": [ "appName in order from most spec-compliant to least", ... ],
  "specCoverageScore": float 0-1 (how completely the spec was translated into formal invariants)
}

Be rigorous. Prefer VIOLATED with concrete counterexamples over UNKNOWN. If an app's description doesn't address an invariant at all, mark it VIOLATED (by omission is a real failure).`;

function buildUserMessage(body: RequestBody): string {
  const { originalSpec, generatedApps, invariantTypes } = body;

  const appSection = generatedApps
    .map(
      (app, i) =>
        `### App ${i + 1}: "${app.name}"\nDescription: ${app.description}\nFeatures:\n${app.features.map((f) => `  - ${f}`).join("\n")}`,
    )
    .join("\n\n");

  return `## ORIGINAL SPECIFICATION
${originalSpec}

## GENERATED APPS TO VERIFY
${appSection}

## REQUESTED INVARIANT TYPES
${invariantTypes.join(", ")}

Extract all behavioral invariants from the spec (focusing on the requested types), then verify each generated app against every invariant. Generate the full TLA+ spec fragment. Return only the JSON object.`;
}

export async function POST(req: Request) {
  try {
    if (!(await isOrbitAdminAllowed())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 401 });
    }

    const body: RequestBody = await req.json();
    const { originalSpec, generatedApps, invariantTypes } = body;

    if (!originalSpec || !originalSpec.trim()) {
      return NextResponse.json({ error: "originalSpec is required" }, { status: 400 });
    }
    if (!generatedApps || generatedApps.length === 0) {
      return NextResponse.json({ error: "At least one generatedApp is required" }, { status: 400 });
    }
    if (!invariantTypes || invariantTypes.length === 0) {
      return NextResponse.json(
        { error: "At least one invariantType is required" },
        { status: 400 },
      );
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: INVARIANT_SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(body) },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 });
    }

    let result: InvariantCompilerResponse;
    try {
      result = JSON.parse(raw) as InvariantCompilerResponse;
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response as JSON" }, { status: 500 });
    }

    if (!result.extractedInvariants || !result.verificationResults) {
      return NextResponse.json(
        { error: "Invalid invariant compiler response structure" },
        { status: 500 },
      );
    }

    result.specCoverageScore = Math.max(0, Math.min(1, result.specCoverageScore));

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("invariant-compiler error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
