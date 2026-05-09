/**
 * Client-safe site URL (uses only NEXT_PUBLIC_SITE_URL).
 * Use in client components for Orbit copy, sitemap links, and instructions.
 */
const DEFAULT_SITE = "https://svivva.com";

function normalizeSiteUrl(raw: string): string {
  const t = raw.trim().replace(/\/$/, "");
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

export function getPublicSiteUrl(): string {
  const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim() : "";
  if (!env) return DEFAULT_SITE;
  return normalizeSiteUrl(env);
}

export function getPublicSiteHostname(): string {
  try {
    return new URL(getPublicSiteUrl()).hostname;
  } catch {
    return "svivva.com";
  }
}

export function getPublicSitemapUrl(): string {
  return `${getPublicSiteUrl()}/sitemap.xml`;
}

/**
 * Suggested apex domain for GoDaddy (skips localhost / 127.*). Uses NEXT_PUBLIC_SITE_URL first, then browser host.
 */
export function getSuggestedGoDaddyDomain(): string {
  const h = getPublicSiteHostname().replace(/^www\./, "");
  if (h && h !== "localhost" && !h.startsWith("127.")) return h;
  if (typeof window !== "undefined") {
    const wh = window.location.hostname.replace(/^www\./, "");
    if (wh && wh !== "localhost" && !wh.startsWith("127.")) return wh;
  }
  return "";
}
