/**
 * Dashboard routes reachable without a user session (admin code or public feature browse).
 * Used by middleware (server redirect) and dashboard layout (client gate).
 */

/** Admin surfaces that show AdminCodeForm first — not the sign-in wall. */
export const ADMIN_CODE_FIRST_PREFIXES = ["/dashboard/burns", "/dashboard/gsc-connect"] as const;

/** Public product / Orbit routes (homepage cube + launchpad). */
export const DASHBOARD_PUBLIC_PREFIXES = [
  "/play",
  "/seeds",
  "/dashboard/orbit",
  "/dashboard/launchpad",
  "/dashboard/poor-man-protection",
  "/dashboard/education-advocacy",
  "/dashboard/api-builder",
  "/dashboard/hardware-builder",
  "/education/verify",
  "/protect/verify",
] as const;

export const DASHBOARD_GUEST_PREFIXES = [
  ...DASHBOARD_PUBLIC_PREFIXES,
  ...ADMIN_CODE_FIRST_PREFIXES,
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAdminCodeFirstPath(pathname: string): boolean {
  return ADMIN_CODE_FIRST_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isDashboardGuestPath(pathname: string): boolean {
  return DASHBOARD_GUEST_PREFIXES.some((p) => matchesPrefix(pathname, p));
}
