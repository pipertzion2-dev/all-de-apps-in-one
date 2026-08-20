import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { oauthStates } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveGscOAuthSaveUserId } from "@/lib/orbit/gsc-credentials-user";
import {
  buildGoogleOAuthUrl,
  generatePkce,
  getGscOAuthRedirectUri,
  getGoogleGscOAuthConfig,
  isGoogleGscOAuthConfigured,
  loadGoogleOAuthRefreshToken,
} from "@/lib/google-gsc-oauth";
import { getRequestOrigin } from "@/lib/site-url";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { gscOAuthConnectUrl, GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";
import { oauthHtmlBridgeResponse } from "@/lib/oauth-html-bridge";

export { gscOAuthConnectUrl as gscOAuthConnectPath };

/** Start Google OAuth for Search Console — admin only */
export async function handleGscOAuthStart(req: NextRequest): Promise<NextResponse> {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const origin = getRequestOrigin(req);

  if (!(await isOrbitAdminAllowed(req))) {
    const dest = new URL(returnTo, origin);
    dest.searchParams.set("gsc_error", "admin_required");
    return NextResponse.redirect(dest);
  }

  await hydratePlatformSecrets();

  if (!isGoogleGscOAuthConfigured()) {
    const dest = new URL(returnTo, origin);
    dest.searchParams.set("gsc_error", "oauth_not_configured");
    return NextResponse.redirect(dest);
  }

  const cfg = getGoogleGscOAuthConfig()!;
  const userId = await resolveGscOAuthSaveUserId();
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = getGscOAuthRedirectUri(origin);

  const sessionUser = await getCurrentUser();
  const savedOAuth = await loadGoogleOAuthRefreshToken(userId);
  const loginHint =
    req.nextUrl.searchParams.get("email")?.trim() ||
    sessionUser?.email?.trim() ||
    savedOAuth?.email?.trim() ||
    process.env.GSC_OAUTH_LOGIN_HINT?.trim() ||
    GSC_OAUTH_LOGIN_HINT;

  await db.insert(oauthStates).values({
    state,
    codeVerifier,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    redirectAfter: JSON.stringify({ path: returnTo, userId }),
    callbackBase: origin,
  });

  const url = buildGoogleOAuthUrl({
    clientId: cfg.clientId,
    redirectUri,
    state,
    codeChallenge,
    loginHint,
  });

  // Never 307 to Google — iOS Safari treats API-like paths (/start, /oauth) as file downloads.
  return oauthHtmlBridgeResponse(url, "Continue to Google sign-in");
}
