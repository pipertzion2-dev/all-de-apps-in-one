import { NextRequest, NextResponse } from "next/server";
import { requireProjectOwner } from "@/lib/auth/require-project-owner";
import { versionRepository } from "@/lib/repositories";
import { assessGuardrails } from "@/lib/guardrails";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const { project, error } = await requireProjectOwner(projectId);
    if (error) return error;

    let body: { systemPrompt?: string; outputSchema?: Record<string, unknown> } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const latestVersion = await versionRepository.findLatestByProjectId(projectId);
    const systemPrompt = body.systemPrompt ?? latestVersion?.systemPrompt ?? project.systemPrompt;
    const outputSchema =
      body.outputSchema ?? latestVersion?.outputSchema ?? project.outputSchema ?? {};

    const guardrails = assessGuardrails({ systemPrompt, outputSchema });

    return NextResponse.json({
      success: true,
      guardrails,
      version: latestVersion?.version ?? null,
    });
  } catch (err) {
    console.error("Guardrails preview error:", err);
    return NextResponse.json({ error: "Failed to preview guardrails" }, { status: 500 });
  }
}
