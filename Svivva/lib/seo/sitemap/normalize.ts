/** Normalize sitemap locs: canonical production host, no query/hash, no trailing slash except root. */
export function normalizeSitemapUrl(url: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  try {
    const parsed = new URL(url, `${base}/`);
    const canonical = new URL(`${base}/`);
    parsed.protocol = canonical.protocol;
    parsed.hostname = canonical.hostname;
    parsed.port = canonical.port;
    parsed.hash = "";
    parsed.search = "";
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }
    if (parsed.pathname === "/") return `${base}/`;
    return `${base}${parsed.pathname}`;
  } catch {
    const path = url.startsWith("/") ? url : `/${url}`;
    const normalizedPath = path !== "/" && path.endsWith("/") ? path.replace(/\/+$/, "") : path;
    return normalizedPath === "/" ? `${base}/` : `${base}${normalizedPath}`;
  }
}

export function dedupeSitemapUrls<T extends { url: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const entry of entries) {
    const key = entry.url.replace(/\/$/, "") || entry.url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}
