import { NextRequest, NextResponse } from "next/server";

/** Legacy Replit OIDC callback — no longer used. Redirect to login. */
export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.nextUrl.hostname}`;
  return NextResponse.redirect(new URL("/login", appBase));
}
