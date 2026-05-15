/** Orbit marketing page targets — dashboard + gap fill use the same numbers. */
export const TARGET_TOTAL_MARKETING_PAGES = 300;
export const TARGET_TOOL_SEO_PAGES = 300;

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
  opts?: { totalPages?: number; indexedPercent?: number },
): number {
  const toolSeoComplete = counts.seedMarketing >= TARGET_TOOL_SEO_PAGES;
  const totalPages = opts?.totalPages ?? sumMarketingPages(counts);
  const pagesPct = computePagesPercent(totalPages);
  const indexedPct =
    opts?.indexedPercent ??
    computeIndexedPercent({
      indexNowSubmitted: counts.indexNowSubmitted,
      indexNowOk: counts.indexNowSubmitted,
      toolSeoComplete,
    });

  if (toolSeoComplete && indexedPct >= 100 && counts.indexNowKey && counts.hubExists) {
    return 100;
  }

  const score = Math.round(
    pagesPct * 0.35 +
      indexedPct * 0.35 +
      (counts.indexNowKey ? 10 : 0) +
      (counts.hubExists ? 10 : 0) +
      Math.min((counts.seedMarketing / TARGET_TOOL_SEO_PAGES) * 10, 10),
  );
  return Math.min(100, score);
}
