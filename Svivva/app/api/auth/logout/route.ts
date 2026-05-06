import { NextRequest, NextResponse } from "next/server";
import { clearSession, getLogoutUrl } from "@/lib/auth/session";

function getHostname(request: NextRequest): string {
  if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { return new URL(process.env.NEXT_PUBLIC_SITE_URL).host; } catch {}
  }
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname
  );
}

export async function GET(request: NextRequest) {
  const hostname = getHostname(request);
  const base = `https://${hostname}`;
  try {
    await clearSession();
    const logoutUrl = await getLogoutUrl(hostname);
    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error("Logout error:", error);
    try { await clearSession(); } catch {}
    return NextResponse.redirect(new URL("/", base));
  }
}
