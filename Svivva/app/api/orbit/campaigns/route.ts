import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  listOrbitCampaignsForProject,
  listOrbitCampaignsForUser,
} from "@/lib/orbit/campaign/campaign-repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    const campaigns = await listOrbitCampaignsForUser(user!.id);
    return NextResponse.json({ campaigns });
  }

  const campaigns = await listOrbitCampaignsForProject(projectId, user!.id);
  return NextResponse.json({ campaigns });
}
