import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import {
  enqueueCampaignDistribution,
  listDistributionJobsForCampaign,
} from "@/lib/orbit/distribution";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

  const jobs = await listDistributionJobsForCampaign(campaignId);
  return NextResponse.json({ campaignId, jobs });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: campaignId } = await params;
  let body: { assetIds?: string[]; processNow?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const result = await enqueueCampaignDistribution({
      campaignId,
      userId: user!.id,
      assetIds: body.assetIds,
      processNow: body.processNow ?? false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
