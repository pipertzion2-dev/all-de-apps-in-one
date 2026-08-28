/**
 * Single source of truth for crawl/index policy — used by robots.ts, audits, and middleware hints.
 * Public marketing routes stay crawlable by default; only private/system paths are blocked.
 */
export const ROBOTS_DISALLOW_PATHS = [
  "/dashboard",
  "/dashboard/*",
  "/marketing-hub",
  "/marketing-hub/*",
  "/api",
  "/api/*",
  "/_next",
  "/_next/*",
  "/gate",
  "/gate/*",
  "/admin",
  "/admin/*",
  "/play",
  "/play/*",
  "/playground",
  "/playground/*",
  "/test",
  "/badge",
  "/api-card",
  "/api-card/*",
  "/protect",
  "/protect/*",
  "/login",
  "/signup",
  "/clutety",
  "/clutety/*",
  "/pyracrypt",
  "/pyracrypt/*",
  "/clutter",
  "/clutter/*",
  "/clutety-shell",
  "/clutety-shell/*",
] as const;

/** Prefixes that should carry noindex metadata (without trailing wildcard). */
export const NOINDEX_PATH_PREFIXES = [
  "/dashboard",
  "/marketing-hub",
  "/api",
  "/gate",
  "/admin",
  "/play",
  "/playground",
  "/test",
  "/badge",
  "/api-card",
  "/protect",
  "/login",
  "/signup",
] as const;

export function isNoindexPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return NOINDEX_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isRobotsDisallowed(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  for (const rule of ROBOTS_DISALLOW_PATHS) {
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -2);
      if (path === prefix || path.startsWith(`${prefix}/`)) return true;
    } else if (path === rule) {
      return true;
    }
  }
  return false;
}
