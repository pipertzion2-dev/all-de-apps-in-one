import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { healOrphanInternalLinks, buildInternalLinkMap } from "@/lib/seo/internal-links/graph";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isOrbitAdminAllowed())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const heal = await healOrphanInternalLinks();
  const map = await buildInternalLinkMap();
  return NextResponse.json({ ok: true, ...heal, orphanSlugsRemaining: map.orphanSlugs.length });
}
