/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 * Homepage leads with The Moves Like; Poor Man Protection remains a desk tool.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Scale-style homepage thesis — one clear job for the whole page. */
export const PRODUCT_HERO_HEADLINE = "Make god moves — explore, learn, and play on your phone.";

/** Product name — eyebrows, metadata suffix, and compact labels. */
export const PRODUCT_NAME_LINE = "The Moves Like";

/** Brand slogan — metadata and secondary hero line. */
export const PRODUCT_TAGLINE =
  "The Moves Like — make god moves: explore, learn, transform, play, and share.";

/** Desk tool pitch — still available, no longer the homepage lead. */
export const PRODUCT_PROTECTION_PITCH =
  "Timestamp your files, seal them with cryptographic hashes, and export a court-ready pack. Supporting evidence of anteriority — not a USPTO patent or Copyright Office registration.";

/** Applications block (below the hero) — focused section intro. */
export const HOMEPAGE_APPLICATIONS_TITLE = "Movement first. Desk tools when you need them.";
export const HOMEPAGE_APPLICATIONS_SUBLINE =
  "The Moves Like is the center of zzai zzai — practice with your front camera, build routines, and clash styles. Poor Man Protection and the rest of the desk stay one tap away.";

/** Sap / tree metaphor — quiet work under the surface while you rest and grow. */
export const PRODUCT_SAP_METAPHOR =
  "Like sap in a tree, zzai zzai keeps creation and guardrails flowing underneath — so you can move, rest, and grow.";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "zzai zzai leads with The Moves Like — make god moves on camera, then carry that same energy into Klean Sneaks on the walk. Poor Man Protection and the builder desk stay on the same domain.";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Open The Moves Like, practice god moves with your front camera, then take the same fire into Klean Sneaks — and seal what you made with Poor Man Protection when you need proof.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Front-camera practice for god moves — then the same heat in Klean Sneaks on the street.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Make god moves. Practice. Play. Share.";

/** HowTo section — keep in sync with `HOMEPAGE_HOWTO_STEPS` in seo/schema/builders.ts */
export const HOMEPAGE_HOWTO_TITLE = "How The Moves Like works";
export const HOMEPAGE_HOWTO_SUBLINE =
  "Four steps from Discover to a shared take — built for your phone’s front camera.";

/** Literal game ↔ product bridge (BALOON8 car×sneaker, Jordan 14 × Ferrari). */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "God moves in two arenas — The Moves Like on camera, Klean Sneaks on the BALOON8 walk. Same H¹ heat, different finishes.";

/** Last homepage panel — Klean Sneaks (god-moves playground after The Moves Like). */
export const HOMEPAGE_GAME_FACE_TITLE = "Make god moves on the walk";
export const HOMEPAGE_GAME_FACE_SUBLINE =
  "Klean Sneaks — same god-move energy as The Moves Like. Protect the BALOON8 while you play free.";

/** Shown under the headline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "Open The Moves Like — practice god moves, record, and clash from your phone.";

/** From The Moves Like — continue to beta desk apps. */
export const HOMEPAGE_SCROLL_TO_BETA = "Scroll ↓ Beta apps";
/** From beta apps — back to The Moves Like. */
export const HOMEPAGE_SCROLL_TO_MOVES = "↑ Back to The Moves Like";
/** From beta apps — continue to the combined story / pricing face. */
export const HOMEPAGE_SCROLL_TO_COMBINED = "Scroll ↓ More";
/** From the combined face — back to beta apps. */
export const HOMEPAGE_SCROLL_TO_BETA_UP = "↑ Back to beta apps";
/** From the combined face — down to Klean Sneaks (last face). */
export const HOMEPAGE_SCROLL_TO_GAME = "Scroll ↓ Klean Sneaks";
/** From Klean Sneaks — back up to the combined story face. */
export const HOMEPAGE_SCROLL_TO_COMBINED_UP = "↑ Back to story";
/** @deprecated Use HOMEPAGE_SCROLL_TO_MOVES — kept for any lingering imports. */
export const HOMEPAGE_SCROLL_TO_PLATFORM = HOMEPAGE_SCROLL_TO_MOVES;

/** Platform desk modules — Klean Sneaks ships; Hybrid² / API / Pulse stay beta. */
export const CORE_PLATFORM_FEATURE_IDS = new Set<string>();

/** Homepage cube — only Play (Klean Sneaks) is GA; API and other faces are beta. */
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
  if (path === "/play") return true;
  // The Moves Like is the homepage lead product — not beta.
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
