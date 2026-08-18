import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  getOrbitCampaignById,
  updateCampaignApprovalPolicy,
  updateCampaignMode,
} from "@/lib/orbit/campaign/campaign-repository";
import {
  normalizeApprovalPolicy,
  validateApprovalPolicy,
} from "@/lib/orbit/campaign/approval-policy";
import type { OrbitApprovalPolicy, OrbitCampaignMode } from "@/lib/orbit/graph-constants";
import { ORBIT_CAMPAIGN_MODES } from "@/lib/orbit/graph-constants";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const campaign = await getOrbitCampaignById(id, user!.id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getOrbitCampaignById(id, user!.id);
  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  let body: { approvalPolicy?: Partial<OrbitApprovalPolicy>; mode?: OrbitCampaignMode } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.mode) {
    if (!(ORBIT_CAMPAIGN_MODES as readonly string[]).includes(body.mode)) {
      return NextResponse.json({ error: "Invalid campaign mode" }, { status: 400 });
    }
    const campaign = await updateCampaignMode(id, user!.id, body.mode);
    return NextResponse.json({ ok: true, campaign });
  }

  if (!body.approvalPolicy) {
    return NextResponse.json({ error: "approvalPolicy or mode required" }, { status: 400 });
  }

  const merged = normalizeApprovalPolicy(
    body.approvalPolicy,
    existing.approvalPolicy as OrbitApprovalPolicy | null,
  );
  const issues = validateApprovalPolicy(merged);
  if (issues.length) {
    return NextResponse.json({ error: "Invalid approval policy", issues }, { status: 400 });
  }

  const campaign = await updateCampaignApprovalPolicy(id, user!.id, merged);
  return NextResponse.json({ ok: true, campaign });
}
