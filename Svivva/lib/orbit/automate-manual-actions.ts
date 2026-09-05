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
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import {
  submitSitemapToGSC,
  submitUrlsToGoogleIndexingApi,
  submitSitemapWithAccessToken,
  submitUrlsWithAccessToken,
} from "@/lib/google-indexing";
import { getGoogleOAuthAccessTokenForUser, ensureGscOAuthColumns } from "@/lib/google-gsc-oauth";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { getSitemapUrl, getSecuritySitemapUrl } from "@/lib/site-url";
import { getIndexingBatch, recordSubmission } from "@/lib/seo/index-health";

/** Google Indexing API daily quota is limited; stay aligned with /api/marketing/google-search. */
const GOOGLE_INDEXING_BATCH = 200;
const DEFAULT_GOOGLE_BATCHES = 1;
const MAX_GOOGLE_BATCHES = 5;

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
  const adminUserId = getPrimaryAdminUserId() || "";
  const [row] = adminUserId
    ? await db
        .select({
          sa: seedCredentials.googleServiceAccountJson,
          site: seedCredentials.googleSiteUrl,
          userId: seedCredentials.userId,
          oauthRefresh: seedCredentials.googleOauthRefreshToken,
        })
        .from(seedCredentials)
        .where(eq(seedCredentials.userId, adminUserId))
        .limit(1)
    : await db
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
  /** Up to 5 × 200 URLs per run when GSC service account is configured. */
  googleMaxBatches?: number;
  /** Skip Google Indexing API (e.g. already run in the same request). */
  skipIndexingApi?: boolean;
}): Promise<AutomateManualResult> {
  const summaryLines: string[] = [];
  const urls = await getAllSiteUrlsForIndexing();
  const sitemapUrl = getSitemapUrl();
  const securitySitemapUrl = getSecuritySitemapUrl();

  const indexResult = await submitIndexNowBatched(urls);
  summaryLines.push(
    indexResult.ok
      ? `✓ IndexNow: ${indexResult.submittedCount}/${indexResult.totalUrls} URLs accepted`
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
    googleSitemap.attempted = true;
    const sm =
      gsc.mode === "oauth" && gsc.accessToken
        ? await submitSitemapWithAccessToken(gsc.accessToken, gsc.site, sitemapUrl)
        : await submitSitemapToGSC(gsc.sa!, gsc.site, sitemapUrl);
    const smSecurity =
      gsc.mode === "oauth" && gsc.accessToken
        ? await submitSitemapWithAccessToken(gsc.accessToken, gsc.site, securitySitemapUrl)
        : await submitSitemapToGSC(gsc.sa!, gsc.site, securitySitemapUrl);
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
      const batchCount = Math.min(
        MAX_GOOGLE_BATCHES,
        Math.max(DEFAULT_GOOGLE_BATCHES, opts?.googleMaxBatches ?? DEFAULT_GOOGLE_BATCHES),
      );
      let totalGiSubmitted = 0;
      let totalGiAttempted = 0;
      const allGiErrors: string[] = [];
      let quotaExhausted = false;

      // Rotate through the site by least-recently-submitted so a slow, week-long
      // crawl reaches every URL across days instead of re-sending the first 200.
      let rotating = await getIndexingBatch(batchCount * GOOGLE_INDEXING_BATCH);
      if (rotating.length === 0) rotating = urls;

      for (let b = 0; b < batchCount; b++) {
        if (quotaExhausted || isGoogleIndexingQuotaExhaustedToday()) break;
        const batch = rotating.slice(b * GOOGLE_INDEXING_BATCH, (b + 1) * GOOGLE_INDEXING_BATCH);
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
