import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import { submitSitemapToGSC, submitUrlsToGoogleIndexingApi } from "@/lib/google-indexing";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { getSitemapUrl } from "@/lib/site-url";

/** Google Indexing API daily quota is limited; stay aligned with /api/marketing/google-search. */
const GOOGLE_INDEXING_BATCH = 200;

export type AutomateManualResult = {
  summaryLines: string[];
  indexNow: {
    ok: boolean;
    message: string;
    submittedCount: number;
    totalUrls: number;
  };
  bingPing: { ok: boolean; status?: number; error?: string };
  googleSitemap: { attempted: boolean; ok: boolean; error?: string };
  googleIndexing: {
    attempted: boolean;
    submitted: number;
    batched: number;
    totalUrls: number;
    errorsSample: string[];
  };
};

async function getGscCreds(): Promise<{
  sa: string;
  site: string;
  userId: string;
} | null> {
  const adminUserId = getPrimaryAdminUserId() || "";
  const [row] = adminUserId
    ? await db
        .select({
          sa: seedCredentials.googleServiceAccountJson,
          site: seedCredentials.googleSiteUrl,
          userId: seedCredentials.userId,
        })
        .from(seedCredentials)
        .where(eq(seedCredentials.userId, adminUserId))
        .limit(1)
    : await db
        .select({
          sa: seedCredentials.googleServiceAccountJson,
          site: seedCredentials.googleSiteUrl,
          userId: seedCredentials.userId,
        })
        .from(seedCredentials)
        .where(
          and(
            eq(seedCredentials.googleIndexingEnabled, true),
            isNotNull(seedCredentials.googleServiceAccountJson),
            isNotNull(seedCredentials.googleSiteUrl),
          ),
        )
        .orderBy(desc(seedCredentials.updatedAt))
        .limit(1);

  if (!row?.sa || !row?.site) return null;
  return { sa: row.sa, site: row.site, userId: row.userId };
}

/**
 * Runs every indexing action the server can do without a human in the browser:
 * IndexNow (all URLs), Bing sitemap ping, GSC sitemap PUT, Google Indexing API (first N URLs).
 * Does not post to Reddit/Medium/etc. — those still require your accounts.
 */
export async function runAutomatableManualActions(): Promise<AutomateManualResult> {
  const summaryLines: string[] = [];
  const urls = await getAllSiteUrlsForIndexing();
  const sitemapUrl = getSitemapUrl();

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
    bingPing = { ok: r.ok, status: r.status };
    summaryLines.push(
      r.ok ? `✓ Bing sitemap ping: HTTP ${r.status}` : `⚠ Bing sitemap ping: HTTP ${r.status}`,
    );
  } catch (e) {
    bingPing = { ok: false, error: String(e) };
    summaryLines.push(`⚠ Bing sitemap ping: ${String(e)}`);
  }

  const gsc = await getGscCreds();
  let googleSitemap: AutomateManualResult["googleSitemap"] = { attempted: false, ok: false };
  let googleIndexing: AutomateManualResult["googleIndexing"] = {
    attempted: false,
    submitted: 0,
    batched: 0,
    totalUrls: urls.length,
    errorsSample: [],
  };

  if (gsc) {
    googleSitemap.attempted = true;
    const sm = await submitSitemapToGSC(gsc.sa, gsc.site, sitemapUrl);
    googleSitemap = { attempted: true, ok: sm.ok, error: sm.error };
    summaryLines.push(
      sm.ok
        ? "✓ Google Search Console: sitemap registered (API)"
        : `⚠ GSC sitemap API: ${sm.error || "failed"}`,
    );

    googleIndexing.attempted = true;
    const batch = urls.slice(0, GOOGLE_INDEXING_BATCH);
    const gi = await submitUrlsToGoogleIndexingApi(gsc.sa, batch);
    googleIndexing.submitted = gi.submitted;
    googleIndexing.batched = batch.length;
    googleIndexing.errorsSample = gi.errors.slice(0, 8);

    try {
      await db.execute(
        sql`UPDATE seed_credentials SET last_google_indexing = NOW(), updated_at = NOW() WHERE user_id = ${gsc.userId}`,
      );
    } catch {
      /* ignore */
    }

    summaryLines.push(
      `✓ Google Indexing API: ${gi.submitted}/${batch.length} URL notifications sent (${urls.length} on site; quota limits batch size)`,
    );
    if (gi.errors.length) {
      summaryLines.push(`  · Sample errors: ${gi.errors.slice(0, 3).join(" | ")}`);
    }
  } else {
    summaryLines.push(
      "· Google (GSC + Indexing API) skipped — add service account + site URL at /dashboard/gsc-connect",
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
