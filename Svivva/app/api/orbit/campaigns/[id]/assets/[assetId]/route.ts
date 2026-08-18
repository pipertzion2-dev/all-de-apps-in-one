import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import {
  getOrbitContentAssetById,
  updateContentAssetApproval,
  validateAssetContent,
  updateContentAssetValidation,
  validationToRecord,
} from "@/lib/orbit/content";
import { enqueueAssetDistribution, processDistributionQueue } from "@/lib/orbit/distribution";
import type { OrbitApprovalStatus } from "@/lib/orbit/graph-constants";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string; assetId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
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

  return NextResponse.json({ asset });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  let body: {
    action?: "approve" | "reject" | "revalidate" | "publish";
    approvalStatus?: OrbitApprovalStatus;
    processNow?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "revalidate") {
    const validation = validateAssetContent({
      body: asset.body,
      title: asset.title ?? undefined,
      platform: asset.platform as Parameters<typeof validateAssetContent>[0]["platform"],
      assetType: asset.assetType,
      policy: campaign.approvalPolicy || undefined,
    });
    const updated = await updateContentAssetValidation(
      assetId,
      validation.status === "passed" ? "passed" : "failed",
      validationToRecord(validation),
    );
    return NextResponse.json({ asset: updated, validation });
  }

  if (body.action === "publish") {
    const job = await enqueueAssetDistribution(assetId, user!.id);
    if (!job) {
      return NextResponse.json(
        { error: "Asset not eligible for distribution — approve and validate first" },
        { status: 400 },
      );
    }
    let processed = undefined;
    if (body.processNow !== false) {
      processed = await processDistributionQueue({ jobIds: [job.id] });
    }
    const refreshed = await getOrbitContentAssetById(assetId);
    return NextResponse.json({ job, processed, asset: refreshed });
  }

  const approvalStatus: OrbitApprovalStatus | undefined =
    body.action === "approve"
      ? "approved"
      : body.action === "reject"
        ? "rejected"
        : body.approvalStatus;

  if (!approvalStatus || !["approved", "rejected", "pending"].includes(approvalStatus)) {
    return NextResponse.json(
      { error: "Provide action (approve|reject|revalidate) or approvalStatus" },
      { status: 400 },
    );
  }

  const updated = await updateContentAssetApproval(assetId, approvalStatus, user!.id);
  return NextResponse.json({ asset: updated });
}
