import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { trainingExamples } from "@/lib/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; exampleId: string }>;
}

const UpdateTrainingExampleSchema = z.object({
  input: z.string().min(1).optional(),
  output: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().optional(),
});

async function validateExampleOwnership(projectId: string, exampleId: string) {
  const project = await projectRepository.findById(projectId);
  if (!project) return { error: "Project not found", status: 404 };
  
  const latestVersion = await versionRepository.findLatestByProjectId(projectId);
  if (!latestVersion) return { error: "No version found", status: 404 };
  
  const example = await db
    .select()
    .from(trainingExamples)
    .where(and(
      eq(trainingExamples.id, exampleId),
      eq(trainingExamples.versionId, latestVersion.id)
    ))
    .limit(1);
    
  if (example.length === 0) {
    return { error: "Example not found or does not belong to this project", status: 404 };
  }
  
  return { example: example[0], versionId: latestVersion.id };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId, exampleId } = await params;

  try {
    const result = await validateExampleOwnership(projectId, exampleId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ example: result.example });
  } catch (error) {
    console.error("Get training example error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: projectId, exampleId } = await params;

  try {
    const result = await validateExampleOwnership(projectId, exampleId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const parsed = UpdateTrainingExampleSchema.parse(body);

    const updateData: Partial<typeof trainingExamples.$inferInsert> = {};
    if (parsed.input !== undefined) updateData.input = parsed.input;
    if (parsed.output !== undefined) updateData.output = parsed.output;
    if (parsed.sortOrder !== undefined) updateData.sortOrder = parsed.sortOrder;

    await db
      .update(trainingExamples)
      .set(updateData)
      .where(eq(trainingExamples.id, exampleId));

    const updated = await db
      .select()
      .from(trainingExamples)
      .where(eq(trainingExamples.id, exampleId))
      .limit(1);

    return NextResponse.json({
      success: true,
      example: updated[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Update training example error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: projectId, exampleId } = await params;

  try {
    const result = await validateExampleOwnership(projectId, exampleId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await db.delete(trainingExamples).where(eq(trainingExamples.id, exampleId));

    return NextResponse.json({
      success: true,
      deleted: exampleId,
    });
  } catch (error) {
    console.error("Delete training example error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
