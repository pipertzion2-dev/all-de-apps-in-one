const GSC_OAUTH_EMAIL_DEFAULT = "pipertzion2@gmail.com";

/** Client bundle — NEXT_PUBLIC only. Server code should use resolveGscOAuthLoginHint(). */
export const GSC_OAUTH_LOGIN_HINT =
  process.env.NEXT_PUBLIC_GSC_OAUTH_EMAIL?.trim() || GSC_OAUTH_EMAIL_DEFAULT;

/**
 * Canonical Search Console owner for OAuth login_hint.
 * Never use the ZZAI app session email here — that reverts to the wrong Google account.
 */
export function resolveGscOAuthLoginHint(explicit?: string | null): string {
  return (
    explicit?.trim() ||
    process.env.GSC_OAUTH_LOGIN_HINT?.trim() ||
    process.env.NEXT_PUBLIC_GSC_OAUTH_EMAIL?.trim() ||
    GSC_OAUTH_EMAIL_DEFAULT
  );
}

export function isCanonicalGscOAuthEmail(email: string | null | undefined): boolean {
  const expected = resolveGscOAuthLoginHint().toLowerCase();
  const actual = email?.trim().toLowerCase();
  return !!actual && actual === expected;
}

/** Canonical OAuth entry — real Next.js page `/connect` (safe on iOS Safari). */
export function gscOAuthConnectUrl(returnTo: string, email?: string): string {
  const params = new URLSearchParams({ return: returnTo });
  const hint = resolveGscOAuthLoginHint(email);
  if (hint) params.set("email", hint);
  return `/dashboard/gsc-connect/connect?${params.toString()}`;
}
