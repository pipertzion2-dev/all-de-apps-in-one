/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Brand slogan — homepage hero and metadata. */
export const PRODUCT_TAGLINE = "Let zzai zzai protect your assets. Rest assured!";

/** Court-ready protection + crypto attestation for creators. */
export const PRODUCT_PROTECTION_PITCH =
  "Seal your ideas with timestamps, hashes, and blockchain-ready evidence — so if you ever need court, the record is valid.";

/** Sap / tree metaphor — quiet work under the surface while you rest and grow. */
export const PRODUCT_SAP_METAPHOR =
  "Like sap in a tree, zzai zzai keeps protection and guardrails flowing underneath — so you can rest, focus on design, and grow.";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "zzai zzai protects your assets — sneakers in Klean Sneaks, sketches and fashion ideas via blockchain-ready proof — with Hybrid² tools when you ship to production.";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Protect what you create — from BALOON8 colorways to Poor Man Protection court packs — then fuse modules in Hybrid² Lab when you are ready to ship.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Fashion, sneakers, and ideas — sealed, timestamped, and rest-assured with our protection coin.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Rest. Let sap run. Hybrid² AI + free Sneaks demo.";

/** Literal game ↔ product bridge (BALOON8 car×sneaker, Jordan 14 × Ferrari). */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "One car×sneaker chassis (BALOON8), many unlockable colorways — the same H¹ silhouette, different finishes, like Hybrid² on the desk.";

/** First homepage panel — Klean Sneaks (not the product dashboard). */
export const HOMEPAGE_GAME_FACE_TITLE = "Game · Klean Sneaks";
export const HOMEPAGE_GAME_FACE_SUBLINE =
  "Protect your kicks on the walk — Klean Sneaks is the free demo of keeping sneaker assets Klean.";

/** Shown under the tagline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "Bed Stuy Vybez × zzai zzai — protect ideas with crypto-backed evidence you can bring to court.";

export const HOMEPAGE_SCROLL_TO_PLATFORM = "Swipe ↓ ZZAI platform";
export const HOMEPAGE_SCROLL_TO_GAME = "Swipe ↓ Klean Sneaks game";

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
