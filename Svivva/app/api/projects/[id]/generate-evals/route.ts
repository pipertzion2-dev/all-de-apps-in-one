import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { generateEvalCases, type EvalCase } from "@/lib/llm/evals";
import { type JsonSchema } from "@/lib/spec";
import { db } from "@/lib/db";
import { evalSuites, evalCases } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const GenerateEvalsInputSchema = z.object({
  count: z.number().int().min(50).max(200).default(100),
  suiteName: z.string().min(1).max(100).optional(),
  replace: z.boolean().default(false),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found", projectId }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json({ error: "No version found for project" }, { status: 404 });
    }

    let body: z.infer<typeof GenerateEvalsInputSchema>;
    try {
      const rawBody = await request.json().catch(() => ({}));
      body = GenerateEvalsInputSchema.parse(rawBody);
    } catch {
      body = { count: 100, replace: false };
    }

    const { count, suiteName, replace } = body;
    const finalSuiteName = suiteName || `Auto-Generated Evals v${latestVersion.version}`;

    const result = await generateEvalCases(
      latestVersion.systemPrompt,
      latestVersion.outputSchema as JsonSchema,
      count,
    );

    if (!result.success || !result.cases) {
      return NextResponse.json(
        { error: "Failed to generate eval cases", details: result.error },
        { status: 500 },
      );
    }

    const existingSuites = await db
      .select()
      .from(evalSuites)
      .where(eq(evalSuites.projectId, projectId));

    let suite = existingSuites.find((s) => s.name === finalSuiteName);

    if (suite && replace) {
      await db.delete(evalCases).where(eq(evalCases.suiteId, suite.id));
    } else if (!suite) {
      const [newSuite] = await db
        .insert(evalSuites)
        .values({
          id: uuidv4(),
          projectId,
          name: finalSuiteName,
          description: `Auto-generated eval suite with ${result.cases.length} cases covering happy path, edge cases, adversarial inputs, and more.`,
        })
        .returning();
      suite = newSuite;
    }

    const sanitizeString = (str: string): string => {
      return str.replace(/\x00/g, "").replace(/[\uFFFD\uFFFE\uFFFF]/g, "");
    };

    const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          result[key] = sanitizeString(value);
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          result[key] = sanitizeObject(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
          result[key] = value.map((v) =>
            typeof v === "string"
              ? sanitizeString(v)
              : typeof v === "object" && v !== null
                ? sanitizeObject(v as Record<string, unknown>)
                : v,
          );
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    const casesToInsert = result.cases.map((c: EvalCase, index: number) => ({
      id: uuidv4(),
      suiteId: suite!.id,
      name: sanitizeString(`${c.name}_${index}`),
      input: sanitizeString(c.input),
      expectedOutput: sanitizeObject({
        ...c.expectedOutput,
        _meta: {
          category: c.category,
          assertionType: c.assertionType,
          rubric: c.rubric,
          description: c.description,
        },
      }),
      assertionType: c.assertionType,
      isActive: true,
    }));

    await db.insert(evalCases).values(casesToInsert);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      suiteId: suite!.id,
      suiteName: suite!.name,
      generated: result.cases.length,
      categoryCounts: result.categoryCounts,
      cases: result.cases.slice(0, 10).map((c) => ({
        name: c.name,
        category: c.category,
        input: c.input.substring(0, 100) + (c.input.length > 100 ? "..." : ""),
        assertionType: c.assertionType,
      })),
      metadata: {
        projectId,
        projectName: project.name,
        version: latestVersion.version,
        latencyMs,
      },
    });
  } catch (error) {
    console.error("Generate evals error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const suites = await db.select().from(evalSuites).where(eq(evalSuites.projectId, projectId));

    const suitesWithCounts = await Promise.all(
      suites.map(async (suite) => {
        const cases = await db.select().from(evalCases).where(eq(evalCases.suiteId, suite.id));

        const categoryCounts: Record<string, number> = {};
        for (const c of cases) {
          const meta = (c.expectedOutput as Record<string, unknown>)?._meta as
            | Record<string, unknown>
            | undefined;
          const category = (meta?.category as string) || "unknown";
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }

        return {
          id: suite.id,
          name: suite.name,
          description: suite.description,
          totalCases: cases.length,
          activeCases: cases.filter((c) => c.isActive).length,
          categoryCounts,
          createdAt: suite.createdAt,
        };
      }),
    );

    return NextResponse.json({
      projectId,
      projectName: project.name,
      suites: suitesWithCounts,
      totalSuites: suites.length,
    });
  } catch (error) {
    console.error("Get evals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
