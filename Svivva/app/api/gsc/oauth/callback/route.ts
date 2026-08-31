import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthStates, seedCredentials } from "@/lib/schema";
import {
  ensureOAuthStatesTable,
  exchangeGoogleOAuthCode,
  getGscOAuthRedirectUri,
  saveGoogleOAuthTokens,
} from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import { resolveGscOAuthSaveUserId } from "@/lib/orbit/gsc-credentials-user";
import { consumeGscOAuthState } from "@/lib/gsc-oauth-state-cookie";
import {
  formatDatabaseConnectionError,
  isDatabaseConnectionError,
} from "@/lib/db-connection-error";

export const dynamic = "force-dynamic";

type OAuthResume = {
  codeVerifier: string;
  redirectAfter: string;
  callbackBase: string;
};

async function loadOAuthResume(state: string): Promise<OAuthResume | null> {
  const fromCookie = await consumeGscOAuthState(state);
  if (fromCookie) {
    return {
      codeVerifier: fromCookie.codeVerifier,
      redirectAfter: fromCookie.redirectAfter,
      callbackBase: fromCookie.callbackBase,
    };
  }

  try {
    await ensureOAuthStatesTable();
    const [row] = await db
      .select()
      .from(oauthStates)
      .where(and(eq(oauthStates.state, state), gt(oauthStates.expiresAt, new Date())))
      .limit(1);
    if (!row) return null;

    await db.delete(oauthStates).where(eq(oauthStates.state, state));
    return {
      codeVerifier: row.codeVerifier,
      redirectAfter: row.redirectAfter || "{}",
      callbackBase: row.callbackBase || "",
    };
  } catch (e) {
    if (isDatabaseConnectionError(e)) throw e;
    console.warn("[gsc/oauth/callback] oauth_states lookup failed:", e);
    return null;
  }
}

function redirectWithError(origin: string, returnPath: string, code: string) {
  const dest = new URL(returnPath, origin);
  dest.searchParams.set("gsc_error", code);
  return NextResponse.redirect(dest);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  const fallback = new URL("/dashboard/gsc-connect", req.nextUrl.origin);

  if (oauthError) {
    fallback.searchParams.set("gsc_error", oauthError);
    return NextResponse.redirect(fallback);
  }

  if (!code || !state) {
    fallback.searchParams.set("gsc_error", "missing_code");
    return NextResponse.redirect(fallback);
  }

  let row: OAuthResume | null;
  try {
    row = await loadOAuthResume(state);
  } catch (e) {
    const dbMsg = formatDatabaseConnectionError(e);
    fallback.searchParams.set("gsc_error", dbMsg ? "database_unavailable" : "oauth_start_failed");
    return NextResponse.redirect(fallback);
  }
  if (!row) {
    const dest = new URL("/dashboard/gsc-connect", req.nextUrl.origin);
    dest.searchParams.set("gsc_error", "invalid_state");
    dest.searchParams.set("gsc_alt", "1");
    return NextResponse.redirect(dest);
  }

  let meta: { path?: string; userId?: string } = {};
  try {
    meta = JSON.parse(row.redirectAfter || "{}") as { path?: string; userId?: string };
  } catch {
    meta = { path: "/dashboard/gsc-connect" };
  }

  const userId = meta.userId || (await resolveGscOAuthSaveUserId());
  const returnPath = meta.path || "/dashboard/gsc-connect";
  const redirectUri = getGscOAuthRedirectUri(row.callbackBase || req.nextUrl.origin);

  try {
    const tokens = await exchangeGoogleOAuthCode(code, row.codeVerifier, redirectUri);
    if (!tokens.refreshToken) {
      const dest = new URL(returnPath, req.nextUrl.origin);
      dest.searchParams.set("gsc_error", "no_refresh_token");
      return NextResponse.redirect(dest);
    }

    await saveGoogleOAuthTokens(userId, {
      refreshToken: tokens.refreshToken,
      email: tokens.email,
    });

    const [existing] = await db
      .select({ id: seedCredentials.id })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);
    if (!existing) {
      await db.insert(seedCredentials).values({ userId, updatedAt: new Date() });
    }

    const setup = await runGscAutoSetup({ userId, accessToken: tokens.accessToken });

    const dest = new URL(returnPath, req.nextUrl.origin);
    dest.searchParams.set("gsc_connected", "1");
    if (setup.ok) dest.searchParams.set("gsc_setup", "ok");
    else dest.searchParams.set("gsc_setup", setup.message.slice(0, 200));
    return NextResponse.redirect(dest);
  } catch (e) {
    const dbMsg = formatDatabaseConnectionError(e);
    if (dbMsg) {
      return redirectWithError(req.nextUrl.origin, returnPath, "database_unavailable");
    }
    const dest = new URL(returnPath, req.nextUrl.origin);
    dest.searchParams.set("gsc_error", String(e).slice(0, 180));
    return NextResponse.redirect(dest);
  }
}
