/**
 * Professional SEO indexing cadence (research-backed caps).
 *
 * Google: submit sitemap once; use URL Inspection / Indexing API sparingly — not bulk daily max.
 * IndexNow: small rotated batches so crawlers discover URLs over weeks, not one flood.
 * @see docs/TIMING_SEO_PLAYBOOK.md
 */

/** IndexNow URLs per Timing indexing step (well under legacy 200/run defaults). */
export const TIMING_INDEXNOW_URLS_PER_STEP = 45;

/** Google Indexing API URL notifications when Timing allows API (conservative vs ~200/day cap). */
export const TIMING_INDEXING_API_URLS_PER_STEP = 35;

/** Hours between weekly maintenance runs after the plan is complete. */
export const TIMING_MAINTENANCE_INTERVAL_HOURS = 168;

export type TimingIndexingProfile = {
  indexNowMaxUrls: number;
  indexingApiMaxUrls: number;
  skipIndexingApi: boolean;
  skipGoogleSitemap: boolean;
};

/** First nudge: discovery via IndexNow only — let sitemap + crawl settle first. */
export const TIMING_PROFILE_DISCOVERY_ONLY: TimingIndexingProfile = {
  indexNowMaxUrls: TIMING_INDEXNOW_URLS_PER_STEP,
  indexingApiMaxUrls: 0,
  skipIndexingApi: true,
  skipGoogleSitemap: true,
};

/** Later nudges: IndexNow + a small Indexing API slice; never re-register sitemap. */
export const TIMING_PROFILE_INDEXNOW_PLUS_API: TimingIndexingProfile = {
  indexNowMaxUrls: TIMING_INDEXNOW_URLS_PER_STEP,
  indexingApiMaxUrls: TIMING_INDEXING_API_URLS_PER_STEP,
  skipIndexingApi: false,
  skipGoogleSitemap: true,
};

export function profileForTimingStep(stepId: string): TimingIndexingProfile | null {
  switch (stepId) {
    case "index-batch-1":
      return TIMING_PROFILE_DISCOVERY_ONLY;
    case "index-batch-2":
    case "index-weekly":
    case "index-weekly-maintain":
      return TIMING_PROFILE_INDEXNOW_PLUS_API;
    default:
      return null;
  }
}
