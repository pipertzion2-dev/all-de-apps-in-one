import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

/** True if a hostname is a Replit-owned domain (valid OAuth redirect base). */
function isReplitDomain(d: string) {
  return d.endsWith(".replit.app") || d.endsWith(".repl.co") || d.endsWith(".replit.dev");
}

/**
 * Hostname Replit's OIDC sends the user back to (the .replit.app domain).
 * Must match exactly what was used in the login route's redirect_uri.
 */
function getOAuthHostname(request: NextRequest): string {
  if (process.env.REPLIT_OAUTH_DOMAIN) {
    try {
      return new URL(
        process.env.REPLIT_OAUTH_DOMAIN.startsWith("http")
          ? process.env.REPLIT_OAUTH_DOMAIN
          : `https://${process.env.REPLIT_OAUTH_DOMAIN}`,
      ).host;
    } catch {}
  }
  if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",").map((d) => d.trim());
    const replitDomain = domains.find(isReplitDomain);
    if (replitDomain) return replitDomain;
  }
  // When the callback request itself arrives on the Replit domain, host header is the Replit domain
  return request.headers.get("host") || request.nextUrl.hostname;
}

/** Hostname for the final app redirect — uses custom domain when available. */
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
  const appHostname = getAppHostname(request);
  const oauthHostname = getOAuthHostname(request);
  const appBase = `https://${appHostname}`;

  // Read redirectAfter and stored callbackBase from cookie (best effort — may be absent cross-domain)
  let redirectAfter: string | null = null;
  let callbackBase: string = `https://${oauthHostname}`; // derive same way as login route

  try {
    const cookieStore = await cookies();
    const oauthCookie = cookieStore.get("oauth_state");
    if (oauthCookie?.value) {
      const parsed = JSON.parse(oauthCookie.value);
      if (parsed.redirectAfter && typeof parsed.redirectAfter === "string") {
        redirectAfter = parsed.redirectAfter.startsWith("/") ? parsed.redirectAfter : null;
      }
      // If the cookie made it here, use the stored callbackBase (exact match guaranteed)
      if (parsed.callbackBase && typeof parsed.callbackBase === "string") {
        callbackBase = parsed.callbackBase;
      }
    }
  } catch {
    // Non-critical — fallback to derived callbackBase above
  }

  // Also try to get redirectAfter from the DB state record (works cross-domain)
  const state = request.nextUrl.searchParams.get("state");
  if (state && !redirectAfter) {
    try {
      const rows = await db.execute(
        sql`SELECT redirect_after, callback_base FROM oauth_states WHERE state = ${state} LIMIT 1`,
      );
      const row = rows.rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
      if (row?.redirect_after) redirectAfter = row.redirect_after as string;
      if (row?.callback_base) callbackBase = row.callback_base as string;
    } catch {
      // oauth_states may not have extra columns yet — that's fine
    }
  }

  try {
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      console.error("OAuth error from Replit:", error);
      return NextResponse.redirect(new URL("/login?error=oauth_denied", appBase));
    }

    if (!state) {
      return NextResponse.redirect(new URL("/login?error=missing_params", appBase));
    }

    // Reconstruct callback URL using the SAME base as the redirect_uri used in login
    const publicCallbackUrl = `${callbackBase}/api/auth/callback?${request.nextUrl.searchParams.toString()}`;

    const { token, user, replitAccessToken } = await handleCallback(publicCallbackUrl, state);

    // Auto-save REPL_OWNER as the Replit username (always available in Replit environment)
    const replitOwner = process.env.REPL_OWNER || null;
    if (replitOwner || replitAccessToken) {
      try {
        const [existing] = await db
          .select({ id: seedCredentials.id })
          .from(seedCredentials)
          .where(eq(seedCredentials.userId, user.id))
          .limit(1);

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (replitAccessToken) updates.replitToken = replitAccessToken;
        if (replitOwner) updates.replitUsername = replitOwner;

        if (existing) {
          await db
            .update(seedCredentials)
            .set(updates as any)
            .where(eq(seedCredentials.userId, user.id));
        } else {
          await db.insert(seedCredentials).values({
            userId: user.id,
            ...(replitAccessToken ? { replitToken: replitAccessToken } : {}),
            ...(replitOwner ? { replitUsername: replitOwner } : {}),
          });
        }
      } catch (e) {
        console.error("Failed to save Replit credentials (non-critical):", e);
      }
    }

    // Always send the user to the custom domain (svivva.com) with their session token
    const destination = redirectAfter || "/dashboard";
    return NextResponse.redirect(new URL(`${destination}?session_token=${token}`, appBase));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Callback error:", msg);
    return NextResponse.redirect(
      new URL(
        `/login?error=callback_failed&detail=${encodeURIComponent(msg.slice(0, 120))}`,
        appBase,
      ),
    );
  }
}
