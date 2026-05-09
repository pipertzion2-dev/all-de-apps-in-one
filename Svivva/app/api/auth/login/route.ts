import { NextRequest, NextResponse } from "next/server";
import { getLoginUrl } from "@/lib/auth/session";

/** True if a hostname is a Replit-owned domain (valid OAuth redirect base). */
function isReplitDomain(d: string) {
  return d.endsWith(".replit.app") || d.endsWith(".repl.co") || d.endsWith(".replit.dev");
}

/**
 * Hostname used as the redirect_uri base for Replit's OIDC.
 * Replit only accepts redirects to its own domains (.replit.app / .repl.co / .replit.dev).
 * NEVER use svivva.com or any custom domain here — Replit will reject it.
 */
function getOAuthHostname(request: NextRequest): string {
  // Hard override — set REPLIT_OAUTH_DOMAIN=<your>.replit.app in production secrets
  if (process.env.REPLIT_OAUTH_DOMAIN) {
    try {
      return new URL(
        process.env.REPLIT_OAUTH_DOMAIN.startsWith("http")
          ? process.env.REPLIT_OAUTH_DOMAIN
          : `https://${process.env.REPLIT_OAUTH_DOMAIN}`,
      ).host;
    } catch {}
  }

  // Dev: Replit injects REPLIT_DEV_DOMAIN automatically
  if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;

  // Auto-detect: find any Replit-owned domain from the comma-separated REPLIT_DOMAINS list
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",").map((d) => d.trim());
    const replitDomain = domains.find(isReplitDomain);
    if (replitDomain) return replitDomain;
  }

  // Last resort: raw host header — if this is a Replit domain, use it; otherwise we're stuck
  const host = request.headers.get("host") || request.nextUrl.hostname;
  console.warn(
    "[auth/login] No Replit domain found — using host header:",
    host,
    "| REPLIT_DOMAINS:",
    process.env.REPLIT_DOMAINS,
  );
  return host;
}

/** Hostname used for app-level redirects (error pages, etc.) — can be the custom domain. */
function getAppHostname(request: NextRequest): string {
  // Custom domain always wins (set NEXT_PUBLIC_SITE_URL=https://svivva.com in production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL).host;
    } catch {}
  }
  // Dev: Replit injects REPLIT_DEV_DOMAIN automatically
  if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname
  );
}

export async function GET(request: NextRequest) {
  const oauthHostname = getOAuthHostname(request);
  const appHostname = getAppHostname(request);
  const redirectAfter = request.nextUrl.searchParams.get("redirect") || undefined;

  try {
    // getLoginUrl uses oauthHostname to build redirect_uri (must match Replit's allowlist)
    const loginUrl = await getLoginUrl(oauthHostname, redirectAfter);
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
