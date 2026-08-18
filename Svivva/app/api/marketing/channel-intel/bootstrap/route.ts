import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureAdminStarterStoryWatch } from "@/lib/marketing/youtube-defaults.server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    runBriefing?: boolean;
    ingestIfEmpty?: boolean;
  };

  try {
    const result = await ensureAdminStarterStoryWatch({
      ingestIfEmpty: body.ingestIfEmpty !== false,
      runBriefing: body.runBriefing === true,
    });
    return NextResponse.json({
      ok: true,
      message: result.ranIngest
        ? "StarterStory watch ready — channel ingested with transcripts."
        : "StarterStory watch active — corpus already loaded.",
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bootstrap failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const result = await ensureAdminStarterStoryWatch({
      ingestIfEmpty: false,
      runBriefing: false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not load watch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
