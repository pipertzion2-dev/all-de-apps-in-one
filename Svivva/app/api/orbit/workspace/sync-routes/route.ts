import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { syncWorkspaceRoutesForUser } from "@/lib/orbit/workspace/sync-workspace-routes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { templateId?: string; createRoutes?: boolean } = { createRoutes: true };
  try {
    body = { createRoutes: true, ...(await request.json()) };
  } catch {
    // defaults ok
  }

  const result = await syncWorkspaceRoutesForUser(user!.id, body);
  return NextResponse.json({ ok: true, ...result });
}
