/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 * Homepage leads with Poor Man Protection; the spinning menu holds other beta tools.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Scale-style homepage thesis — one clear job for the whole page. */
export const PRODUCT_HERO_HEADLINE = "Seal what you made — prove it was yours first.";

/** Product name — eyebrows, metadata suffix, and compact labels. */
export const PRODUCT_NAME_LINE = "Poor Man Protection";

/** Brand slogan — metadata and secondary hero line. */
export const PRODUCT_TAGLINE =
  "Poor Man Protection — timestamp, seal, and download proof you can share.";

/** Desk tool pitch — primary homepage product. */
export const PRODUCT_PROTECTION_PITCH =
  "Timestamp your files, seal them with a secure fingerprint, and download proof you can share. This is supporting evidence that you had it first — not a government patent or copyright registration.";

/** Applications block (below the hero) — focused section intro. */
export const HOMEPAGE_APPLICATIONS_TITLE = "Protection first. Extra tools on the menu.";
export const HOMEPAGE_APPLICATIONS_SUBLINE =
  "zzai zzai focuses on Poor Man Protection. Spin the homepage menu for other beta tools — turn a brief into apps, grow search traffic, and more.";

/** Sap / tree metaphor — quiet work under the surface while you rest and grow. */
export const PRODUCT_SAP_METAPHOR =
  "Like sap in a tree, zzai zzai keeps creation and safety checks flowing underneath — so you can move, rest, and grow.";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "zzai zzai helps you prove you made something first — seal sketches and files, then download shareable proof. Other tools live on a spinning homepage menu (still in beta).";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Open Poor Man Protection to seal what you made, then spin the menu for other beta tools.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Seal and timestamp what you invent, download proof you can share — then try other beta tools on the menu.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Seal it. Prove it. Protect it.";

/** HowTo section — keep in sync with `HOMEPAGE_HOWTO_STEPS` in seo/schema/builders.ts */
export const HOMEPAGE_HOWTO_TITLE = "How Poor Man Protection works";
export const HOMEPAGE_HOWTO_SUBLINE =
  "Four steps from upload to sealed, shareable proof — the main focus of zzai zzai.";

/** Literal game ↔ product bridge. */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "Protect first, then explore — seal your work, then try other beta tools on the menu.";

/** Last homepage panel — game / walk face (no product brand name in copy). */
export const HOMEPAGE_GAME_FACE_TITLE = "Play free";
export const HOMEPAGE_GAME_FACE_SUBLINE = "Keep your sneaker clean while you play.";

/** Shown under the headline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "Open Poor Man Protection — seal your work, then explore other beta tools on the menu.";

/** Primary CTA — open the main product. */
export const HOMEPAGE_SCROLL_TO_PROTECTION = "Open Poor Man Protection";
/** Public path for Poor Man Protection (canonical marketing URL). */
export const PRODUCT_PROTECTION_PATH = "/poor-man-protection";
/** From protection / beta — continue to the combined story / pricing face. */
export const HOMEPAGE_SCROLL_TO_COMBINED = "More";
/** From the combined face — back to beta apps. */
export const HOMEPAGE_SCROLL_TO_BETA_UP = "Back";
/** From the white game face — fine-flip wrap back to beta apps. */
export const HOMEPAGE_SCROLL_WRAP_TO_FIRST = "Back to start";
/** Continue to beta desk apps. */
export const HOMEPAGE_SCROLL_TO_BETA = "Scroll ↓ More tools";
/** @deprecated Not used on homepage — kept for lingering imports. */
export const HOMEPAGE_SCROLL_TO_MOVES = "Open Play";
/** After the story face — continue to the white game face. */
export const HOMEPAGE_SCROLL_TO_GAME = "Continue to game";
/** From the game face — back up to the combined story face. */
export const HOMEPAGE_SCROLL_TO_COMBINED_UP = "↑ Back to story";
/** @deprecated Use HOMEPAGE_SCROLL_TO_PROTECTION — kept for lingering imports. */
export const HOMEPAGE_SCROLL_TO_PLATFORM = HOMEPAGE_SCROLL_TO_PROTECTION;

/** Beta apps face — the cube is the beta menu, not the main product. */
export const HOMEPAGE_BETA_CUBE_TITLE = "More tools (beta)";
export const HOMEPAGE_BETA_CUBE_SUBLINE =
  "Spin the menu for beta tools: turn a brief into apps, grow search traffic, and more.";

/** Platform desk modules — Hybrid² / API / Pulse stay beta. */
export const CORE_PLATFORM_FEATURE_IDS = new Set<string>();

/** Homepage cube — only Game is GA; API and other faces are beta. */
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
