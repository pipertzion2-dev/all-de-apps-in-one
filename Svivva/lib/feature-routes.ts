import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import {
  DASHBOARD_PUBLIC_PREFIXES,
  isAdminCodeFirstPath,
  isDashboardGuestPath,
} from "@/lib/dashboard-guest-paths";

export { isAdminCodeFirstPath, isDashboardGuestPath };

/** Public landing routes for each cube face — no account required to browse. */
export const FEATURE_PUBLIC_PATHS: Record<FeatureId, string> = {
  play: "/play",
  seeds: "/seeds",
  orbit: "/dashboard/orbit",
  security: "/dashboard/poor-man-protection",
  api: "/dashboard/api-builder",
  hardware: "/dashboard/hardware-builder",
};

const PUBLIC_PREFIXES = [...DASHBOARD_PUBLIC_PREFIXES];

/** Dashboard + product routes guests can open from the homepage cube. */
export function isPublicFeaturePath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function featureTitleFromPath(pathname: string): string {
  if (pathname.startsWith("/play")) return "ZZAI Play";
  if (pathname.startsWith("/seeds")) return "ZZAI Seeds";
  if (pathname.startsWith("/dashboard/orbit") || pathname.startsWith("/dashboard/launchpad")) {
    return "Marketing Orbit";
  }
  if (pathname.startsWith("/dashboard/burns")) return "Burns System";
  if (pathname.startsWith("/dashboard/gsc-connect")) return "Google Search Console";
  if (pathname.startsWith("/dashboard/security")) return "Security Center";
  if (pathname.startsWith("/dashboard/poor-man-protection")) return "Poor Man Protection";
  if (pathname.startsWith("/dashboard/education-advocacy")) return "Education Advocacy";
  if (pathname.startsWith("/education/verify")) return "Verify Education Proof";
  if (pathname.startsWith("/protect/verify")) return "Verify Protection";
  if (pathname.startsWith("/dashboard/api-builder")) return "Digital";
  if (pathname.startsWith("/dashboard/hardware-builder")) return "Hardware Builder";
  return "zzai zzai";
}
