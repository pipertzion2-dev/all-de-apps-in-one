import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthStates, seedCredentials } from "@/lib/schema";
import {
  ensureGscOAuthColumns,
  ensureOAuthStatesTable,
  exchangeGoogleOAuthCode,
  getGscOAuthRedirectUri,
  saveGoogleOAuthTokens,
} from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import { resolveGscOAuthSaveUserId } from "@/lib/orbit/gsc-credentials-user";
import { isCanonicalGscOAuthEmail, resolveGscOAuthLoginHint } from "@/lib/gsc-oauth-connect-url";

export type ManualGscCompleteInput = {
  /** Authorization code from Google */
  code?: string;
  /** OAuth state returned from /manual/start */
  state?: string;
  /** Full redirect URL from the browser address bar after Google redirects */
  callbackUrl?: string;
};

export type ManualGscCompleteResult = {
  ok: true;
  email?: string;
  setupOk: boolean;
  message: string;
};

export function parseGscOAuthCallbackUrl(raw: string): { code: string; state: string } | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return null;

  // Accept bare query string pasted from devtools
  const candidate = trimmed.startsWith("?")
    ? `https://placeholder.invalid/callback${trimmed}`
    : trimmed;

  try {
    const url = new URL(candidate);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return null;
    return { code, state };
  } catch {
    return null;
  }
}

function parseCallbackUrl(raw: string): { code: string; state: string } | null {
  return parseGscOAuthCallbackUrl(raw);
}

/**
 * Finish Google Search Console OAuth without relying on the fragile redirect cookie.
 * Looks up PKCE verifier from the DB oauth_states row created by prepare/manual start.
 */
export async function completeManualGscOAuth(
  input: ManualGscCompleteInput,
): Promise<ManualGscCompleteResult> {
  let code = input.code?.trim();
  let state = input.state?.trim();

  if ((!code || !state) && input.callbackUrl?.trim()) {
    const parsed = parseCallbackUrl(input.callbackUrl);
    if (!parsed) {
      throw new Error(
        "Could not read code/state from that URL. Paste the full address after Google redirects (it should include ?code=…&state=…).",
      );
    }
    code = parsed.code;
    state = parsed.state;
  }

  if (!code || !state) {
    throw new Error("Authorization code and state are required.");
  }

  await ensureOAuthStatesTable();
  const [row] = await db
    .select()
    .from(oauthStates)
    .where(and(eq(oauthStates.state, state), gt(oauthStates.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    await ensureGscOAuthColumns();
    const userId = await resolveGscOAuthSaveUserId();
    const [already] = await db
      .select({ refresh: seedCredentials.googleOauthRefreshToken })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);
    if (already?.refresh?.trim()) {
      return {
        ok: true,
        setupOk: false,
        message:
          "Google is already connected — this sign-in link was used. Refresh the page or click Sync property.",
      };
    }
    throw new Error(
      "This sign-in session expired or was already used. Click “Start alternate connect” again, then sign in with Google within one hour.",
    );
  }

  await db.delete(oauthStates).where(eq(oauthStates.state, state));

  let meta: { path?: string; userId?: string } = {};
  try {
    meta = JSON.parse(row.redirectAfter || "{}") as { path?: string; userId?: string };
  } catch {
    meta = {};
  }

  const userId = meta.userId || (await resolveGscOAuthSaveUserId());
  const redirectUri = getGscOAuthRedirectUri(row.callbackBase || undefined);

  const tokens = await exchangeGoogleOAuthCode(code, row.codeVerifier, redirectUri);
  if (!tokens.refreshToken) {
    throw new Error(
      "Google did not return a refresh token. Revoke ZZAI access at myaccount.google.com/permissions, then try again.",
    );
  }

  if (tokens.email && !isCanonicalGscOAuthEmail(tokens.email)) {
    throw new Error(
      `Wrong Google account (${tokens.email}). Sign in as ${resolveGscOAuthLoginHint()} — switch accounts in Google before approving.`,
    );
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

  return {
    ok: true,
    email: tokens.email,
    setupOk: setup.ok,
    message: setup.ok
      ? `Connected${tokens.email ? ` as ${tokens.email}` : ""} — property matched, sitemap submitted.`
      : setup.message ||
        `Signed in${tokens.email ? ` as ${tokens.email}` : ""} — finish verifying your site in Search Console, then Sync property.`,
  };
}
