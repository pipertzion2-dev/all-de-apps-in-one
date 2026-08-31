import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAccessCookieName, adminAccessCookieValue } from "@/lib/auth/admin";
import { resolveGscOAuthSaveUserId } from "@/lib/orbit/gsc-credentials-user";
import {
  buildGscOAuthStateCookieValue,
  GSC_OAUTH_STATE_COOKIE,
  gscOAuthStateCookieOptions,
} from "@/lib/gsc-oauth-state-cookie";
import {
  buildGoogleOAuthUrl,
  generatePkce,
  getGscOAuthRedirectUri,
  getGoogleGscOAuthConfig,
  isGoogleGscOAuthConfigured,
  loadGoogleOAuthRefreshToken,
  saveGscOAuthStateRow,
} from "@/lib/google-gsc-oauth";
import { getSiteUrl } from "@/lib/site-url";
import {
  hydratePlatformSecrets,
  stripInvalidGoogleGscEnvFromProcess,
} from "@/lib/platform-runtime-secrets";
import { GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";
import { gscOAuthConfigProblem } from "@/lib/gsc-oauth-credentials";

export type GscOAuthPrepareResult =
  | {
      ok: true;
      googleUrl: string;
      state: string;
      redirectUri: string;
      expiresAt: string;
      oauthCookie: {
        name: string;
        value: string;
        options: ReturnType<typeof gscOAuthStateCookieOptions>;
      };
    }
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
  /** PKCE state lifetime — default 15m; use longer for manual/new-tab connect. */
  ttlMs?: number;
}): Promise<GscOAuthPrepareResult> {
  const returnTo = opts.returnTo || "/dashboard/gsc-connect";
  const ttlMs = opts.ttlMs && opts.ttlMs > 0 ? opts.ttlMs : 15 * 60 * 1000;
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

  stripInvalidGoogleGscEnvFromProcess();
  await hydratePlatformSecrets();

  const rawId =
    process.env.GOOGLE_GSC_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const rawSecret =
    process.env.GOOGLE_GSC_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const configProblem = gscOAuthConfigProblem(rawId, rawSecret);

  if (!isGoogleGscOAuthConfigured()) {
    const dest = new URL(returnTo, origin);
    dest.searchParams.set(
      "gsc_error",
      configProblem ? "oauth_invalid_client" : "oauth_not_configured",
    );
    return { ok: false, redirectPath: `${dest.pathname}${dest.search}` };
  }

  try {
    const cfg = getGoogleGscOAuthConfig()!;
    let userId = "orbit-admin";
    try {
      userId = await resolveGscOAuthSaveUserId();
    } catch {
      /* use default */
    }
    const { codeVerifier, codeChallenge } = generatePkce();
    const state = crypto.randomBytes(24).toString("hex");
    const redirectUri = getGscOAuthRedirectUri(origin);

    const sessionUser = await getCurrentUser().catch(() => null);
    let savedOAuth: Awaited<ReturnType<typeof loadGoogleOAuthRefreshToken>> = null;
    try {
      savedOAuth = await loadGoogleOAuthRefreshToken(userId);
    } catch {
      /* optional hint */
    }
    const loginHint =
      opts.email?.trim() ||
      sessionUser?.email?.trim() ||
      savedOAuth?.email?.trim() ||
      process.env.GSC_OAUTH_LOGIN_HINT?.trim() ||
      GSC_OAUTH_LOGIN_HINT;

    const expiresAt = new Date(Date.now() + ttlMs);
    const redirectAfter = JSON.stringify({ path: returnTo, userId });
    await saveGscOAuthStateRow({
      state,
      codeVerifier,
      redirectAfter,
      callbackBase: origin,
      expiresAt,
    });
    const oauthCookie = {
      name: GSC_OAUTH_STATE_COOKIE,
      value: buildGscOAuthStateCookieValue({
        state,
        codeVerifier,
        redirectAfter,
        callbackBase: origin,
        expiresAt,
      }),
      options: gscOAuthStateCookieOptions(expiresAt),
    };

    const googleUrl = buildGoogleOAuthUrl({
      clientId: cfg.clientId,
      redirectUri,
      state,
      codeChallenge,
      loginHint,
    });

    return {
      ok: true,
      googleUrl,
      state,
      redirectUri,
      expiresAt: expiresAt.toISOString(),
      oauthCookie,
    };
  } catch (e) {
    console.error("[gsc-oauth-prepare] failed:", e);
    const dest = new URL(returnTo, origin);
    dest.searchParams.set("gsc_error", "oauth_start_failed");
    return { ok: false, redirectPath: `${dest.pathname}${dest.search}` };
  }
}

export function gscOAuthErrorRedirectPath(returnTo: string, code: string): string {
  const base = getSiteUrl();
  const dest = new URL(returnTo, base);
  dest.searchParams.set("gsc_error", code);
  return `${dest.pathname}${dest.search}`;
}
