import { NextRequest, NextResponse } from "next/server";
import {
  adminAccessCookieName,
  adminAccessCookieOptions,
  adminAccessCookieValue,
  verifyAdminAccessCode,
} from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code?: string };
    if (!code || !verifyAdminAccessCode(code)) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      adminAccessCookieName(),
      adminAccessCookieValue(),
      adminAccessCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
