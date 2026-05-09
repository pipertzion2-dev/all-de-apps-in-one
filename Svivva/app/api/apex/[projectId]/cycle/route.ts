import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { runApexCycle } from "@/lib/apex/engine";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await runApexCycle(projectId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[APEX cycle]", err);
    return NextResponse.json({ error: "APEX cycle failed" }, { status: 500 });
  }
}
