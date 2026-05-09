import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
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

  const cyclesResult = await db.execute(sql`
    SELECT * FROM apex_cycles WHERE project_id = ${projectId} ORDER BY triggered_at DESC LIMIT 50
  `);
  const cycles = cyclesResult.rows;

  const totalResult = await db.execute(sql`
    SELECT COUNT(*) as value FROM apex_call_logs WHERE project_id = ${projectId}
  `);
  const totalCalls = Number((totalResult.rows[0] as { value: string })?.value ?? 0);

  return NextResponse.json({ cycles, totalCalls, project });
}
