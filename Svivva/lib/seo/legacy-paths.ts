/**
 * Paths and slugs that must not appear in sitemaps or SEO landing resolution.
 * Pyracrypt is a Svivva feature — canonical hub is /cyber-security-mini-apps.
 */
const EXACT_SLUGS = new Set([
  "pyracrypt",
  "clutety",
  "clutter",
  "clutety-shell",
  "clutety-coming-soon",
  "ai-tools-hub",
  "cyber-security-mini-apps",
  "seo-pack",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "security-sitemap.xml",
  "pyracrypt-sitemap.xml",
]);

/** Legacy brand slugs or reserved platform paths — exclude from indexable URL lists. */
export function isNonIndexableSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || EXACT_SLUGS.has(s)) return true;
  if (s.startsWith("pyracrypt-") || s.startsWith("pyracrypt/")) return true;
  if (s.startsWith("clutety-") || s.startsWith("clutety/")) return true;
  return false;
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
  return !isNonIndexableSlug(slug);
}
