import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralPromptAnalyses } from "@/lib/schema";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { optimizePrompt } from "@/lib/llm/neural";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { type JsonSchema } from "@/lib/spec";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .from(neuralPromptAnalyses)
      .where(eq(neuralPromptAnalyses.projectId, id))
      .orderBy(desc(neuralPromptAnalyses.createdAt))
      .limit(10);
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("Error fetching prompt analyses:", error);
    return NextResponse.json({ error: "Failed to fetch analyses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const result = await optimizePrompt(systemPrompt, outputSchema);
    if (!result.success || !result.optimizedPrompt) {
      return NextResponse.json({ error: result.error || "Optimization failed" }, { status: 422 });
    }

    const analysisId = uuidv4();
    const [analysis] = await db
      .insert(neuralPromptAnalyses)
      .values({
        id: analysisId,
        projectId: id,
        versionId: latestVersion?.id || null,
        originalPrompt: systemPrompt,
        optimizedPrompt: result.optimizedPrompt,
        rationale: result.rationale || "",
        improvementScore: result.improvementScore || 0,
        weaknesses: result.weaknesses || [],
        strengths: result.strengths || [],
      })
      .returning();

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return NextResponse.json({ error: "Failed to optimize prompt" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .from(neuralPromptAnalyses)
      .where(eq(neuralPromptAnalyses.id, analysisId));

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(id);
    const newVersion = await versionRepository.create({
      projectId: id,
      version: (latestVersion?.version || 0) + 1,
      systemPrompt: analysis.optimizedPrompt,
      outputSchema: latestVersion?.outputSchema || {},
      changeSummary: `Neural prompt optimization applied (score: ${analysis.improvementScore}%)`,
    });

    await db
      .update(neuralPromptAnalyses)
      .set({ applied: true })
      .where(eq(neuralPromptAnalyses.id, analysisId));

    return NextResponse.json({ version: newVersion, applied: true });
  } catch (error) {
    console.error("Error applying prompt optimization:", error);
    return NextResponse.json({ error: "Failed to apply optimization" }, { status: 500 });
  }
}
