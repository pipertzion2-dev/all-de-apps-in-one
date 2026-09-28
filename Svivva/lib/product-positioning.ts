/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "ZZAI is Hybrid² for AI products — fuse two modules into one shippable feature, keep every fusion Klean in production, and play the car×sneaker colorway loop in Klean Sneaks.";

export const PRODUCT_TAGLINE = "Keep what you ship Klean";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Hybrid² Lab fuses any two ZZAI channels into one deployable product (H¹, then H²). API Builder and Pulse keep that hybrid Klean — hazard preview, live schema, one-click rollback.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Fuse modules on the Hybrid bus, then keep the ship Klean on Signal — hazard preview, schema, rollback.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Hybrid² AI modules, keep fusions Klean, demo in Sneaks.";

/** Literal game ↔ product bridge (BALOON8 car×sneaker, Jordan 14 × Ferrari). */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "One car×sneaker chassis (BALOON8), many unlockable colorways — the same H¹ silhouette, different finishes, like Hybrid² on the desk.";

/** First homepage panel — Klean Sneaks (not the product dashboard). */
export const HOMEPAGE_GAME_FACE_TITLE = "Game · Klean Sneaks";
export const HOMEPAGE_GAME_FACE_SUBLINE =
  "BALOON8 car×sneaker — one chassis, unlockable colorways. Swipe down for the Hybrid² desk.";

/** Shown under the tagline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "Hybrid² desk — fuse channels, keep fusions Klean, ship on Signal.";

export const HOMEPAGE_SCROLL_TO_PLATFORM = "Swipe down · ZZAI platform";
export const HOMEPAGE_SCROLL_TO_GAME = "Swipe up · Klean Sneaks game";

/** Platform channel strips that ship today (not beta). */
export const CORE_PLATFORM_FEATURE_IDS = new Set([
  "hybridization",
  "api-builder",
  "projects",
  "pulse",
]);

/** Homepage cube faces that are GA (Play = Klean Sneaks demo). */
export const CORE_CUBE_FACE_IDS = new Set<FeatureId>(["api", "play"]);

function normalizePath(pathname: string): string {
  const p = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (p !== "/" && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}

function isCoreProductPath(path: string): boolean {
  if (path === "/" || path === "/dashboard") return true;
  const corePrefixes = [
    "/about",
    "/signup",
    "/login",
    "/contact",
    "/privacy",
    "/terms",
    "/lp/ai-api-builder",
    "/clean-sneaks",
    "/dashboard/projects",
    "/dashboard/hybrid-lab",
    "/dashboard/api-builder",
    "/dashboard/pulse",
    "/dashboard/settings",
    "/dashboard/billing",
    "/dashboard/finish-setup",
  ];
  return corePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isCorePlatformFeatureId(id: string): boolean {
  return CORE_PLATFORM_FEATURE_IDS.has(id);
}

export function isBetaPlatformFeatureId(id: string): boolean {
  return !isCorePlatformFeatureId(id);
}

export function isBetaCubeFaceId(id: FeatureId): boolean {
  return !CORE_CUBE_FACE_IDS.has(id);
}

/** True when this href should show a Beta label (dashboard nav, explore links, etc.). */
export function isBetaHref(href: string): boolean {
  const path = normalizePath(href);
  if (path === "/play") return true;
  if (path.startsWith("/tools")) return true;
  if (path.startsWith("/ai-tools-hub")) return true;
  if (path.startsWith("/cyber-security-mini-apps")) return true;
  if (path.startsWith("/marketing-hub")) return true;
  if (path.startsWith("/pyracrypt")) return true;
  if (path.startsWith("/clutety")) return true;
  if (path.startsWith("/events")) return true;
  if (path.startsWith("/orbit")) return true;
  if (path.startsWith("/seeds")) return true;
  if (path.startsWith("/seo-pack")) return true;
  if (path === "/#oaas" || path === "#oaas") return true;

  if (!path.startsWith("/dashboard")) return false;
  if (path === "/dashboard") return false;
  if (path.startsWith("/dashboard/hybrid-lab")) return false;
  if (path.startsWith("/dashboard/projects")) return false;
  if (path.startsWith("/dashboard/api-builder")) return false;
  if (path.startsWith("/dashboard/pulse")) return false;
  if (path.startsWith("/dashboard/settings")) return false;
  if (path.startsWith("/dashboard/billing")) return false;
  return true;
}

/** Full-width beta notice on non-core product surfaces. */
export function isBetaSurfacePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path.startsWith("/api/")) return false;
  if (isCoreProductPath(path)) return false;
  return isBetaHref(path);
}
