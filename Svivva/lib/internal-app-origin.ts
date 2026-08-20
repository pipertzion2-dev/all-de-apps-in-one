/**
 * Base URL for server-side calls back into this app (cron, dev scheduler, growth tasks).
 * Set INTERNAL_APP_ORIGIN in production if NEXT_PUBLIC_SITE_URL is a marketing domain
 * and API routes must hit a different host (rare).
 */
export function getInternalAppOrigin(): string {
  const explicit = process.env.INTERNAL_APP_ORIGIN?.replace(/\/$/, "");
  if (explicit) return explicit;

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      return new URL(site.startsWith("http") ? site : `https://${site}`).origin;
    } catch {
      /* fall through */
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const port = process.env.PORT || "5000";
  return `http://127.0.0.1:${port}`;
}
