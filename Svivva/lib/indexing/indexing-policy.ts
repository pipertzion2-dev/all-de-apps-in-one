/** Shared limits so Orbit/GSC jobs do not dump the whole sitemap at once. */

/** Google Indexing API URLs per batch (Google daily cap ~200). */
export const GOOGLE_INDEXING_BATCH_SIZE = 200;

/** Default batches per single Orbit/GSC click — one batch ≈ one day of quota. */
export const GOOGLE_INDEXING_DEFAULT_BATCHES = 1;

/** Hard cap even when a caller passes googleMaxBatches (avoid 5×200 in one request). */
export const GOOGLE_INDEXING_MAX_BATCHES_PER_RUN = 2;

/** IndexNow URLs per run (rotated — not the full sitemap). */
export function indexNowMaxUrlsPerRun(): number {
  const raw = process.env.INDEXNOW_MAX_URLS_PER_RUN?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 200;
  if (!Number.isFinite(n) || n < 1) return 200;
  return Math.min(n, 5000);
}

export function clampGoogleMaxBatches(requested?: number): number {
  const n = requested ?? GOOGLE_INDEXING_DEFAULT_BATCHES;
  return Math.min(
    GOOGLE_INDEXING_MAX_BATCHES_PER_RUN,
    Math.max(GOOGLE_INDEXING_DEFAULT_BATCHES, n),
  );
}
