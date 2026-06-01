/**
 * Paths and slugs that must not appear in sitemaps or SEO landing resolution.
 * Pyracrypt is a Svivva feature — canonical hub is /cyber-security-mini-apps.
 */
/** Canonical hubs — served via (seo)/[slug] and listed in static sitemap; skip duplicate DB rows only. */
export const HUB_SLUGS = new Set(["ai-tools-hub", "cyber-security-mini-apps", "seo-pack"]);

const LEGACY_BRAND_SLUGS = new Set([
  "pyracrypt",
  "clutety",
  "clutter",
  "clutety-shell",
  "clutety-coming-soon",
]);

const RESERVED_PATH_SLUGS = new Set([
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "security-sitemap.xml",
  "pyracrypt-sitemap.xml",
]);

/** Legacy Pyracrypt/Clutety brand URLs — 404 on (seo) routes; unpublish from DB. */
export function isLegacyBrandSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || LEGACY_BRAND_SLUGS.has(s)) return true;
  if (s.startsWith("pyracrypt-") || s.startsWith("pyracrypt/")) return true;
  if (s.startsWith("clutety-") || s.startsWith("clutety/")) return true;
  return false;
}

/** Skip duplicate sitemap rows (hubs already in static list) or block legacy/reserved paths. */
export function isNonIndexableSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || RESERVED_PATH_SLUGS.has(s)) return true;
  if (HUB_SLUGS.has(s)) return true;
  return isLegacyBrandSlug(s);
}

export const LEGACY_REDIRECT_PREFIXES = [
  "/pyracrypt",
  "/clutety",
  "/clutter",
  "/clutety-shell",
] as const;

/** First path segment from an absolute site URL (e.g. https://svivva.com/foo → foo). */
export function slugFromPublicUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, "");
    const segment = pathname.split("/").filter(Boolean)[0];
    return segment ? segment.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function isIndexablePublicUrl(url: string): boolean {
  const slug = slugFromPublicUrl(url);
  if (!slug) return true;
  return !isLegacyBrandSlug(slug);
}
