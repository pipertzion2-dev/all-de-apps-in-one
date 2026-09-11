/**
 * Doorway-page patterns — multiple near-duplicate URLs per tool hurt rankings.
 * Keep one canonical slug per tool; exclude variants from sitemap and unpublish in repair.
 */

const VARIANT_SUFFIXES = ["-guide", "-alternative", "-online"] as const;
const VARIANT_PREFIXES = ["free-", "best-"] as const;

/** Slug is a thin duplicate of a canonical tool page (guide/free/best/alternative variants). */
export function isDuplicateSeoVariantSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s) return false;
  if (VARIANT_SUFFIXES.some((suffix) => s.endsWith(suffix))) return true;
  if (VARIANT_PREFIXES.some((prefix) => s.startsWith(prefix))) return true;
  return false;
}

/** Base slug for a variant (e.g. free-json-formatter → json-formatter). */
export function canonicalSlugFromVariant(slug: string): string {
  let s = slug.trim().toLowerCase();
  for (const prefix of VARIANT_PREFIXES) {
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length);
      break;
    }
  }
  for (const suffix of VARIANT_SUFFIXES) {
    if (s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length);
      break;
    }
  }
  return s.replace(/^-+|-+$/g, "");
}
