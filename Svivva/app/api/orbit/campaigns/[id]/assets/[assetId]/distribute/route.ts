import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import { getOrbitContentAssetById } from "@/lib/orbit/content";
import { enqueueAssetDistribution, processDistributionQueue } from "@/lib/orbit/distribution";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type RouteParams = { params: Promise<{ id: string; assetId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: campaignId, assetId } = await params;
  const campaign = await getOrbitCampaignById(campaignId, user!.id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const asset = await getOrbitContentAssetById(assetId);
  if (!asset || asset.orbitCampaignId !== campaignId) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  let body: { processNow?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const job = await enqueueAssetDistribution(assetId, user!.id);
    if (!job) {
      return NextResponse.json(
        {
          error:
            "Asset not eligible for distribution (approve + validate first, or indexing intent)",
        },
        { status: 400 },
      );
    }

    let processed = undefined;
    if (body.processNow) {
      processed = await processDistributionQueue({ jobIds: [job.id] });
    }

    return NextResponse.json({ ok: true, job, processed });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
