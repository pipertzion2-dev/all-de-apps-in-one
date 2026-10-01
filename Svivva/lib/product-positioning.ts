/**
 * Canonical product story for zzai zzai — homepage, metadata, and beta labeling.
 */

import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Brand slogan — homepage hero and metadata. */
export const PRODUCT_TAGLINE = "Poor Man Protection — prove what you created, and when.";

/** Court-ready protection — plain language for homepage and meta. */
export const PRODUCT_PROTECTION_PITCH =
  "Poor Man Protection timestamps your files, seals them with cryptographic hashes, and exports a court-ready pack. Supporting evidence of anteriority — not a USPTO patent or Copyright Office registration.";

/** Homepage section — headline for poor-man vs physical envelope / USPTO contrast. */
export const POOR_MAN_VS_PATENT_HEADLINE =
  "Why Poor Man Protection beats a stamped envelope — and what makes it unique";

/** One paragraph under the headline (homepage explainer). */
export const POOR_MAN_VS_PATENT_LEDE =
  "The classic “poor man’s patent” is a sealed envelope you mail yourself. That postmark helps, but it is slow, easy to challenge, and blind to the actual bytes inside. ZZAI keeps the same anteriority goal — prove you had the work first — with hashes anyone can verify, a structured court pack, and dual-axis metadata no envelope can carry.";

export type PoorManComparisonRow = {
  label: string;
  physicalEnvelope: string;
  usptoPatent: string;
  zzaiPoorMan: string;
};

/** Three-way contrast for homepage (crawlable text). */
export const POOR_MAN_COMPARISON_ROWS: readonly PoorManComparisonRow[] = [
  {
    label: "Time to evidence",
    physicalEnvelope: "Days for mail + postmark",
    usptoPatent: "Often years of examination",
    zzaiPoorMan: "Minutes — seal, timestamp, download pack",
  },
  {
    label: "Cost to start",
    physicalEnvelope: "Postage + printing",
    usptoPatent: "Thousands in fees and attorney time",
    zzaiPoorMan: "Seal on zzai zzai before you spend on formal filing",
  },
  {
    label: "Tamper detection",
    physicalEnvelope: "Envelope can be opened or re-sealed — contents disputed",
    usptoPatent: "Office file, not a live hash of your source files",
    zzaiPoorMan: "SHA-256 content seals — change a pixel, the hash breaks",
  },
  {
    label: "Independent verify",
    physicalEnvelope: "Third parties must trust your unopened package",
    usptoPatent: "Public record after grant — not instant for drafts",
    zzaiPoorMan: "Anyone checks /protect/verify without signing in",
  },
  {
    label: "What judges see",
    physicalEnvelope: "Postmark + your testimony about what was inside",
    usptoPatent: "Claims and prosecution history after filing",
    zzaiPoorMan: "Court PDF, custody log, dual-axis hybridization notes",
  },
] as const;

export type PoorManUniquePoint = {
  title: string;
  body: string;
};

/** Only-on-ZZAI differentiators (not generic timestamping). */
export const POOR_MAN_UNIQUE_POINTS: readonly PoorManUniquePoint[] = [
  {
    title: "Dual-axis scientific hybridization",
    body: "Form composition (axis A) and spectral palette (axis B) are coupled into one prior-art fingerprint — not just a file hash with a date.",
  },
  {
    title: "Group patent organizer",
    body: "Drop many figure images; ZZAI families them, builds a Merkle root, and exports a multi-sheet disclosure schedule for design-heavy work.",
  },
  {
    title: "Chain of custody you can export",
    body: "Structured JSON certificate plus court pack PDF — built for disputes, not a shoebox of mail.",
  },
  {
    title: "Optional postal reinforcement",
    body: "Still want paper? Print the postal sheet and mail an opaque envelope — the digital seal remains the verifiable anchor.",
  },
] as const;

/** Required honesty line — pair with comparison section. */
export const POOR_MAN_LEGAL_FOOTNOTE =
  "Poor Man Protection is supporting evidence of anteriority and possession — not a registered patent, trademark, or copyright. Consult IP counsel before relying on any method alone or before public launch that could affect novelty.";

/** Sap / tree metaphor — quiet work under the surface while you rest and grow. */
export const PRODUCT_SAP_METAPHOR =
  "Like sap in a tree, zzai zzai keeps protection and guardrails flowing underneath — so you can rest, focus on design, and grow.";

/** One-sentence pitch (YC / hero / meta). */
export const PRODUCT_ONE_LINER =
  "zzai zzai leads with Poor Man Protection for sketches, designs, and code — timestamped seals and verify-at-a-link evidence, plus a free Klean Sneaks demo and beta builder tools.";

/** Plain-language main goal (homepage game + product faces). */
export const PRODUCT_MAIN_GOAL =
  "Seal work in Poor Man Protection, verify hashes in the browser, and download a court pack when you need to show priority — before you spend on formal registration.";

/** Shorter hero subline. */
export const PRODUCT_HERO_SUBLINE =
  "Upload, seal, verify — evidentiary workflow for creators who need a defensible record.";

/** Max ~12 words — mobile homepage faces only. */
export const PRODUCT_HOOK_SHORT = "Poor Man Protection first — seal, verify, court pack.";

/** Literal game ↔ product bridge (BALOON8 car×sneaker, Jordan 14 × Ferrari). */
export const PRODUCT_GAME_HYBRID_METAPHOR =
  "One car×sneaker chassis (BALOON8), many unlockable colorways — the same H¹ silhouette, different finishes, like Hybrid² on the desk.";

/** First homepage panel — Klean Sneaks (not the product dashboard). */
export const HOMEPAGE_GAME_FACE_TITLE = "Game · Klean Sneaks";
export const HOMEPAGE_GAME_FACE_SUBLINE =
  "Protect your kicks on the walk — Klean Sneaks is the free demo of keeping sneaker assets Klean.";

/** Shown under the tagline on the platform homepage face (mobile compact). */
export const HOMEPAGE_PLATFORM_FACE_SUBLINE =
  "Timestamped seals, custody logs, and public verify links — built for Poor Man Protection.";

export const HOMEPAGE_SCROLL_TO_PLATFORM = "Swipe ↓ ZZAI platform";
export const HOMEPAGE_SCROLL_TO_GAME = "Swipe ↑ Klean Sneaks game";

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
