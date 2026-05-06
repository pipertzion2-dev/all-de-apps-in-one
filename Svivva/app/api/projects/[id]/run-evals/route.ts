import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { runEvalSuite, type EvalCaseInput } from "@/lib/llm/eval-runner";
import { type JsonSchema } from "@/lib/spec";
import { db } from "@/lib/db";
import { evalSuites, evalCases, evalRuns, evalRunResults, projects, projectVersions } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const RunEvalsInputSchema = z.object({
  suiteId: z.string().uuid().optional(),
  threshold: z.number().min(0).max(1).default(0.7),
  autoRollback: z.boolean().default(true),
  maxCases: z.number().int().min(1).max(200).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found", projectId },
        { status: 404 }
      );
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json(
        { error: "No version found for project" },
        { status: 404 }
      );
    }

    let body: z.infer<typeof RunEvalsInputSchema>;
    try {
      const rawBody = await request.json().catch(() => ({}));
      body = RunEvalsInputSchema.parse(rawBody);
    } catch {
      body = { threshold: 0.7, autoRollback: true };
    }

    const { suiteId, threshold, autoRollback, maxCases } = body;

    let suite;
    if (suiteId) {
      const suites = await db.select().from(evalSuites).where(eq(evalSuites.id, suiteId));
      suite = suites[0];
    } else {
      const suites = await db
        .select()
        .from(evalSuites)
        .where(eq(evalSuites.projectId, projectId))
        .orderBy(desc(evalSuites.createdAt))
        .limit(1);
      suite = suites[0];
    }

    if (!suite) {
      return NextResponse.json(
        { error: "No eval suite found. Generate evals first." },
        { status: 404 }
      );
    }

    let cases = await db
      .select()
      .from(evalCases)
      .where(eq(evalCases.suiteId, suite.id));

    if (cases.length === 0) {
      return NextResponse.json(
        { error: "No eval cases in suite" },
        { status: 404 }
      );
    }

    if (maxCases && cases.length > maxCases) {
      cases = cases.slice(0, maxCases);
    }

    const [evalRun] = await db
      .insert(evalRuns)
      .values({
        id: uuidv4(),
        suiteId: suite.id,
        versionId: latestVersion.id,
        status: "running",
        totalCases: cases.length,
        passedCases: 0,
        failedCases: 0,
        startedAt: new Date(),
      })
      .returning();

    const evalCaseInputs: EvalCaseInput[] = cases.map((c) => ({
      id: c.id,
      name: c.name,
      input: c.input,
      expectedOutput: c.expectedOutput as Record<string, unknown>,
      assertionType: c.assertionType,
    }));

    const runResult = await runEvalSuite(evalCaseInputs, {
      systemPrompt: latestVersion.systemPrompt,
      outputSchema: latestVersion.outputSchema as JsonSchema,
    });

    const resultsToInsert = runResult.results.map((r) => ({
      id: uuidv4(),
      runId: evalRun.id,
      caseId: r.caseId,
      actualOutput: r.actualOutput || null,
      passed: r.passed,
      error: r.error || null,
      latencyMs: Math.round(r.latencyMs),
    }));

    if (resultsToInsert.length > 0) {
      await db.insert(evalRunResults).values(resultsToInsert);
    }

    await db
      .update(evalRuns)
      .set({
        status: "completed",
        passedCases: runResult.passedCases,
        failedCases: runResult.failedCases,
        completedAt: new Date(),
      })
      .where(eq(evalRuns.id, evalRun.id));

    let rollbackPerformed = false;
    let rollbackVersion: number | null = null;
    let rollbackReason: string | null = null;

    if (runResult.passRate < threshold && autoRollback) {
      const previousVersions = await db
        .select()
        .from(projectVersions)
        .where(eq(projectVersions.projectId, projectId))
        .orderBy(desc(projectVersions.version));

      if (previousVersions.length > 1) {
        const previousVersion = previousVersions[1];

        await db
          .update(projects)
          .set({
            systemPrompt: previousVersion.systemPrompt,
            outputSchema: previousVersion.outputSchema,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        rollbackPerformed = true;
        rollbackVersion = previousVersion.version;
        rollbackReason = `Pass rate ${(runResult.passRate * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`;

        console.log(`[EvalRunner] ROLLBACK: ${rollbackReason}. Rolled back to version ${rollbackVersion}`);
      } else {
        rollbackReason = "No previous version to rollback to";
        console.log(`[EvalRunner] Cannot rollback: ${rollbackReason}`);
      }
    }

    const latencyMs = Date.now() - startTime;

    const failedResults = runResult.results
      .filter((r) => !r.passed)
      .slice(0, 5)
      .map((r) => ({
        caseName: r.caseName,
        error: r.error,
        details: r.details,
      }));

    return NextResponse.json({
      success: true,
      runId: evalRun.id,
      suiteId: suite.id,
      suiteName: suite.name,
      version: latestVersion.version,
      results: {
        totalCases: runResult.totalCases,
        passedCases: runResult.passedCases,
        failedCases: runResult.failedCases,
        passRate: runResult.passRate,
        passRatePercent: `${(runResult.passRate * 100).toFixed(1)}%`,
        avgLatencyMs: Math.round(runResult.avgLatencyMs),
        threshold,
        thresholdMet: runResult.passRate >= threshold,
      },
      rollback: {
        performed: rollbackPerformed,
        version: rollbackVersion,
        reason: rollbackReason,
        autoRollbackEnabled: autoRollback,
      },
      failedCases: failedResults,
      metadata: {
        projectId,
        projectName: project.name,
        latencyMs,
      },
    });
  } catch (error) {
    console.error("Run evals error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const suites = await db
      .select()
      .from(evalSuites)
      .where(eq(evalSuites.projectId, projectId));

    const runs = await Promise.all(
      suites.map(async (suite) => {
        const suiteRuns = await db
          .select()
          .from(evalRuns)
          .where(eq(evalRuns.suiteId, suite.id))
          .orderBy(desc(evalRuns.createdAt))
          .limit(10);

        return suiteRuns.map((run) => ({
          id: run.id,
          suiteId: suite.id,
          suiteName: suite.name,
          versionId: run.versionId,
          status: run.status,
          totalCases: run.totalCases,
          passedCases: run.passedCases,
          failedCases: run.failedCases,
          passRate: run.totalCases > 0 ? run.passedCases / run.totalCases : 0,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
        }));
      })
    );

    const allRuns = runs.flat().sort((a, b) => {
      const dateA = a.completedAt || a.startedAt || new Date(0);
      const dateB = b.completedAt || b.startedAt || new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return NextResponse.json({
      projectId,
      projectName: project.name,
      runs: allRuns,
      totalRuns: allRuns.length,
    });
  } catch (error) {
    console.error("Get eval runs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
