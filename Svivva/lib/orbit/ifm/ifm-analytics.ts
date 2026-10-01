import type { Ga4PageMetric } from "../analytics/ga4-data-api";
import type { IfmPairing } from "./ifm-types";
import { buildIfmBridgePageDraft } from "./bridge-page-generator";

export type IfmPairAnalytics = {
  sessions7d: number;
  conversions7d: number;
  pagePath?: string;
};

function pairingPageSlug(pairing: IfmPairing): string {
  return buildIfmBridgePageDraft(pairing).slug;
}

/** Match GA4 page rows to an IFM pairing by slug fragment. */
export function matchGa4PageToPairing(
  pages: Ga4PageMetric[],
  pairing: IfmPairing,
): IfmPairAnalytics | undefined {
  const slug = pairingPageSlug(pairing).toLowerCase();
  const pairingSlug = pairing.slug.toLowerCase();

  for (const page of pages) {
    const path = page.pagePath.toLowerCase();
    if (
      path.includes(slug) ||
      path.includes(pairingSlug) ||
      path.includes(pairingSlug.replace(/^ifm-/, "ifm/"))
    ) {
      return {
        sessions7d: page.sessions7d,
        conversions7d: page.conversions7d,
        pagePath: page.pagePath,
      };
    }
  }
  return undefined;
}

/** Compute analytics score boost from per-pair GA4 metrics (0–20). */
export function pairAnalyticsBoost(metrics?: IfmPairAnalytics): number {
  if (!metrics) return 0;
  let boost = 0;
  if (metrics.sessions7d >= 5) boost += 5;
  if (metrics.sessions7d >= 25) boost += 5;
  if (metrics.conversions7d > 0) boost += 10;
  return Math.min(20, boost);
}

export function buildPairAnalyticsMap(
  pairings: IfmPairing[],
  pages: Ga4PageMetric[],
): Map<string, IfmPairAnalytics> {
  const map = new Map<string, IfmPairAnalytics>();
  for (const pairing of pairings) {
    const matched = matchGa4PageToPairing(pages, pairing);
    if (matched) map.set(pairing.id, matched);
  }
  return map;
}
