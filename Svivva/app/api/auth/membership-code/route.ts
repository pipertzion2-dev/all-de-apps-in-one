import { NextRequest, NextResponse } from "next/server";
import {
  membershipAccessCookieName,
  membershipAccessCookieOptions,
  membershipAccessCookieValue,
  verifyMembershipAccessCode,
} from "@/lib/auth/membership-access";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";

/** Subscriber unlock — urrthang only. Never sets Orbit admin cookie. */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`membership-code:${ip}`, 8, 60_000);
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

    if (!verifyMembershipAccessCode(code)) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      membership: true,
    });

    response.cookies.set(
      membershipAccessCookieName(),
      membershipAccessCookieValue(),
      membershipAccessCookieOptions(),
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
