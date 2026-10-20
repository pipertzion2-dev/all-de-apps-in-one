import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { generateIfmPairings, listIfmToolFamilies } from "@/lib/orbit/ifm";

export const dynamic = "force-dynamic";

/** GET — preview IFM pairings without persisting. */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = Math.min(Number(request.nextUrl.searchParams.get("count") || 10), 20);
  const weekSeed = request.nextUrl.searchParams.get("weekSeed") || undefined;

  return NextResponse.json({
    families: listIfmToolFamilies(),
    pairings: generateIfmPairings({ count, weekSeed }),
  });
}
