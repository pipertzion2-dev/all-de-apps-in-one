import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import { generateCampaignAssets, listContentAssetsByCampaign } from "@/lib/orbit/content";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: campaignId } = await params;
  const campaign = await getOrbitCampaignById(campaignId, user!.id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const assets = await listContentAssetsByCampaign(campaignId);
  return NextResponse.json({ campaignId, assets });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: campaignId } = await params;
  let body: {
    plannedAssetIds?: string[];
    phases?: string[];
    regenerate?: boolean;
    templateOnly?: boolean;
  } = {};

  try {
    body = await request.json();
  } catch {
    // empty body generates all planned assets
  }

  try {
    const result = await generateCampaignAssets({
      campaignId,
      userId: user!.id,
      plannedAssetIds: body.plannedAssetIds,
      phases: body.phases,
      regenerate: body.regenerate,
      templateOnly: body.templateOnly ?? true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
