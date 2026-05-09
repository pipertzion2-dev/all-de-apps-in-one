import { NextRequest, NextResponse } from "next/server";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { executeRuntime } from "@/lib/llm/runtime";
import { scoreOutputQuality } from "@/lib/llm/neural";
import { db } from "@/lib/db";
import { neuralQualityScores } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { type JsonSchema } from "@/lib/spec";

interface RouteParams {
  params: Promise<{
    projectId: string;
    endpoint: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { projectId, endpoint } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found", projectId }, { status: 404 });
    }

    if (project.status !== "active" && project.status !== "draft") {
      return NextResponse.json(
        { error: "Project is not active", status: project.status },
        { status: 403 },
      );
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    if (!latestVersion) {
      return NextResponse.json(
        { error: "No version found for project", projectId },
        { status: 404 },
      );
    }

    let body: { input?: string; [key: string]: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userInput = typeof body.input === "string" ? body.input : JSON.stringify(body);

    if (!userInput || userInput.length === 0) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const result = await executeRuntime(userInput, {
      systemPrompt: latestVersion.systemPrompt,
      outputSchema: latestVersion.outputSchema as JsonSchema,
    });

    const latencyMs = Date.now() - startTime;

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          metadata: {
            projectId,
            projectName: project.name,
            version: latestVersion.version,
            endpoint: `/${endpoint}`,
            attempts: result.attempts,
            latencyMs,
          },
        },
        { status: 422 },
      );
    }

    const outputSchema = latestVersion.outputSchema as JsonSchema;
    const systemPrompt = latestVersion.systemPrompt;

    scoreOutputQuality(userInput, result.output!, outputSchema, systemPrompt)
      .then(async (qualityResult) => {
        if (qualityResult.success) {
          await db.insert(neuralQualityScores).values({
            id: uuidv4(),
            projectId,
            versionId: latestVersion.id,
            input: userInput.substring(0, 2000),
            output: result.output!,
            confidenceScore: qualityResult.confidenceScore || 0,
            coherenceScore: qualityResult.coherenceScore || 0,
            completenessScore: qualityResult.completenessScore || 0,
            flags: qualityResult.flags || [],
            explanation: qualityResult.explanation || "",
          });
        }
      })
      .catch((err) => console.error("[NeuralQualityGate] Background scoring error:", err));

    return NextResponse.json({
      data: result.output,
      metadata: {
        projectId,
        projectName: project.name,
        version: latestVersion.version,
        endpoint: `/${endpoint}`,
        repaired: result.repaired || false,
        attempts: result.attempts,
        latencyMs,
      },
    });
  } catch (error) {
    console.error("Runtime error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { projectId, endpoint } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found", projectId }, { status: 404 });
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
      },
      version: latestVersion?.version || null,
      endpoint: `/${endpoint}`,
      method: "POST",
      usage: {
        curl: `curl -X POST ${request.nextUrl.origin}/api/runtime/${projectId}/${endpoint} -H "Content-Type: application/json" -d '{"input": "your input here"}'`,
      },
    });
  } catch (error) {
    console.error("Runtime info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
