import { NextRequest, NextResponse } from "next/server";
import { hasMembershipAccess } from "@/lib/auth/membership-access";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getOnlineAccessSnapshot,
  loadDbUser,
} from "@/lib/clean-sneaks/monetization/online-access-server";

export const dynamic = "force-dynamic";

function deviceIdFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("x-klean-device-id");
  if (header && header.length >= 8) return header.slice(0, 64);
  const q = request.nextUrl.searchParams.get("deviceId");
  if (q && q.length >= 8) return q.slice(0, 64);
  return null;
}

/** Remaining free online tables + platform subscription status. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const deviceId = deviceIdFromRequest(request);
    const dbUser = user ? await loadDbUser(user.id) : null;
    const snapshot = await getOnlineAccessSnapshot({
      userId: user?.id ?? null,
      deviceId,
      dbUser,
      membershipAccess: await hasMembershipAccess(),
    });
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("klean online-access:", err);
    return NextResponse.json({ error: "Could not load online access." }, { status: 500 });
  }
}
