import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeGamerTag } from "@/lib/clean-sneaks/monetization/online-access";
import {
  getOnlineAccessSnapshot,
  loadDbUser,
  setGamerTagForUser,
} from "@/lib/clean-sneaks/monetization/online-access-server";

export const dynamic = "force-dynamic";

function deviceIdFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("x-klean-device-id");
  if (header && header.length >= 8) return header.slice(0, 64);
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const deviceId = deviceIdFromRequest(request);
    const dbUser = user ? await loadDbUser(user.id) : null;
    const online = await getOnlineAccessSnapshot({
      userId: user?.id ?? null,
      deviceId,
      dbUser,
    });
    return NextResponse.json({
      signedIn: Boolean(user),
      email: user?.email ?? null,
      gamerTag: online.gamerTag,
      online,
    });
  } catch (err) {
    console.error("klean profile get:", err);
    return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to save your gamer tag to your zzai zzai account." },
        { status: 401 },
      );
    }
    const body = await request.json();
    const tag = normalizeGamerTag(String(body.gamerTag || ""));
    if (!tag) {
      return NextResponse.json(
        { error: "Gamer tag must be 3–20 characters (letters, numbers, _ or -)." },
        { status: 400 },
      );
    }
    const result = await setGamerTagForUser(user.id, tag);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json({ gamerTag: tag });
  } catch (err) {
    console.error("klean profile patch:", err);
    return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  }
}
