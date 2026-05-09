import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { trainingExamples } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const AddTrainingExampleSchema = z.object({
  input: z.string().min(1),
  output: z.record(z.unknown()),
  sortOrder: z.number().int().optional(),
});

const AddBatchTrainingSchema = z.object({
  examples: z.array(AddTrainingExampleSchema).min(1).max(100),
});

const ImportTrainingSchema = z.object({
  format: z.enum(["json", "csv"]),
  data: z.string(),
  mapping: z
    .object({
      inputField: z.string().default("input"),
      outputField: z.string().default("output"),
    })
    .optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json({ error: "No version found" }, { status: 404 });
    }

    const examples = await db
      .select()
      .from(trainingExamples)
      .where(eq(trainingExamples.versionId, latestVersion.id))
      .orderBy(trainingExamples.sortOrder);

    return NextResponse.json({
      projectId,
      projectName: project.name,
      versionId: latestVersion.id,
      version: latestVersion.version,
      examples,
      count: examples.length,
      outputSchema: latestVersion.outputSchema,
    });
  } catch (error) {
    console.error("Get training data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json({ error: "No version found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.examples) {
      const parsed = AddBatchTrainingSchema.parse(body);

      const existingCount = await db
        .select()
        .from(trainingExamples)
        .where(eq(trainingExamples.versionId, latestVersion.id));

      const toInsert = parsed.examples.map((example, index) => ({
        id: uuidv4(),
        versionId: latestVersion.id,
        input: example.input,
        output: example.output,
        sortOrder: example.sortOrder ?? existingCount.length + index,
      }));

      await db.insert(trainingExamples).values(toInsert);

      return NextResponse.json({
        success: true,
        added: toInsert.length,
        examples: toInsert,
      });
    } else {
      const parsed = AddTrainingExampleSchema.parse(body);

      const existingCount = await db
        .select()
        .from(trainingExamples)
        .where(eq(trainingExamples.versionId, latestVersion.id));

      const newExample = {
        id: uuidv4(),
        versionId: latestVersion.id,
        input: parsed.input,
        output: parsed.output,
        sortOrder: parsed.sortOrder ?? existingCount.length,
      };

      await db.insert(trainingExamples).values(newExample);

      return NextResponse.json({
        success: true,
        example: newExample,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Add training data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
