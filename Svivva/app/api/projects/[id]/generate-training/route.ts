import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { generateAndGradeTraining, type GradedExample } from "@/lib/llm/training";
import { type JsonSchema } from "@/lib/spec";
import { db } from "@/lib/db";
import { trainingExamples } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const GenerateTrainingInputSchema = z.object({
  count: z.number().int().min(1).max(20).default(5),
  minApproved: z.number().int().min(1).max(10).default(3),
  storeApproved: z.boolean().default(true),
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

    let body: z.infer<typeof GenerateTrainingInputSchema>;
    try {
      const rawBody = await request.json().catch(() => ({}));
      body = GenerateTrainingInputSchema.parse(rawBody);
    } catch (e) {
      body = { count: 5, minApproved: 3, storeApproved: true };
    }

    const { count, minApproved, storeApproved } = body;

    const result = await generateAndGradeTraining(
      latestVersion.systemPrompt,
      latestVersion.outputSchema as JsonSchema,
      count,
      minApproved
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to generate training data", details: result.error },
        { status: 500 }
      );
    }

    let storedCount = 0;
    if (storeApproved && result.approved && result.approved.length > 0) {
      const toStore = result.approved.map((example: GradedExample, index: number) => ({
        id: uuidv4(),
        versionId: latestVersion.id,
        input: typeof example.input === "string" ? example.input : JSON.stringify(example.input),
        output: example.output,
        sortOrder: index,
      }));

      await db.insert(trainingExamples).values(toStore);
      storedCount = toStore.length;
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      generated: result.examples?.length || 0,
      approved: result.approved?.length || 0,
      rejected: result.rejected?.length || 0,
      stored: storedCount,
      examples: result.approved?.map((e) => ({
        input: e.input,
        output: e.output,
        description: e.description,
        score: e.score,
        feedback: e.feedback,
      })),
      rejectedExamples: result.rejected?.map((e) => ({
        input: e.input,
        score: e.score,
        feedback: e.feedback,
      })),
      metadata: {
        projectId,
        projectName: project.name,
        version: latestVersion.version,
        latencyMs,
      },
    });
  } catch (error) {
    console.error("Generate training error:", error);
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

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json(
        { error: "No version found" },
        { status: 404 }
      );
    }

    const examples = await db
      .select()
      .from(trainingExamples)
      .where(eq(trainingExamples.versionId, latestVersion.id))
      .orderBy(trainingExamples.sortOrder);

    return NextResponse.json({
      projectId,
      projectName: project.name,
      version: latestVersion.version,
      examples: examples.map((e) => ({
        id: e.id,
        input: e.input,
        output: e.output,
        sortOrder: e.sortOrder,
      })),
      count: examples.length,
    });
  } catch (error) {
    console.error("Get training error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
