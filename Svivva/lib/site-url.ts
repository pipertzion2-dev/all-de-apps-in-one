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
export function getBillingOriginFromRequest(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:5000";
  const protocol = host.includes("localhost") ? "http" : "https";
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
