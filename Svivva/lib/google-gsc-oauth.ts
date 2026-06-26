import crypto from "crypto";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GSC_SITES = "https://www.googleapis.com/webmasters/v3/sites";

export const GSC_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/indexing",
  "openid",
  "email",
].join(" ");

let oauthColumnsEnsured = false;

export async function ensureGscOAuthColumns(): Promise<void> {
  if (oauthColumnsEnsured) return;
  try {
    await db.execute(sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS google_oauth_refresh_token TEXT`);
    await db.execute(sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS google_oauth_email TEXT`);
    oauthColumnsEnsured = true;
  } catch {
    /* test env */
  }
}

export function getGoogleGscOAuthConfig(): { clientId: string; clientSecret: string } | null {
  const clientId =
    process.env.GOOGLE_GSC_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret =
    process.env.GOOGLE_GSC_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleGscOAuthConfigured(): boolean {
  return getGoogleGscOAuthConfig() !== null;
}

function base64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64Url(crypto.randomBytes(32));
  const codeChallenge = base64Url(crypto.createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

export function buildGoogleOAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: GSC_OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export function getGscOAuthRedirectUri(origin?: string): string {
  const base = (origin || getSiteUrl()).replace(/\/$/, "");
  return `${base}/api/gsc/oauth/callback`;
}

export async function exchangeGoogleOAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; email?: string }> {
  const cfg = getGoogleGscOAuthConfig();
  if (!cfg) throw new Error("Google OAuth not configured on server");

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Token exchange failed (${res.status})`);
  }

  let email: string | undefined;
  try {
    const ui = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (ui.ok) {
      const u = (await ui.json()) as { email?: string };
      email = u.email;
    }
  } catch {
    /* optional */
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    email,
  };
}

export async function refreshGoogleOAuthAccessToken(refreshToken: string): Promise<string> {
  const cfg = getGoogleGscOAuthConfig();
  if (!cfg) throw new Error("Google OAuth not configured");

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || `Refresh failed (${res.status})`);
  }
  return data.access_token;
}

export async function loadGoogleOAuthRefreshToken(userId: string): Promise<{
  refreshToken: string;
  email: string | null;
  siteUrl: string | null;
} | null> {
  await ensureGscOAuthColumns();
  const result = await db.execute(sql`
    SELECT google_oauth_refresh_token, google_oauth_email, google_site_url
    FROM seed_credentials WHERE user_id = ${userId} LIMIT 1
  `);
  const row = result.rows?.[0] as Record<string, unknown> | undefined;
  const refreshToken = row?.google_oauth_refresh_token as string | undefined;
  if (!refreshToken?.trim()) return null;
  return {
    refreshToken,
    email: (row?.google_oauth_email as string) || null,
    siteUrl: (row?.google_site_url as string) || null,
  };
}

export async function saveGoogleOAuthTokens(
  userId: string,
  tokens: { refreshToken: string; email?: string },
): Promise<void> {
  await ensureGscOAuthColumns();
  await db.execute(sql`
    INSERT INTO seed_credentials (id, user_id, google_oauth_refresh_token, google_oauth_email, google_indexing_enabled, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${tokens.refreshToken}, ${tokens.email ?? null}, true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      google_oauth_refresh_token = ${tokens.refreshToken},
      google_oauth_email = COALESCE(${tokens.email ?? null}, seed_credentials.google_oauth_email),
      google_indexing_enabled = true,
      updated_at = NOW()
  `);
}

export async function getGoogleOAuthAccessTokenForUser(userId: string): Promise<string | null> {
  const row = await loadGoogleOAuthRefreshToken(userId);
  if (!row) return null;
  return refreshGoogleOAuthAccessToken(row.refreshToken);
}

export type GscSiteEntry = { siteUrl: string; permissionLevel?: string };

export async function listGscSites(accessToken: string): Promise<GscSiteEntry[]> {
  const res = await fetch(GSC_SITES, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel?: string }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `List sites failed (${res.status})`);
  }
  return data.siteEntry ?? [];
}

/** Pick the GSC property that matches this deployment (hostname / URL-prefix). */
export function matchGscSiteToCanonical(sites: GscSiteEntry[], canonicalUrl: string): string | null {
  const u = new URL(canonicalUrl);
  const host = u.hostname.replace(/^www\./i, "");
  const prefix = `${canonicalUrl.replace(/\/$/, "")}/`;

  const exact = sites.find((s) => s.siteUrl === prefix || s.siteUrl === `${canonicalUrl}/`);
  if (exact) return exact.siteUrl;

  const domain = sites.find(
    (s) =>
      s.siteUrl === `sc-domain:${host}` ||
      s.siteUrl === `sc-domain:www.${host}` ||
      s.siteUrl === `sc-domain:${u.hostname}`,
  );
  if (domain) return domain.siteUrl;

  const loose = sites.find((s) => s.siteUrl.includes(host));
  return loose?.siteUrl ?? null;
}
