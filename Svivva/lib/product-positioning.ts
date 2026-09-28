/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "ZZAI keeps the AI features you ship Klean in production — preview hazards before deploy, enforce schema live, and rollback in one click when quality drops.";

export const PRODUCT_TAGLINE = "Keep what you ship Klean";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Production guardrails for AI APIs: catch bad outputs before users do, enforce JSON Schema on every response, and roll back fast when a deploy scuffs.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Ship AI endpoints that stay Klean — hazard preview, live schema, one-click rollback.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Guard AI APIs: preview hazards, enforce schema, roll back.";

/** First homepage panel — Klean Sneaks (not the product dashboard). */
export const HOMEPAGE_GAME_FACE_TITLE = "Game · Klean Sneaks";
export const HOMEPAGE_GAME_FACE_SUBLINE =
  "Playable demo only — not the API dashboard. Swipe down for the ZZAI platform.";

/** Shown under the tagline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "ZZAI platform — APIs, projects, Pulse, and pricing. Not the Klean Sneaks game.";

export const HOMEPAGE_SCROLL_TO_PLATFORM = "Swipe ↓ ZZAI platform";
export const HOMEPAGE_SCROLL_TO_GAME = "Swipe ↓ Klean Sneaks game";

/** Platform channel strips that ship today (not beta). */
export const CORE_PLATFORM_FEATURE_IDS = new Set(["api-builder", "projects", "pulse"]);

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
