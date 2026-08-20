import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { oauthStates } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAccessCookieName, adminAccessCookieValue } from "@/lib/auth/admin";
import { resolveGscOAuthSaveUserId } from "@/lib/orbit/gsc-credentials-user";
import {
  buildGoogleOAuthUrl,
  generatePkce,
  getGscOAuthRedirectUri,
  getGoogleGscOAuthConfig,
  isGoogleGscOAuthConfigured,
  loadGoogleOAuthRefreshToken,
} from "@/lib/google-gsc-oauth";
import { getSiteUrl } from "@/lib/site-url";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";

export type GscOAuthPrepareResult =
  | { ok: true; googleUrl: string }
  | { ok: false; redirectPath: string };

function requestOriginFromHeaders(host: string | null, proto: string | null): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured.startsWith("http") ? configured : `https://${configured}`).origin;
    } catch {
      /* fall through */
    }
  }
  const h = host || "localhost:5000";
  const p = proto?.split(",")[0]?.trim() || "https";
  return `${p}://${h}`;
}

/** Build Google OAuth URL (admin + configured client required). */
export async function prepareGscOAuthStart(opts: {
  returnTo?: string;
  email?: string;
}): Promise<GscOAuthPrepareResult> {
  const returnTo = opts.returnTo || "/dashboard/gsc-connect";
  const headerStore = await headers();
  const origin = requestOriginFromHeaders(
    headerStore.get("host"),
    headerStore.get("x-forwarded-proto"),
  );

  const cookieStore = await cookies();
  const adminOk = cookieStore.get(adminAccessCookieName())?.value === adminAccessCookieValue();
  const adminUserId = process.env.ADMIN_USER_ID?.trim()?.split(",")[0]?.trim();
  let allowed = adminOk;
  if (!allowed && adminUserId) {
    const user = await getCurrentUser();
    if (user?.id === adminUserId) allowed = true;
  }
  if (!allowed) {
    const dest = new URL(returnTo, origin);
    dest.searchParams.set("gsc_error", "admin_required");
    return { ok: false, redirectPath: `${dest.pathname}${dest.search}` };
  }

  await hydratePlatformSecrets();

  if (!isGoogleGscOAuthConfigured()) {
    const dest = new URL(returnTo, origin);
    dest.searchParams.set("gsc_error", "oauth_not_configured");
    return { ok: false, redirectPath: `${dest.pathname}${dest.search}` };
  }

  const cfg = getGoogleGscOAuthConfig()!;
  const userId = await resolveGscOAuthSaveUserId();
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = getGscOAuthRedirectUri(origin);

  const sessionUser = await getCurrentUser();
  const savedOAuth = await loadGoogleOAuthRefreshToken(userId);
  const loginHint =
    opts.email?.trim() ||
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

  const googleUrl = buildGoogleOAuthUrl({
    clientId: cfg.clientId,
    redirectUri,
    state,
    codeChallenge,
    loginHint,
  });

  return { ok: true, googleUrl };
}

export function gscOAuthErrorRedirectPath(returnTo: string, code: string): string {
  const base = getSiteUrl();
  const dest = new URL(returnTo, base);
  dest.searchParams.set("gsc_error", code);
  return `${dest.pathname}${dest.search}`;
}
