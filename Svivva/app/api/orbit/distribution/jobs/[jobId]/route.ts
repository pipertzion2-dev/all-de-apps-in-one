import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  cancelDistributionJob,
  getDistributionJobById,
  runDistributionJob,
} from "@/lib/orbit/distribution";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ jobId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  void user;
  const { jobId } = await params;
  const job = await getDistributionJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  void user;
  const { jobId } = await params;
  let body: { action?: "cancel" | "retry" } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const job = await getDistributionJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (body.action === "cancel") {
    const updated = await cancelDistributionJob(jobId);
    return NextResponse.json({ job: updated });
  }

  if (body.action === "retry") {
    if (job.status === "failed" || job.status === "ready_for_manual") {
      const { completeDistributionJob } = await import("@/lib/orbit/distribution");
      await completeDistributionJob(jobId, {
        status: "pending",
        errorMessage: null,
        scheduledAt: null,
      });
    }
    const outcome = await runDistributionJob(jobId);
    const updated = await getDistributionJobById(jobId);
    return NextResponse.json({ outcome, job: updated });
  }

  return NextResponse.json({ error: "Provide action: cancel or retry" }, { status: 400 });
}
