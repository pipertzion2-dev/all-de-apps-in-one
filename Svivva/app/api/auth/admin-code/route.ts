import { NextRequest, NextResponse } from "next/server";
import {
  adminAccessCookieName,
  adminAccessCookieOptions,
  adminAccessCookieValue,
  verifyAdminAccessCode,
} from "@/lib/auth/admin";
import {
  membershipAccessCookieName,
  membershipAccessCookieOptions,
  membershipAccessCookieValue,
  verifyMembershipAccessCode,
} from "@/lib/auth/membership-access";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`admin-code:${ip}`, 8, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        {
          status: 429,
          headers: limit.retryAfterSec ? { "Retry-After": String(limit.retryAfterSec) } : undefined,
        },
      );
    }

    const { code } = (await request.json()) as { code?: string };
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const isAdmin = verifyAdminAccessCode(code);
    const isMembership = verifyMembershipAccessCode(code);
    if (!isAdmin && !isMembership) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      admin: isAdmin,
      membership: isMembership,
    });

    if (isAdmin) {
      response.cookies.set(
        adminAccessCookieName(),
        adminAccessCookieValue(),
        adminAccessCookieOptions(),
      );
    }
    if (isMembership) {
      response.cookies.set(
        membershipAccessCookieName(),
        membershipAccessCookieValue(),
        membershipAccessCookieOptions(),
      );
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
