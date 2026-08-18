import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  ORBIT_PROJECT_SOURCE_TYPES,
  type OrbitProjectSourceType,
} from "@/lib/orbit/graph-constants";
import { assertIngestAccess, runOrbitIngest, getExistingOrbitIngest } from "@/lib/orbit/ingest";

export const maxDuration = 120;

function isSourceType(v: string): v is OrbitProjectSourceType {
  return (ORBIT_PROJECT_SOURCE_TYPES as readonly string[]).includes(v);
}

/** POST — ingest upstream source into Orbit project graph */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const isAdmin = await isOrbitAdminAllowed(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Orbit ingest requires admin access" }, { status: 403 });
  }

  let body: {
    sourceType?: string;
    sourceRef?: string;
    manual?: {
      name?: string;
      description?: string;
      productType?: string;
      metadata?: Record<string, unknown>;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sourceType = body.sourceType?.trim();
  const sourceRef = body.sourceRef?.trim();

  if (!sourceType || !isSourceType(sourceType)) {
    return NextResponse.json(
      { error: `sourceType required (${ORBIT_PROJECT_SOURCE_TYPES.join(" | ")})` },
      { status: 400 },
    );
  }

  const effectiveSourceRef =
    sourceRef ||
    (sourceType === "manual" || sourceType === "campaign"
      ? `manual:${body.manual?.name?.trim().toLowerCase().replace(/\s+/g, "-") || crypto.randomUUID()}`
      : "");

  if (!effectiveSourceRef) {
    return NextResponse.json({ error: "sourceRef is required" }, { status: 400 });
  }

  if ((sourceType === "manual" || sourceType === "campaign") && !body.manual?.name?.trim()) {
    return NextResponse.json({ error: "manual.name is required" }, { status: 400 });
  }

  const access = await assertIngestAccess(req, user!.id, sourceType, effectiveSourceRef);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const result = await runOrbitIngest({
      sourceType,
      sourceRef: effectiveSourceRef,
      userId: user!.id,
      manual:
        sourceType === "manual" || sourceType === "campaign"
          ? {
              name: body.manual!.name!.trim(),
              description: body.manual?.description,
              productType: body.manual?.productType,
              metadata: body.manual?.metadata,
            }
          : undefined,
    });

    return NextResponse.json({
      ok: true,
      projectId: result.projectId,
      entityCount: result.entityCount,
      linkCount: result.linkCount,
      summary: result.snapshot.summary,
      productType: result.snapshot.productType,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

/** GET — check existing ingest for a source without re-running */
export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sourceType = req.nextUrl.searchParams.get("sourceType")?.trim();
  const sourceRef = req.nextUrl.searchParams.get("sourceRef")?.trim();

  if (!sourceType || !isSourceType(sourceType) || !sourceRef) {
    return NextResponse.json(
      { error: "sourceType and sourceRef query params required" },
      { status: 400 },
    );
  }

  const existing = await getExistingOrbitIngest(user.id, sourceType, sourceRef);
  if (!existing) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    project: {
      id: existing.id,
      name: existing.name,
      status: existing.status,
      sourceType: existing.sourceType,
      sourceRef: existing.sourceRef,
      ingestedAt: existing.ingestedAt,
      summary: existing.normalizedSummary,
    },
  });
}
