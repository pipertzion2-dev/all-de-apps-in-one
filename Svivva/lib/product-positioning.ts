/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Scale-style homepage thesis — one clear job for the whole page. */
export const PRODUCT_HERO_HEADLINE =
  "Every creative dispute starts with one question: who had it first.";

/** Product name — eyebrows, metadata suffix, and compact labels. */
export const PRODUCT_NAME_LINE = "Poor Man Protection";

/** Brand slogan — metadata and secondary hero line. */
export const PRODUCT_TAGLINE = "Poor Man Protection — prove what you created, and when.";

/** Court-ready protection — plain language for homepage and meta. */
export const PRODUCT_PROTECTION_PITCH =
  "Timestamp your files, seal them with cryptographic hashes, and export a court-ready pack. Supporting evidence of anteriority — not a USPTO patent or Copyright Office registration.";

/** Applications block (below the hero) — Scale-style focused section intro. */
export const HOMEPAGE_APPLICATIONS_TITLE = "The proof layer for what you create.";
export const HOMEPAGE_APPLICATIONS_SUBLINE =
  "Upload once, seal with hashes, verify at a public link, and download a structured court pack when priority matters.";

/** Sap / tree metaphor — quiet work under the surface while you rest and grow. */
export const PRODUCT_SAP_METAPHOR =
  "Like sap in a tree, zzai zzai keeps protection and guardrails flowing underneath — so you can rest, focus on design, and grow.";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "zzai zzai leads with Poor Man Protection — timestamped seals, public verify links, and court-ready packs for sketches, designs, and code. Klean Sneaks is the free demo; other desk tools are beta.";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Seal work in Poor Man Protection, verify hashes in the browser, and download a court pack when you need to show priority — before you spend on formal registration.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Upload, seal, verify — an evidentiary workflow for creators who need a defensible record.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Seal work. Verify anywhere. Export a court pack.";

/** HowTo section — keep in sync with `HOMEPAGE_HOWTO_STEPS` in seo/schema/builders.ts */
export const HOMEPAGE_HOWTO_TITLE = "How Poor Man Protection works";
export const HOMEPAGE_HOWTO_SUBLINE =
  "Four steps from upload to a verify link — no lawyer required to start a defensible record.";

/** Literal game ↔ product bridge (BALOON8 car×sneaker, Jordan 14 × Ferrari). */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "One car×sneaker chassis (BALOON8), many unlockable colorways — the same H¹ silhouette, different finishes, like Hybrid² on the desk.";

/** First homepage panel — Klean Sneaks (demo of the same protection story). */
export const HOMEPAGE_GAME_FACE_TITLE = "Play the demo";
export const HOMEPAGE_GAME_FACE_SUBLINE =
  "Klean Sneaks — free on the walk. Same “protect what you made” idea as Poor Man Protection.";

/** Shown under the headline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "Seal uploads, verify hashes in the browser, export a court pack when you need proof.";

export const HOMEPAGE_SCROLL_TO_PLATFORM = "Swipe ↓ Poor Man Protection";
export const HOMEPAGE_SCROLL_TO_GAME = "Swipe ↑ Klean Sneaks demo";

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
