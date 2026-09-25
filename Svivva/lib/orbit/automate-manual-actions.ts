import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dedupeErrorMessages } from "@/lib/orbit/orbit-error-messages";
import {
  GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE,
  isGoogleIndexingQuotaExhaustedToday,
  markGoogleIndexingQuotaExhausted,
  noteGoogleIndexingErrors,
} from "@/lib/orbit/google-indexing-quota";
import { seedCredentials } from "@/lib/schema";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import {
  submitSitemapToGSC,
  submitUrlsToGoogleIndexingApi,
  submitSitemapWithAccessToken,
  submitUrlsWithAccessToken,
} from "@/lib/google-indexing";
import {
  getGoogleOAuthAccessTokenForUser,
  ensureGscOAuthColumns,
  resolveGscPropertySiteUrl,
} from "@/lib/google-gsc-oauth";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { getSitemapUrl, getSecuritySitemapUrl } from "@/lib/site-url";
import { getIndexingBatch, recordSubmission } from "@/lib/seo/index-health";
import {
  clampGoogleMaxBatches,
  GOOGLE_INDEXING_BATCH_SIZE,
  indexNowMaxUrlsPerRun,
} from "@/lib/indexing/indexing-policy";

const GOOGLE_INDEXING_BATCH = GOOGLE_INDEXING_BATCH_SIZE;

export type AutomateManualResult = {
  summaryLines: string[];
  indexNow: {
    ok: boolean;
    message: string;
    submittedCount: number;
    totalUrls: number;
  };
  bingPing: {
    ok: boolean;
    status?: number;
    error?: string;
    /** Bing retired /ping?sitemap= — IndexNow is the working path. */
    deprecated?: boolean;
  };
  googleSitemap: { attempted: boolean; ok: boolean; error?: string };
  googleIndexing: {
    attempted: boolean;
    submitted: number;
    batched: number;
    totalUrls: number;
    errorsSample: string[];
    quotaExhausted?: boolean;
  };
};

async function getGscCreds(): Promise<{
  site: string;
  userId: string;
  mode: "oauth" | "service_account";
  accessToken?: string;
  sa?: string;
} | null> {
  await ensureGscOAuthColumns();
  const credUserId = await resolveGscCredentialsUserId();
  type CredRow = {
    sa: string | null;
    site: string | null;
    userId: string;
    oauthRefresh: string | null;
  };

  let row: CredRow | undefined;
  const [primary] = await db
    .select({
      sa: seedCredentials.googleServiceAccountJson,
      site: seedCredentials.googleSiteUrl,
      userId: seedCredentials.userId,
      oauthRefresh: seedCredentials.googleOauthRefreshToken,
    })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, credUserId))
    .limit(1);
  row = primary;

  if (!row?.site) {
    const [fallback] = await db
      .select({
        sa: seedCredentials.googleServiceAccountJson,
        site: seedCredentials.googleSiteUrl,
        userId: seedCredentials.userId,
        oauthRefresh: seedCredentials.googleOauthRefreshToken,
      })
      .from(seedCredentials)
      .where(
        and(
          eq(seedCredentials.googleIndexingEnabled, true),
          isNotNull(seedCredentials.googleSiteUrl),
        ),
      )
      .orderBy(desc(seedCredentials.updatedAt))
      .limit(1);
    row = fallback;
  }

  if (!row?.site) return null;

  if (row.oauthRefresh?.trim()) {
    try {
      const accessToken = await getGoogleOAuthAccessTokenForUser(row.userId);
      if (accessToken) {
        return { mode: "oauth", accessToken, site: row.site, userId: row.userId };
      }
    } catch {
      /* fall through to service account */
    }
  }

  if (row.sa?.trim()) {
    return { mode: "service_account", sa: row.sa, site: row.site, userId: row.userId };
  }

  return null;
}

/**
 * Runs every indexing action the server can do without a human in the browser:
 * IndexNow (all URLs), Bing sitemap ping (soft when retired), GSC sitemap PUT,
 * Google Indexing API (rotated batch; soft when daily quota is exhausted).
 * Does not post to Reddit/Medium/etc. — those still require your accounts.
 */
export async function runAutomatableManualActions(opts?: {
  /** Batches of ~200 URLs (clamped — default 1 batch per run). */
  googleMaxBatches?: number;
  /** Skip Google Indexing API (e.g. already run in the same request). */
  skipIndexingApi?: boolean;
  /** Submit every sitemap URL to IndexNow (discouraged — use rotated default). */
  indexNowSubmitAll?: boolean;
  /** Cap IndexNow URLs for this run (Timing professional cadence). */
  indexNowMaxUrlsOverride?: number;
  /** Max Google Indexing API URL notifications this run (partial batch). */
  indexingApiMaxUrls?: number;
  /** Skip GSC sitemap PUT — use after one-time sitemap registration. */
  skipGoogleSitemap?: boolean;
}): Promise<AutomateManualResult> {
  const summaryLines: string[] = [];
  const urls = await getAllSiteUrlsForIndexing();
  const sitemapUrl = getSitemapUrl();
  const securitySitemapUrl = getSecuritySitemapUrl();

  const indexNowCap =
    opts?.indexNowMaxUrlsOverride != null && opts.indexNowMaxUrlsOverride > 0
      ? Math.min(opts.indexNowMaxUrlsOverride, indexNowMaxUrlsPerRun())
      : indexNowMaxUrlsPerRun();
  let indexNowTargets = urls;
  if (!opts?.indexNowSubmitAll) {
    const rotated = await getIndexingBatch(indexNowCap);
    indexNowTargets =
      rotated.length > 0 ? rotated.slice(0, indexNowCap) : urls.slice(0, indexNowCap);
  }

  const indexResult = await submitIndexNowBatched(indexNowTargets);
  if (indexResult.ok && indexResult.submittedCount > 0) {
    await recordSubmission(indexNowTargets.slice(0, indexResult.submittedCount));
  }
  summaryLines.push(
    indexResult.ok
      ? opts?.indexNowSubmitAll
        ? `✓ IndexNow: ${indexResult.submittedCount}/${indexResult.totalUrls} URLs accepted (full list)`
        : `✓ IndexNow: ${indexResult.submittedCount} URL(s) this run (${urls.length} on site — rotated batch, max ${indexNowCap}/run)`
      : `⚠ IndexNow: ${indexResult.message}`,
  );

  let bingPing: AutomateManualResult["bingPing"] = { ok: false };
  try {
    const r = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    // Bing retired the public sitemap ping endpoint (often HTTP 410). IndexNow is the
    // working Bing/Yahoo/Yandex path — never treat a retired ping as a hard failure.
    const deprecated = r.status === 410 || r.status === 404;
    if (deprecated) {
      bingPing = { ok: true, status: r.status, deprecated: true };
      summaryLines.push(
        `· Bing sitemap ping retired (HTTP ${r.status}) — IndexNow covers Bing/Yahoo/Yandex`,
      );
    } else {
      bingPing = { ok: r.ok, status: r.status };
      summaryLines.push(
        r.ok ? `✓ Bing sitemap ping: HTTP ${r.status}` : `⚠ Bing sitemap ping: HTTP ${r.status}`,
      );
    }
  } catch (e) {
    // Network blip on a deprecated endpoint — still soft-ok when IndexNow worked.
    bingPing = {
      ok: indexResult.ok,
      error: String(e),
      deprecated: true,
    };
    summaryLines.push(
      indexResult.ok
        ? `· Bing ping unreachable — IndexNow already covers Bing (${String(e).slice(0, 80)})`
        : `⚠ Bing sitemap ping: ${String(e)}`,
    );
  }

  const gsc = await getGscCreds();
  let googleSitemap: AutomateManualResult["googleSitemap"] = { attempted: false, ok: false };
  let googleIndexing: AutomateManualResult["googleIndexing"] = {
    attempted: false,
    submitted: 0,
    batched: 0,
    totalUrls: urls.length,
    errorsSample: [],
    quotaExhausted: false,
  };

  if (gsc) {
    let gscSite = gsc.site;
    if (gsc.mode === "oauth" && gsc.accessToken) {
      gscSite =
        (await resolveGscPropertySiteUrl(gsc.accessToken, gsc.site)) || gsc.site;
    }
    if (opts?.skipGoogleSitemap) {
      googleSitemap = { attempted: false, ok: false };
      summaryLines.push("· GSC sitemap skipped — already registered in Timing step 2");
    } else {
      googleSitemap.attempted = true;
      const sm =
        gsc.mode === "oauth" && gsc.accessToken
          ? await submitSitemapWithAccessToken(gsc.accessToken, gscSite, sitemapUrl)
          : await submitSitemapToGSC(gsc.sa!, gscSite, sitemapUrl);
      const smSecurity =
        gsc.mode === "oauth" && gsc.accessToken
          ? await submitSitemapWithAccessToken(gsc.accessToken, gscSite, securitySitemapUrl)
          : await submitSitemapToGSC(gsc.sa!, gscSite, securitySitemapUrl);
      googleSitemap = {
        attempted: true,
        ok: sm.ok,
        error: sm.error || (!smSecurity.ok ? smSecurity.error : undefined),
      };
      summaryLines.push(
        sm.ok
          ? `✓ Google Search Console: sitemap registered (API)${smSecurity.ok ? " · security sitemap too" : ""}`
          : `⚠ GSC sitemap API: ${sm.error || "failed"}`,
      );
    }

    const skipIndexing = opts?.skipIndexingApi === true || isGoogleIndexingQuotaExhaustedToday();

    if (skipIndexing) {
      googleIndexing.attempted = false;
      googleIndexing.quotaExhausted = isGoogleIndexingQuotaExhaustedToday();
      summaryLines.push(
        isGoogleIndexingQuotaExhaustedToday()
          ? `· Google Indexing API skipped — ${GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE}`
          : "· Google Indexing API skipped this pass (already handled upstream)",
      );
    } else {
      googleIndexing.attempted = true;
      const batchCount = clampGoogleMaxBatches(opts?.googleMaxBatches);
      const indexingUrlCap =
        opts?.indexingApiMaxUrls != null && opts.indexingApiMaxUrls > 0
          ? Math.min(opts.indexingApiMaxUrls, batchCount * GOOGLE_INDEXING_BATCH)
          : batchCount * GOOGLE_INDEXING_BATCH;
      let totalGiSubmitted = 0;
      let totalGiAttempted = 0;
      const allGiErrors: string[] = [];
      let quotaExhausted = false;

      // Rotate through the site by least-recently-submitted so a slow, week-long
      // crawl reaches every URL across days instead of re-sending the first 200.
      let rotating = await getIndexingBatch(indexingUrlCap);
      if (rotating.length === 0) rotating = urls.slice(0, indexingUrlCap);

      for (let b = 0; b < batchCount; b++) {
        if (quotaExhausted || isGoogleIndexingQuotaExhaustedToday()) break;
        if (totalGiAttempted >= indexingUrlCap) break;
        const batch = rotating
          .slice(b * GOOGLE_INDEXING_BATCH, (b + 1) * GOOGLE_INDEXING_BATCH)
          .slice(0, indexingUrlCap - totalGiAttempted);
        if (!batch.length) break;
        const gi =
          gsc.mode === "oauth" && gsc.accessToken
            ? await submitUrlsWithAccessToken(gsc.accessToken, batch)
            : await submitUrlsToGoogleIndexingApi(gsc.sa!, batch);
        totalGiSubmitted += gi.submitted;
        totalGiAttempted += batch.length;
        allGiErrors.push(...gi.errors);
        if (gi.submittedUrls?.length) {
          await recordSubmission(gi.submittedUrls);
        } else if (gi.submitted > 0) {
          await recordSubmission(batch.slice(0, gi.submitted));
        }
        if (gi.quotaExhausted || noteGoogleIndexingErrors(gi.errors)) {
          quotaExhausted = true;
          markGoogleIndexingQuotaExhausted();
          break;
        }
        if (batch.length < GOOGLE_INDEXING_BATCH) break;
        if (b < batchCount - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      googleIndexing.submitted = totalGiSubmitted;
      googleIndexing.batched = totalGiAttempted;
      googleIndexing.errorsSample = dedupeErrorMessages(allGiErrors).slice(0, 4);
      googleIndexing.quotaExhausted = quotaExhausted;

      try {
        await db.execute(
          sql`UPDATE seed_credentials SET last_google_indexing = NOW(), updated_at = NOW() WHERE user_id = ${gsc.userId}`,
        );
      } catch {
        /* ignore */
      }

      if (quotaExhausted && totalGiSubmitted === 0) {
        summaryLines.push(`· Google Indexing API: ${GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE}`);
      } else if (quotaExhausted) {
        summaryLines.push(
          `✓ Google Indexing API: ${totalGiSubmitted}/${totalGiAttempted} URL notifications then daily quota — IndexNow + sitemap still cover the rest`,
        );
      } else {
        summaryLines.push(
          `✓ Google Indexing API: ${totalGiSubmitted}/${totalGiAttempted} URL notifications (${urls.length} on site; rotating least-recently-submitted, up to ${batchCount}×${GOOGLE_INDEXING_BATCH} per run)`,
        );
      }
      if (allGiErrors.length && !quotaExhausted) {
        summaryLines.push(`  · Sample errors: ${allGiErrors.slice(0, 3).join(" | ")}`);
      }
    }
  } else {
    summaryLines.push(
      "· Google skipped — connect your Google account at /dashboard/gsc-connect (one click)",
    );
  }

  return {
    summaryLines,
    indexNow: {
      ok: indexResult.ok,
      message: indexResult.message,
      submittedCount: indexResult.submittedCount,
      totalUrls: indexResult.totalUrls,
    },
    bingPing,
    googleSitemap,
    googleIndexing,
  };
}
