import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralSchemaAnalyses } from "@/lib/schema";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { enhanceSchema } from "@/lib/llm/neural";
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

    const analyses = await db
      .select()
      .from(neuralSchemaAnalyses)
      .where(eq(neuralSchemaAnalyses.projectId, id))
      .orderBy(desc(neuralSchemaAnalyses.createdAt))
      .limit(10);
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("Error fetching schema analyses:", error);
    return NextResponse.json({ error: "Failed to fetch analyses" }, { status: 500 });
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

    const result = await enhanceSchema(outputSchema, systemPrompt);
    if (!result.success || !result.suggestedSchema) {
      return NextResponse.json({ error: result.error || "Enhancement failed" }, { status: 422 });
    }

    const analysisId = uuidv4();
    const [analysis] = await db.insert(neuralSchemaAnalyses).values({
      id: analysisId,
      projectId: id,
      originalSchema: outputSchema,
      suggestedSchema: result.suggestedSchema,
      rationale: result.rationale || "",
      riskLevel: result.riskLevel || "medium",
      improvements: result.improvements || [],
    }).returning();

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error("Error enhancing schema:", error);
    return NextResponse.json({ error: "Failed to enhance schema" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { analysisId } = body;

    if (!analysisId) {
      return NextResponse.json({ error: "analysisId is required" }, { status: 400 });
    }

    const [analysis] = await db
      .select()
      .from(neuralSchemaAnalyses)
      .where(eq(neuralSchemaAnalyses.id, analysisId));

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(id);
    const newVersion = await versionRepository.create({
      projectId: id,
      version: (latestVersion?.version || 0) + 1,
      systemPrompt: latestVersion?.systemPrompt || "",
      outputSchema: analysis.suggestedSchema as Record<string, unknown>,
      changeSummary: `Neural schema enhancement applied (risk: ${analysis.riskLevel})`,
    });

    await db
      .update(neuralSchemaAnalyses)
      .set({ applied: true })
      .where(eq(neuralSchemaAnalyses.id, analysisId));

    return NextResponse.json({ version: newVersion, applied: true });
  } catch (error) {
    console.error("Error applying schema enhancement:", error);
    return NextResponse.json({ error: "Failed to apply enhancement" }, { status: 500 });
  }
}
