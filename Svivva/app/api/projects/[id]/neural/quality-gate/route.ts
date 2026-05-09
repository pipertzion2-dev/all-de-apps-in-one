import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralQualityScores } from "@/lib/schema";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { scoreOutputQuality } from "@/lib/llm/neural";
import { eq, desc, sql } from "drizzle-orm";
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

    const scores = await db
      .select()
      .from(neuralQualityScores)
      .where(eq(neuralQualityScores.projectId, id))
      .orderBy(desc(neuralQualityScores.createdAt))
      .limit(20);

    const avgScores = await db
      .select({
        avgConfidence: sql<number>`COALESCE(AVG(${neuralQualityScores.confidenceScore}), 0)`,
        avgCoherence: sql<number>`COALESCE(AVG(${neuralQualityScores.coherenceScore}), 0)`,
        avgCompleteness: sql<number>`COALESCE(AVG(${neuralQualityScores.completenessScore}), 0)`,
        totalScored: sql<number>`COUNT(*)`,
      })
      .from(neuralQualityScores)
      .where(eq(neuralQualityScores.projectId, id));

    return NextResponse.json({
      scores,
      averages: {
        confidence: Math.round(avgScores[0]?.avgConfidence || 0),
        coherence: Math.round(avgScores[0]?.avgCoherence || 0),
        completeness: Math.round(avgScores[0]?.avgCompleteness || 0),
        totalScored: avgScores[0]?.totalScored || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching quality scores:", error);
    return NextResponse.json({ error: "Failed to fetch quality scores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { input, output } = body;

    if (!input || !output) {
      return NextResponse.json({ error: "input and output are required" }, { status: 400 });
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

    const result = await scoreOutputQuality(input, output, outputSchema, systemPrompt);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Quality scoring failed" },
        { status: 422 },
      );
    }

    const scoreId = uuidv4();
    const [score] = await db
      .insert(neuralQualityScores)
      .values({
        id: scoreId,
        projectId: id,
        versionId: latestVersion?.id || null,
        input,
        output,
        confidenceScore: result.confidenceScore || 0,
        coherenceScore: result.coherenceScore || 0,
        completenessScore: result.completenessScore || 0,
        flags: result.flags || [],
        explanation: result.explanation || "",
      })
      .returning();

    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    console.error("Error scoring output quality:", error);
    return NextResponse.json({ error: "Failed to score quality" }, { status: 500 });
  }
}
