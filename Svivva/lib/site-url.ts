import type { NextRequest } from "next/server";

/** Canonical public site URL for server-side code (sitemaps, pings, Orbit, APIs). */
const DEFAULT_SITE = "https://svivva.com";

function normalizeSiteUrl(raw: string): string {
  const t = raw.trim().replace(/\/$/, "");
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!env) return DEFAULT_SITE;
  return normalizeSiteUrl(env);
}

export function getSiteHostname(): string {
  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return "svivva.com";
  }
}

export function getSitemapUrl(): string {
  return `${getSiteUrl()}/sitemap.xml`;
}

export function getPyracryptSitemapUrl(): string {
  return `${getSiteUrl()}/pyracrypt-sitemap.xml`;
}

/** GSC URL Inspection deep link prefix for domain properties */
export function getGoogleSearchConsoleInspectBase(): string {
  const host = getSiteHostname();
  return `https://search.google.com/search-console/inspect?resource_id=sc-domain:${host}&id=`;
}

/** Stripe Checkout / Billing Portal return URLs — prefers NEXT_PUBLIC_SITE_URL when set. */
function isLikelyLocalDevHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() || "";
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

export function getBillingOriginFromRequest(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:5000";
  const protocol = isLikelyLocalDevHost(host) ? "http" : "https";
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured.startsWith("http") ? configured : `https://${configured}`).origin;
    } catch {
      /* fall through */
    }
  }
  return `${protocol}://${host}`;
}
