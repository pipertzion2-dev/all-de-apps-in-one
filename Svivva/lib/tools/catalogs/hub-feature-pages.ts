/**
 * Indexable mini-app feature pages — one URL per tool/landing with strategic keywords.
 * Sourced from Cyber Security Mini Apps + AI Tools Hub catalogs.
 * Prefer these feature paths over generic /apps hub URLs for organic traffic.
 */

import catalog from "./hub-feature-pages.json";

export type HubFeatureHub = "ai-tools-hub" | "cyber-security-mini-apps";

export type HubFeaturePage = {
  slug: string;
  path: string;
  hub: HubFeatureHub;
  kind: "tool" | "landing";
  /** Browser title / OG title */
  title: string;
  /** Optional display H1 when different from title */
  h1?: string;
  metaDescription: string;
  description: string;
  tagline?: string;
  category?: string;
  /** Primary search keyword */
  keyword: string;
  keywords: string[];
  relatedToolSlug?: string;
};

export const HUB_FEATURE_PAGES = catalog as HubFeaturePage[];

export const HUB_FEATURE_PATHS = HUB_FEATURE_PAGES.map((p) => p.path);

const FEATURE_SLUG_TO_PATH = new Map(HUB_FEATURE_PAGES.map((p) => [p.slug, p.path]));

/** Canonical hub path for a feature slug (`password-strength` → `/cyber-security-mini-apps/...`). */
export function canonicalPathForFeatureSlug(slug: string): string | undefined {
  return FEATURE_SLUG_TO_PATH.get(slug);
}

export function getHubFeaturePage(hub: HubFeatureHub, slug: string): HubFeaturePage | undefined {
  return HUB_FEATURE_PAGES.find((p) => p.hub === hub && p.slug === slug);
}

export function getHubFeaturePagesForHub(hub: HubFeatureHub): HubFeaturePage[] {
  return HUB_FEATURE_PAGES.filter((p) => p.hub === hub);
}

export function getCyberFeatureSitemapPaths(): string[] {
  return getHubFeaturePagesForHub("cyber-security-mini-apps").map((p) => p.path);
}

export function getAiHubFeatureSitemapPaths(): string[] {
  return getHubFeaturePagesForHub("ai-tools-hub").map((p) => p.path);
}
