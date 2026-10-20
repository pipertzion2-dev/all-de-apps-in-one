import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectOwner } from "@/lib/auth/require-project-owner";
import { rollbackProjectToVersion } from "@/lib/guardrails";
import { versionRepository } from "@/lib/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const RollbackBodySchema = z.object({
  versionId: z.string().uuid().optional(),
  version: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const { project, error } = await requireProjectOwner(projectId);
    if (error) return error;

    const raw = await request.json().catch(() => ({}));
    const body = RollbackBodySchema.parse(raw);

    if (!body.versionId && body.version == null) {
      return NextResponse.json(
        { error: "Provide versionId or version number to roll back." },
        { status: 400 },
      );
    }

    let targetVersionId = body.versionId;
    if (!targetVersionId && body.version != null) {
      const match = await versionRepository.findByVersionNumber(projectId, body.version);
      if (!match) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      targetVersionId = match.id;
    }

    const rolled = await rollbackProjectToVersion(projectId, targetVersionId!);

    return NextResponse.json({
      success: true,
      projectId,
      projectName: project.name,
      rolledBackTo: {
        versionId: rolled.id,
        version: rolled.version,
        changeSummary: rolled.changeSummary,
      },
    });
  } catch (err) {
    console.error("Rollback error:", err);
    const message = err instanceof Error ? err.message : "Rollback failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
