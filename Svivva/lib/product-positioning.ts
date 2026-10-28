/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 * Homepage leads with Poor Man Protection; the desk cube is beta apps.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Homepage thesis — one job, one line (product name lives in the eyebrow). */
export const PRODUCT_HERO_HEADLINE = "Seal what you made.";

/** Product name — eyebrows, metadata suffix, and compact labels. */
export const PRODUCT_NAME_LINE = "Poor Man Protection";

/** Brand slogan — metadata and secondary lines (keep short; don’t restate the hero). */
export const PRODUCT_TAGLINE = "Timestamp, hash, and export a court-ready pack.";

/** One supporting sentence under the hero — disclaimer only, not a second pitch. */
export const PRODUCT_PROTECTION_PITCH =
  "Evidence you had it first — not a USPTO patent or Copyright Office registration.";

/** Applications block (below the hero) — focused section intro. */
export const HOMEPAGE_APPLICATIONS_TITLE = "What we ship";
export const HOMEPAGE_APPLICATIONS_SUBLINE = "Protection is the product. Desk apps are beta.";

/** Sap / tree metaphor — quiet work under the surface while you rest and grow. */
export const PRODUCT_SAP_METAPHOR =
  "Like sap in a tree, zzai zzai keeps creation and guardrails flowing underneath — so you can move, rest, and grow.";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "zzai zzai seals files with hashes and court packs so you can prove you made them first.";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL = "Seal your work. Spin the cube for beta desk apps.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE = "Seals and court packs for what you invent.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Seal it. Prove it.";

/** HowTo section — keep in sync with `HOMEPAGE_HOWTO_STEPS` in seo/schema/builders.ts */
export const HOMEPAGE_HOWTO_TITLE = "How it works";
export const HOMEPAGE_HOWTO_SUBLINE = "Upload → seal → export.";

/** Literal game ↔ product bridge (BALOON8 car×sneaker, Jordan 14 × Ferrari). */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "Protect first, then play — Poor Man Protection on the desk, BALOON8 on the walk.";

/** Intro walk-game face copy (name kept off the homepage). */
export const HOMEPAGE_GAME_FACE_TITLE = "Protect the BALOON8 on the walk";
export const HOMEPAGE_GAME_FACE_SUBLINE = "Keep the car×sneaker hybrid clean while you play free.";

/** Shown under the headline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE = "Seal your work. Explore beta apps below.";

/** Primary CTA — open the main product. */
export const HOMEPAGE_SCROLL_TO_PROTECTION = "Start sealing";
/** Public path for Poor Man Protection (canonical marketing URL). */
export const PRODUCT_PROTECTION_PATH = "/poor-man-protection";
/** From protection / beta — continue to the combined story / pricing face. */
export const HOMEPAGE_SCROLL_TO_COMBINED = "Scroll ↓ More";
/** From the combined face — back to beta apps. */
export const HOMEPAGE_SCROLL_TO_BETA_UP = "↑ Back to beta apps";
/** Continue to beta desk apps. */
export const HOMEPAGE_SCROLL_TO_BETA = "Scroll ↓ Beta apps";
/** @deprecated Not used on homepage — kept for lingering imports. */
export const HOMEPAGE_SCROLL_TO_MOVES = "Open Play";
/** @deprecated Not used on homepage — kept for lingering imports. */
export const HOMEPAGE_SCROLL_TO_GAME = "Play free";
/** From the intro walk game — back up to the combined story face. */
export const HOMEPAGE_SCROLL_TO_COMBINED_UP = "↑ Back to story";
/** @deprecated Use HOMEPAGE_SCROLL_TO_PROTECTION — kept for lingering imports. */
export const HOMEPAGE_SCROLL_TO_PLATFORM = HOMEPAGE_SCROLL_TO_PROTECTION;

/** @deprecated Title/subline no longer shown above the homepage desk cube. */
export const HOMEPAGE_BETA_CUBE_TITLE = "Beta apps";
export const HOMEPAGE_BETA_CUBE_SUBLINE = "Seeds, Orbit, and more — still in beta.";

/** Platform desk modules — Hybrid² / API / Pulse stay beta. */
export const CORE_PLATFORM_FEATURE_IDS = new Set<string>();

/** Homepage cube — only Play is GA; API and other faces are beta. */
export const CORE_CUBE_FACE_IDS = new Set<FeatureId>(["play"]);

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
    "/clean-sneaks",
    "/poor-man-protection",
    "/dashboard/poor-man-protection",
    "/protect",
    "/play",
    "/the-moves-like",
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
  // Main product — not beta.
  if (path === "/poor-man-protection" || path.startsWith("/poor-man-protection/")) return false;
  if (path.startsWith("/dashboard/poor-man-protection")) return false;
  if (path.startsWith("/protect")) return false;
  if (path === "/play" || path.startsWith("/play/")) return false;
  if (path.startsWith("/the-moves-like")) return false;
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
  if (path.startsWith("/lp/")) return true;

  if (!path.startsWith("/dashboard")) return false;
  if (path === "/dashboard") return false;
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
