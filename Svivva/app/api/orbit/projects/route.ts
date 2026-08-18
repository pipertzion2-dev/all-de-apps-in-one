import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { listOrbitProjectsForUser } from "@/lib/orbit/ingest";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 100);
  const projects = await listOrbitProjectsForUser(user!.id, limit);

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sourceType: p.sourceType,
      sourceRef: p.sourceRef,
      status: p.status,
      productType: (p.metadata as Record<string, unknown> | null)?.productType,
      ingestedAt: p.ingestedAt,
      summary: p.normalizedSummary,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
}
