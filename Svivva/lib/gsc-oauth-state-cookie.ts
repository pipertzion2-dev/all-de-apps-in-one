import crypto from "crypto";
import { cookies } from "next/headers";

export const GSC_OAUTH_STATE_COOKIE = "gsc_oauth_pkce";

export type GscOAuthStatePayload = {
  state: string;
  codeVerifier: string;
  redirectAfter: string;
  callbackBase: string;
  exp: number;
};

function signingSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.ORBIT_INTERNAL_SECRET?.trim() ||
    "gsc-oauth-state-dev"
  );
}

function encodePayload(payload: GscOAuthStatePayload): string {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", signingSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function decodePayload(raw: string): GscOAuthStatePayload | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = crypto.createHmac("sha256", signingSecret()).update(body).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GscOAuthStatePayload;
    if (!payload.state || !payload.codeVerifier || !payload.callbackBase) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function gscOAuthStateCookieOptions(expiresAt: Date) {
  const maxAge = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

/** Persist PKCE + redirect metadata in a signed httpOnly cookie (no DB table required). */
export async function saveGscOAuthState(payload: {
  state: string;
  codeVerifier: string;
  redirectAfter: string;
  callbackBase: string;
  expiresAt: Date;
}): Promise<void> {
  const store = await cookies();
  const value = encodePayload({
    state: payload.state,
    codeVerifier: payload.codeVerifier,
    redirectAfter: payload.redirectAfter,
    callbackBase: payload.callbackBase,
    exp: payload.expiresAt.getTime(),
  });
  store.set(GSC_OAUTH_STATE_COOKIE, value, gscOAuthStateCookieOptions(payload.expiresAt));
}

/** Load OAuth state if the callback `state` matches the signed cookie. */
export async function consumeGscOAuthState(state: string): Promise<GscOAuthStatePayload | null> {
  const store = await cookies();
  const raw = store.get(GSC_OAUTH_STATE_COOKIE)?.value;
  if (!raw) return null;
  const payload = decodePayload(raw);
  store.delete(GSC_OAUTH_STATE_COOKIE);
  if (!payload || payload.state !== state) return null;
  return payload;
}
