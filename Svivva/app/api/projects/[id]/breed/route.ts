import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promptBreeds, projects, projectVersions, evalSuites, evalCases } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { executeRuntime } from "@/lib/llm/runtime";
import { type JsonSchema } from "@/lib/spec";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function breedPrompts(
  promptA: string,
  promptB: string,
  outputSchema: Record<string, unknown>,
): Promise<{ prompt: string; reasoning: string }> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a prompt geneticist. You take two high-performing system prompts and breed them into a superior offspring that combines the best traits of both parents.

Analyze each parent's strengths:
- Instruction clarity
- Output structure guidance
- Edge case handling
- Tone and style directives
- Constraint specificity

Create an offspring prompt that:
1. Preserves the strongest instructions from each parent
2. Resolves any contradictions by choosing the more specific directive
3. Adds complementary strengths that neither parent has alone
4. Maintains coherence and doesn't exceed reasonable length

Return JSON with "prompt" (the offspring system prompt) and "reasoning" (explain what you took from each parent and why).`,
      },
      {
        role: "user",
        content: `Parent A prompt:\n${promptA}\n\nParent B prompt:\n${promptB}\n\nOutput schema both must produce:\n${JSON.stringify(outputSchema)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      prompt: parsed.prompt || `${promptA}\n\n${promptB}`,
      reasoning: parsed.reasoning || "Combined both prompts",
    };
  } catch {
    return {
      prompt: `${promptA}\n\nAdditionally:\n${promptB}`,
      reasoning: "Fallback: concatenated both prompts",
    };
  }
}

async function quickEval(
  systemPrompt: string,
  outputSchema: Record<string, unknown>,
  projectId: string,
): Promise<{ passed: number; total: number }> {
  const suites = await db
    .select()
    .from(evalSuites)
    .where(eq(evalSuites.projectId, projectId))
    .limit(1);

  let testInputs: string[] = [];
  if (suites.length > 0) {
    const cases = await db
      .select()
      .from(evalCases)
      .where(eq(evalCases.suiteId, suites[0].id))
      .limit(10);
    testInputs = cases.map((c) => c.input);
  }

  if (testInputs.length === 0) {
    testInputs = [
      "Give me a standard example output",
      "What happens with minimal input?",
      "Process this edge case: N/A",
      "Handle a complex multi-part request",
      "Respond to an ambiguous query",
    ];
  }

  let passed = 0;
  const total = testInputs.length;

  for (const input of testInputs) {
    try {
      const result = await executeRuntime(input, {
        systemPrompt,
        outputSchema: outputSchema as JsonSchema,
        maxTokens: 2048,
      });
      if (result.success) passed++;
    } catch {
      // failed
    }
  }

  return { passed, total };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const body = await request.json();
    const { versionIdA, versionIdB } = body;

    if (!versionIdA || !versionIdB) {
      return NextResponse.json({ error: "Two version IDs required" }, { status: 400 });
    }

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [versionA] = await db
      .select()
      .from(projectVersions)
      .where(and(eq(projectVersions.id, versionIdA), eq(projectVersions.projectId, projectId)))
      .limit(1);
    const [versionB] = await db
      .select()
      .from(projectVersions)
      .where(and(eq(projectVersions.id, versionIdB), eq(projectVersions.projectId, projectId)))
      .limit(1);

    if (!versionA || !versionB) {
      return NextResponse.json(
        { error: "One or both versions not found for this project" },
        { status: 404 },
      );
    }

    const outputSchema = (versionA.outputSchema || project.outputSchema) as Record<string, unknown>;

    const breedId = uuidv4();
    await db.insert(promptBreeds).values({
      id: breedId,
      projectId,
      userId: project.ownerId,
      parentAVersionId: versionIdA,
      parentBVersionId: versionIdB,
      status: "breeding",
    });

    const { prompt: offspringPrompt, reasoning } = await breedPrompts(
      versionA.systemPrompt,
      versionB.systemPrompt,
      outputSchema,
    );

    const [evalA, evalB, evalOffspring] = await Promise.all([
      quickEval(versionA.systemPrompt, outputSchema, projectId),
      quickEval(versionB.systemPrompt, outputSchema, projectId),
      quickEval(offspringPrompt, outputSchema, projectId),
    ]);

    const newVersionId = uuidv4();
    const latestVersion = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.version))
      .limit(1);

    const nextVersion = (latestVersion[0]?.version || 0) + 1;

    await db.insert(projectVersions).values({
      id: newVersionId,
      projectId,
      version: nextVersion,
      systemPrompt: offspringPrompt,
      outputSchema,
      changeSummary: `Bred from v${versionA.version} + v${versionB.version}`,
    });

    const parentAScore = evalA.total > 0 ? Math.round((evalA.passed / evalA.total) * 100) : 0;
    const parentBScore = evalB.total > 0 ? Math.round((evalB.passed / evalB.total) * 100) : 0;
    const offspringScore =
      evalOffspring.total > 0 ? Math.round((evalOffspring.passed / evalOffspring.total) * 100) : 0;

    await db
      .update(promptBreeds)
      .set({
        status: "completed",
        offspringPrompt,
        offspringVersionId: newVersionId,
        parentAScore,
        parentBScore,
        offspringScore,
        evalResults: { parentA: evalA, parentB: evalB, offspring: evalOffspring },
        reasoning,
      })
      .where(eq(promptBreeds.id, breedId));

    return NextResponse.json({
      id: breedId,
      status: "completed",
      offspringPrompt,
      offspringVersionId: newVersionId,
      offspringVersion: nextVersion,
      parentAScore,
      parentBScore,
      offspringScore,
      evalResults: { parentA: evalA, parentB: evalB, offspring: evalOffspring },
      reasoning,
    });
  } catch (error) {
    console.error("Breed error:", error);
    try {
      const pendingBreeds = await db
        .select()
        .from(promptBreeds)
        .where(eq(promptBreeds.projectId, projectId));
      for (const breed of pendingBreeds) {
        if (breed.status === "breeding") {
          await db
            .update(promptBreeds)
            .set({ status: "failed" })
            .where(eq(promptBreeds.id, breed.id));
        }
      }
    } catch {}
    return NextResponse.json({ error: "Breeding failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const breeds = await db
      .select()
      .from(promptBreeds)
      .where(eq(promptBreeds.projectId, projectId))
      .orderBy(desc(promptBreeds.createdAt))
      .limit(10);

    return NextResponse.json({ breeds });
  } catch (error) {
    console.error("Error fetching breeds:", error);
    return NextResponse.json({ error: "Failed to fetch breeds" }, { status: 500 });
  }
}
