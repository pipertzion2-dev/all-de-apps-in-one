import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runProjectIndexSubmit } from "@/lib/orbit/indexing";
import type { IndexProvider } from "@/lib/orbit/indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type RouteParams = { params: Promise<{ id: string }> };

const VALID_PROVIDERS = new Set<IndexProvider>(["indexnow", "gsc", "google_indexing"]);

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  let body: {
    urls?: string[];
    providers?: string[];
    probeFirst?: boolean;
    campaignId?: string;
    contentAssetId?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    // empty body ok — submit all project URLs
  }

  const providers = body.providers?.filter((p): p is IndexProvider =>
    VALID_PROVIDERS.has(p as IndexProvider),
  );

  try {
    const result = await runProjectIndexSubmit({
      projectId,
      userId: user!.id,
      urls: body.urls,
      providers: providers?.length ? providers : undefined,
      probeFirst: body.probeFirst,
      campaignId: body.campaignId,
      contentAssetId: body.contentAssetId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
