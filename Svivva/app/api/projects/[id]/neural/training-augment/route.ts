import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralAugmentationJobs, trainingExamples, projectVersions } from "@/lib/schema";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { augmentTrainingData, STRATEGIES } from "@/lib/llm/neural";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { type JsonSchema } from "@/lib/spec";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobs = await db
      .select()
      .from(neuralAugmentationJobs)
      .where(eq(neuralAugmentationJobs.projectId, id))
      .orderBy(desc(neuralAugmentationJobs.createdAt))
      .limit(10);
    return NextResponse.json({ jobs, strategies: STRATEGIES });
  } catch (error) {
    console.error("Error fetching augmentation jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { strategy = "diversity", count = 10 } = body;

    if (!STRATEGIES.includes(strategy)) {
      return NextResponse.json({
        error: `Invalid strategy. Choose from: ${STRATEGIES.join(", ")}`,
      }, { status: 400 });
    }

    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(id);
    const systemPrompt = latestVersion?.systemPrompt || project.systemPrompt;
    const outputSchema = (latestVersion?.outputSchema || project.outputSchema) as JsonSchema;

    const existing = await db
      .select({ input: trainingExamples.input, output: trainingExamples.output })
      .from(trainingExamples)
      .innerJoin(projectVersions, eq(trainingExamples.versionId, projectVersions.id))
      .where(eq(projectVersions.projectId, id))
      .limit(10);

    const existingForAugment = existing.map(e => ({
      input: e.input,
      output: e.output as Record<string, unknown>,
    }));

    const jobId = uuidv4();
    await db.insert(neuralAugmentationJobs).values({
      id: jobId,
      projectId: id,
      strategy,
      requestedCount: Math.min(count, 20),
      status: "running",
    });

    const result = await augmentTrainingData(
      systemPrompt,
      outputSchema,
      strategy,
      Math.min(count, 20),
      existingForAugment
    );

    if (!result.success || !result.examples) {
      await db.update(neuralAugmentationJobs)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(neuralAugmentationJobs.id, jobId));
      return NextResponse.json({ error: result.error || "Augmentation failed" }, { status: 422 });
    }

    const approved = result.examples.filter(e => e.approved);
    const maxSort = existing.length;

    const targetVersionId = latestVersion?.id;
    if (!targetVersionId) {
      return NextResponse.json({ error: "No project version found to attach examples to" }, { status: 400 });
    }

    for (let i = 0; i < approved.length; i++) {
      await db.insert(trainingExamples).values({
        id: uuidv4(),
        versionId: targetVersionId,
        input: approved[i].input,
        output: approved[i].output,
        sortOrder: maxSort + i + 1,
      });
    }

    await db.update(neuralAugmentationJobs)
      .set({
        status: "completed",
        generatedCount: result.generatedCount || 0,
        approvedCount: result.approvedCount || 0,
        metadata: { strategy, examples: result.examples.length },
        completedAt: new Date(),
      })
      .where(eq(neuralAugmentationJobs.id, jobId));

    return NextResponse.json({
      jobId,
      generated: result.generatedCount,
      approved: result.approvedCount,
      strategy,
      examples: result.examples,
    }, { status: 201 });
  } catch (error) {
    console.error("Error running augmentation:", error);
    return NextResponse.json({ error: "Failed to run augmentation" }, { status: 500 });
  }
}
