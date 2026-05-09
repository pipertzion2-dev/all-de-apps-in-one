import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAutopsies, projects, usageLogs } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function performAutopsy(
  failedInput: string,
  failedOutput: Record<string, unknown> | null,
  errorMessage: string | null,
  systemPrompt: string,
  outputSchema: Record<string, unknown>,
  recentFailures: { input: string | null; error: string | null }[],
): Promise<{
  rootCause: string;
  causeChain: string[];
  contributingFactors: string[];
  suggestedFix: string;
  fixedPrompt: string;
  severity: string;
}> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an API forensic analyst. When an AI API call fails, you perform a detailed autopsy to determine exactly what went wrong and how to fix it.

Analyze the failure and return JSON with:
- "rootCause": A clear 1-2 sentence explanation of the primary failure reason
- "causeChain": Array of strings tracing the failure from trigger to outcome (like a stack trace but human-readable)
- "contributingFactors": Array of secondary issues that made the failure worse or more likely
- "suggestedFix": Specific actionable steps to prevent this failure
- "fixedPrompt": The corrected system prompt that would handle this input correctly
- "severity": "critical" (data loss/security), "high" (broken output), "medium" (degraded quality), or "low" (cosmetic)

Be specific and forensic. Reference exact parts of the prompt or schema that caused issues.`,
      },
      {
        role: "user",
        content: `FAILED API CALL AUTOPSY

System Prompt:
${systemPrompt}

Output Schema:
${JSON.stringify(outputSchema, null, 2)}

Failed Input:
${failedInput}

Failed Output:
${failedOutput ? JSON.stringify(failedOutput, null, 2) : "No output produced"}

Error Message:
${errorMessage || "No error message"}

Recent Similar Failures (${recentFailures.length} found):
${recentFailures.map((f, i) => `${i + 1}. Input: "${f.input?.substring(0, 100)}" | Error: ${f.error}`).join("\n")}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      rootCause: parsed.rootCause || "Unable to determine root cause",
      causeChain: parsed.causeChain || ["Input received", "Processing failed", "Error returned"],
      contributingFactors: parsed.contributingFactors || [],
      suggestedFix: parsed.suggestedFix || "Review the system prompt for edge cases",
      fixedPrompt: parsed.fixedPrompt || systemPrompt,
      severity: ["critical", "high", "medium", "low"].includes(parsed.severity)
        ? parsed.severity
        : "medium",
    };
  } catch {
    return {
      rootCause: "Analysis failed - unable to parse AI response",
      causeChain: ["Input received", "Processing attempted", "Failure occurred"],
      contributingFactors: ["Possible prompt ambiguity"],
      suggestedFix: "Review the system prompt and output schema for clarity",
      fixedPrompt: systemPrompt,
      severity: "medium",
    };
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const body = await request.json();
    const { input, output, error: errorMsg } = body;

    if (!input) {
      return NextResponse.json({ error: "Failed input is required" }, { status: 400 });
    }

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const recentFailures = await db
      .select({
        input: usageLogs.input,
        error: usageLogs.error,
      })
      .from(usageLogs)
      .where(and(eq(usageLogs.projectId, projectId), eq(usageLogs.status, "error")))
      .orderBy(desc(usageLogs.createdAt))
      .limit(5);

    const autopsyResult = await performAutopsy(
      input,
      output || null,
      errorMsg || null,
      project.systemPrompt,
      project.outputSchema as Record<string, unknown>,
      recentFailures,
    );

    const autopsyId = uuidv4();
    await db.insert(apiAutopsies).values({
      id: autopsyId,
      projectId,
      userId: project.ownerId,
      failedInput: input,
      failedOutput: output || null,
      errorMessage: errorMsg || null,
      rootCause: autopsyResult.rootCause,
      causeChain: autopsyResult.causeChain,
      contributingFactors: autopsyResult.contributingFactors,
      suggestedFix: autopsyResult.suggestedFix,
      fixedPrompt: autopsyResult.fixedPrompt,
      severity: autopsyResult.severity,
      similarFailures: recentFailures.length,
      status: "open",
    });

    return NextResponse.json({
      id: autopsyId,
      ...autopsyResult,
      similarFailures: recentFailures.length,
    });
  } catch (error) {
    console.error("Autopsy error:", error);
    return NextResponse.json({ error: "Autopsy failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const autopsies = await db
      .select()
      .from(apiAutopsies)
      .where(eq(apiAutopsies.projectId, projectId))
      .orderBy(desc(apiAutopsies.createdAt))
      .limit(20);

    return NextResponse.json({ autopsies });
  } catch (error) {
    console.error("Error fetching autopsies:", error);
    return NextResponse.json({ error: "Failed to fetch autopsies" }, { status: 500 });
  }
}
