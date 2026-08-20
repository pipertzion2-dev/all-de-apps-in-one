import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SECURITY_HEADERS } from "./lib/security-headers.mjs";
import { isNoindexPath } from "@/lib/seo/robots-config";

const ADMIN_COOKIE = "svivva_admin";

/** Orbit admin surfaces — require passcode cookie before OAuth/API actions. */
const ADMIN_CODE_PREFIXES = ["/dashboard/gsc-connect"];

function pathRequiresAdminCode(pathname: string): boolean {
  return ADMIN_CODE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasAdminPasscode(request: NextRequest): boolean {
  return request.cookies.get(ADMIN_COOKIE)?.value === "1";
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const { key, value } of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

function isLikelyLocalDevHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() || "";
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function canonicalSiteUrl(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://zzaizzai.com";
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function applyCrawlHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() || "";
  if (host.endsWith(".vercel.app")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else if (isNoindexPath(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const host = hostHeader.split(":")[0]?.toLowerCase();
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const canonical = canonicalSiteUrl();

  if (host && !isLikelyLocalDevHost(host) && proto === "http") {
    const dest = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${hostHeader}`,
    );
    return applyCrawlHeaders(request, withSecurityHeaders(NextResponse.redirect(dest, 308)));
  }

  if (host && canonical) {
    const apex = canonical.hostname.toLowerCase();
    if (host === `www.${apex}`) {
      const dest = new URL(
        request.nextUrl.pathname + request.nextUrl.search,
        `${canonical.protocol}//${apex}`,
      );
      return applyCrawlHeaders(request, withSecurityHeaders(NextResponse.redirect(dest, 308)));
    }
  }

  const keyMatch = request.nextUrl.pathname.match(/^\/([0-9a-f]{32})\.txt$/i);
  if (keyMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/indexnow-key";
    url.searchParams.set("key", keyMatch[1].toLowerCase());
    return applyCrawlHeaders(request, withSecurityHeaders(NextResponse.rewrite(url)));
  }

  // Google OAuth entry — must enter admin code 272727 first (blocks direct sign-in URL).
  const oauthEntry =
    request.nextUrl.pathname.endsWith("/connect") ||
    request.nextUrl.pathname.endsWith("/google-sign-in") ||
    request.nextUrl.pathname.endsWith("/oauth");
  if (pathRequiresAdminCode(request.nextUrl.pathname) && oauthEntry && !hasAdminPasscode(request)) {
    const dest = new URL("/dashboard/gsc-connect", request.url);
    dest.searchParams.set("gsc_error", "admin_required");
    const returnTo = request.nextUrl.searchParams.get("return");
    if (returnTo) dest.searchParams.set("return", returnTo);
    return applyCrawlHeaders(request, withSecurityHeaders(NextResponse.redirect(dest)));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return applyCrawlHeaders(
    request,
    withSecurityHeaders(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    ),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
