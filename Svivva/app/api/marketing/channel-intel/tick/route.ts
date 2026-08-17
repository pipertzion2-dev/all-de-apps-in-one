import { NextRequest, NextResponse } from "next/server";
import { isCronSecretAuthorized, isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  runChannelIntelWatchById,
  runDueChannelIntelWatches,
} from "@/lib/marketing/channel-intel-watch";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req)) && !isCronSecretAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { watchId?: string };
  try {
    const result = body.watchId
      ? await runChannelIntelWatchById(body.watchId)
      : await runDueChannelIntelWatches();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Channel intel tick failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isCronSecretAuthorized(req) && !(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDueChannelIntelWatches();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Channel intel tick failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
