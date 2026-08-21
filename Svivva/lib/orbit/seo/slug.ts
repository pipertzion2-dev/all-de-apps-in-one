/** SEO-friendly slug helpers for Orbit public apps. */

export function slugifyMiniAppName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export function publicAppPath(slug: string): string {
  return `/apps/${slugifyMiniAppName(slug)}`;
}

export function publicAppUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}${publicAppPath(slug)}`;
}

export function isValidPublicAppSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}
