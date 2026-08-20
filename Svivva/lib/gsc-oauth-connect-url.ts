/** Canonical Google OAuth entry URL — not `/api/.../start` (iOS Safari downloads that as a file). */
export function gscOAuthConnectUrl(returnTo: string): string {
  const params = new URLSearchParams({ return: returnTo });
  return `/dashboard/gsc-connect/oauth?${params.toString()}`;
}
