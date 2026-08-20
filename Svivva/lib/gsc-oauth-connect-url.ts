/** Google account that owns Search Console for this site (login_hint for OAuth). */
export const GSC_OAUTH_LOGIN_HINT =
  process.env.NEXT_PUBLIC_GSC_OAUTH_EMAIL?.trim() || "pipertzion2@gmail.com";

/** Canonical Google OAuth entry URL — not `/api/.../start` (iOS Safari downloads that as a file). */
export function gscOAuthConnectUrl(returnTo: string, email?: string): string {
  const params = new URLSearchParams({ return: returnTo });
  const hint = (email?.trim() || GSC_OAUTH_LOGIN_HINT).trim();
  if (hint) params.set("email", hint);
  return `/dashboard/gsc-connect/oauth?${params.toString()}`;
}
