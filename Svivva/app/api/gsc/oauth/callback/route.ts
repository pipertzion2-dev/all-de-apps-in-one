import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthStates, seedCredentials } from "@/lib/schema";
import {
  exchangeGoogleOAuthCode,
  getGscOAuthRedirectUri,
  saveGoogleOAuthTokens,
} from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";

export const dynamic = "force-dynamic";

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

  const [row] = await db
    .select()
    .from(oauthStates)
    .where(and(eq(oauthStates.state, state), gt(oauthStates.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    fallback.searchParams.set("gsc_error", "invalid_state");
    return NextResponse.redirect(fallback);
  }

  await db.delete(oauthStates).where(eq(oauthStates.state, state));

  let meta: { path?: string; userId?: string } = {};
  try {
    meta = JSON.parse(row.redirectAfter || "{}") as { path?: string; userId?: string };
  } catch {
    meta = { path: "/dashboard/gsc-connect" };
  }

  const userId = meta.userId || "orbit-admin";
  const returnPath = meta.path || "/dashboard/gsc-connect";
  const redirectUri = getGscOAuthRedirectUri(row.callbackBase || req.nextUrl.origin);

  try {
    const tokens = await exchangeGoogleOAuthCode(code, row.codeVerifier, redirectUri);
    if (!tokens.refreshToken) {
      const dest = new URL(returnPath, req.nextUrl.origin);
      dest.searchParams.set(
        "gsc_error",
        "no_refresh_token",
      );
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
    const dest = new URL(returnPath, req.nextUrl.origin);
    dest.searchParams.set("gsc_error", String(e).slice(0, 180));
    return NextResponse.redirect(dest);
  }
}
