import { MINI_TOOL_CATALOG_SIZE } from "@/lib/orbit/content-templates";

/** Quality over quantity — one canonical page per tool, not 4 doorway variants. */
export const TARGET_TOOL_SEO_PAGES = MINI_TOOL_CATALOG_SIZE + 15;
/** Total marketing pages: tools + comparisons + blog + supporting content. */
export const TARGET_TOTAL_MARKETING_PAGES = TARGET_TOOL_SEO_PAGES + 50;

export type MarketingCountFields = {
  seoPages: number;
  comparisons: number;
  blogPosts: number;
  aeoPages: number;
  seedMarketing: number;
  integrationPages: number;
  usecasePages: number;
  templatePages: number;
  paaPages: number;
  hubExists: boolean;
  indexNowKey: boolean;
  indexNowSubmitted: boolean;
};

export function sumMarketingPages(
  c: Omit<MarketingCountFields, "hubExists" | "indexNowKey" | "indexNowSubmitted">,
): number {
  return (
    c.seoPages +
    c.comparisons +
    c.blogPosts +
    c.aeoPages +
    c.seedMarketing +
    c.integrationPages +
    c.usecasePages +
    c.templatePages +
    c.paaPages
  );
}

export function computePagesPercent(
  totalPages: number,
  target = TARGET_TOTAL_MARKETING_PAGES,
): number {
  return Math.min(100, Math.round((totalPages / target) * 100));
}

export function computeIndexedPercent(opts: {
  indexNowSubmitted: boolean;
  indexNowOk?: boolean;
  submittedCount?: number;
  totalUrls?: number;
  toolSeoComplete?: boolean;
}): number {
  if (opts.toolSeoComplete && opts.indexNowSubmitted) {
    return 100;
  }
  if (opts.indexNowSubmitted && opts.indexNowOk !== false) {
    if (opts.totalUrls && opts.submittedCount != null && opts.totalUrls > 0) {
      const pct = Math.round((opts.submittedCount / opts.totalUrls) * 100);
      return pct >= 98 ? 100 : Math.min(99, pct);
    }
    return 100;
  }
  if (opts.totalUrls && opts.submittedCount != null && opts.totalUrls > 0) {
    return Math.min(99, Math.round((opts.submittedCount / opts.totalUrls) * 100));
  }
  return 0;
}

export function computeIndexHealthScore(
  counts: MarketingCountFields,
  opts?: {
    totalPages?: number;
    indexedPercent?: number;
    /** Sitemap-eligible pages after quality gate (not raw DB count). */
    sitemapEligible?: number;
    /** GSC clicks in last 28 days — real traffic signal. */
    gscClicks28d?: number;
  },
): number {
  const toolSeoComplete = counts.seedMarketing >= TARGET_TOOL_SEO_PAGES;
  const totalPages = opts?.totalPages ?? sumMarketingPages(counts);
  const pagesPct = computePagesPercent(totalPages, TARGET_TOTAL_MARKETING_PAGES);
  const indexedPct =
    opts?.indexedPercent ??
    computeIndexedPercent({
      indexNowSubmitted: counts.indexNowSubmitted,
      indexNowOk: counts.indexNowSubmitted,
      toolSeoComplete,
    });

  const qualityPct =
    opts?.sitemapEligible != null && totalPages > 0
      ? Math.min(100, Math.round((opts.sitemapEligible / totalPages) * 100))
      : pagesPct;

  const trafficBonus = Math.min(
    20,
    (opts?.gscClicks28d ?? 0) > 0 ? 10 + Math.log10((opts?.gscClicks28d ?? 0) + 1) * 5 : 0,
  );

  const score = Math.round(
    qualityPct * 0.3 +
      indexedPct * 0.3 +
      (counts.indexNowKey ? 10 : 0) +
      (counts.hubExists ? 10 : 0) +
      Math.min((counts.seedMarketing / TARGET_TOOL_SEO_PAGES) * 10, 10) +
      trafficBonus,
  );
  return Math.min(100, score);
}
