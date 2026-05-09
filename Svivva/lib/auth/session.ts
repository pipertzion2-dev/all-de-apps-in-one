import * as client from "openid-client";
import { cookies, headers } from "next/headers";
import { sql, eq, and, gt } from "drizzle-orm";
import memoize from "memoizee";
import { authStorage } from "./storage";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/schema";
import { randomBytes } from "crypto";

function getOidcClientId(): string {
  const id = process.env.OIDC_CLIENT_ID || process.env.REPL_ID;
  if (!id) {
    throw new Error("Set OIDC_CLIENT_ID (or REPL_ID on Replit) for OpenID login.");
  }
  return id;
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      getOidcClientId(),
    );
  },
  { maxAge: 3600 * 1000 },
);

export interface SessionUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

const SESSION_COOKIE_NAME = "vivva_session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.expiresAt && Date.now() < session.expiresAt) {
        return session.user;
      }
    } catch {
      // invalid cookie
    }
  }

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);
    if (user) return user;
  }

  return null;
}

async function getUserFromToken(token: string): Promise<SessionUser | null> {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

    if (!session) return null;

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.name?.split(" ")[0] || null,
      lastName: user.name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: user.avatarUrl,
    };
  } catch (e) {
    console.error("Error getting user from token:", e);
    return null;
  }
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setSession(user: SessionUser, expiresAt: number): Promise<string> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ user, expiresAt }), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  } catch {
    console.log("Could not set session cookie");
  }

  const token = generateSessionToken();
  const sessionId = randomBytes(16).toString("hex");

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt: new Date(expiresAt),
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

async function ensureOauthStatesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      code_verifier TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      redirect_after TEXT,
      callback_base TEXT
    )
  `);
  // Add columns to existing tables that were created before this migration
  await db.execute(sql`ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS redirect_after TEXT`);
  await db.execute(sql`ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS callback_base TEXT`);
}

export async function getLoginUrl(hostname: string, redirectAfter?: string): Promise<string> {
  await ensureOauthStatesTable();

  const config = await getOidcConfig();
  const redirectUri = `https://${hostname}/api/auth/callback`;

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  const callbackBase = `https://${hostname}`;

  // Persist PKCE state + callbackBase + redirectAfter in DB so they survive cross-domain callbacks
  await db.execute(sql`
    INSERT INTO oauth_states (state, code_verifier, expires_at, redirect_after, callback_base)
    VALUES (${state}, ${codeVerifier}, ${new Date(Date.now() + 10 * 60 * 1000)}, ${redirectAfter ?? null}, ${callbackBase})
    ON CONFLICT (state) DO UPDATE
      SET code_verifier = EXCLUDED.code_verifier,
          expires_at = EXCLUDED.expires_at,
          redirect_after = EXCLUDED.redirect_after,
          callback_base = EXCLUDED.callback_base
  `);

  // Store state + optional post-login redirect + callbackBase in cookie
  // callbackBase is the OAuth hostname (Replit domain) — needed to reconstruct redirect_uri in callback
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "oauth_state",
      JSON.stringify({
        state,
        codeVerifier,
        redirectAfter: redirectAfter || null,
        callbackBase: `https://${hostname}`,
      }),
      {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 600,
      },
    );
  } catch {
    console.log("Could not set OAuth cookie");
  }

  const parameters: Record<string, string> = {
    redirect_uri: redirectUri,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    prompt: "login",
  };

  const redirectTo = client.buildAuthorizationUrl(config, parameters);
  return redirectTo.href;
}

export async function handleCallback(
  currentUrl: string,
  state: string,
): Promise<{ user: SessionUser; token: string; replitAccessToken: string | null }> {
  await ensureOauthStatesTable();

  const config = await getOidcConfig();
  let codeVerifier: string | null = null;

  // Try DB first
  try {
    const rows = await db.execute(
      sql`SELECT code_verifier FROM oauth_states WHERE state = ${state} AND expires_at > NOW() LIMIT 1`,
    );
    const row = rows.rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
    if (row?.code_verifier) {
      codeVerifier = row.code_verifier as string;
      await db.execute(sql`DELETE FROM oauth_states WHERE state = ${state}`);
      console.log("OAuth state found in DB");
    }
  } catch (e) {
    console.log("DB state lookup failed:", e);
  }

  // Fallback to cookie
  if (!codeVerifier) {
    try {
      const cookieStore = await cookies();
      const oauthStateCookie = cookieStore.get("oauth_state");
      if (oauthStateCookie?.value) {
        const parsed = JSON.parse(oauthStateCookie.value);
        if (parsed.state === state) {
          codeVerifier = parsed.codeVerifier;
          cookieStore.delete("oauth_state");
          console.log("OAuth state found in cookie");
        }
      }
    } catch {
      console.log("Failed to parse OAuth cookie");
    }
  }

  if (!codeVerifier) {
    throw new Error("OAuth state not found — please try signing in again");
  }

  const tokens = await client.authorizationCodeGrant(config, new URL(currentUrl), {
    pkceCodeVerifier: codeVerifier,
    expectedState: state,
  });

  const claims = tokens.claims();

  if (!claims) {
    throw new Error("No claims in token response");
  }

  const user: SessionUser = {
    id: claims.sub,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url as string) || null,
  };

  await authStorage.upsertUser({
    id: user.id,
    email: user.email || "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    avatarUrl: user.profileImageUrl,
  });

  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const token = await setSession(user, expiresAt);
  const replitAccessToken = (tokens.access_token as string | undefined) || null;

  return { user, token, replitAccessToken };
}

export async function getLogoutUrl(hostname: string): Promise<string> {
  const config = await getOidcConfig();
  try {
    const logoutUrl = client.buildEndSessionUrl(config, {
      client_id: getOidcClientId(),
      post_logout_redirect_uri: `https://${hostname}`,
    });
    return logoutUrl.href;
  } catch {
    return `https://${hostname}`;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}
