import { NextRequest, NextResponse } from "next/server";
import { getLoginUrl } from "@/lib/auth/session";

/** Hostname used for app-level redirects (error pages, etc.) — can be the custom domain. */
function getAppHostname(request: NextRequest): string {
  // Custom domain always wins (set NEXT_PUBLIC_SITE_URL=https://svivva.com in production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL).host;
    } catch {}
  }
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname
  );
}

export async function GET(request: NextRequest) {
  const appHostname = getAppHostname(request);
  const redirectAfter = request.nextUrl.searchParams.get("redirect") || undefined;

  try {
    const loginUrl = await getLoginUrl(appHostname, redirectAfter);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Login error:", msg);
    return NextResponse.redirect(
      new URL(
        `/login?error=auth_failed&detail=${encodeURIComponent(msg.slice(0, 120))}`,
        `https://${appHostname}`,
      ),
    );
  }
}
