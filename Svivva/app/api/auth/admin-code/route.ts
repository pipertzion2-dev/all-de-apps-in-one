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

export async function POST(request: NextRequest) {
  try {
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
