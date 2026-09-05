import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateText } from "@/lib/orbit/ai-client";
import { isAnyAiProviderAvailable } from "@/lib/llm/openai";
import { submitSitemapWithAccessToken, submitUrlsWithAccessToken } from "@/lib/google-indexing";
import {
  listGscSites,
  matchGscSiteToCanonical,
  findMatchedGscSite,
  hasGscWritePermission,
  type GscSiteEntry,
} from "@/lib/google-gsc-oauth";
import {
  GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE,
  isGoogleIndexingQuotaExhaustedToday,
  markGoogleIndexingQuotaExhausted,
  noteGoogleIndexingErrors,
} from "@/lib/orbit/google-indexing-quota";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { getIndexingBatch, recordSubmission } from "@/lib/seo/index-health";
import { getSiteUrl, getSitemapUrl, getSecuritySitemapUrl, getSiteHostname } from "@/lib/site-url";

export type GscAutoSetupResult = {
  ok: boolean;
  siteUrl: string | null;
  sitemapOk: boolean;
  /** True when the security/tools sitemap was also accepted by GSC. */
  securitySitemapOk?: boolean;
  indexingSubmitted: number;
  indexingAttempted: number;
  /** True when Indexing API daily quota stopped further publishes. */
  indexingQuotaExhausted?: boolean;
  sitesFound: number;
  message: string;
  aiUsed: boolean;
};

async function pickSiteWithAi(sites: GscSiteEntry[], canonical: string): Promise<string | null> {
  if (!isAnyAiProviderAvailable() || sites.length === 0) return null;
  const list = sites.map((s) => `- ${s.siteUrl} (${s.permissionLevel ?? "unknown"})`).join("\n");
  try {
    const raw = await generateText(
      `Canonical site for this app: ${canonical}\n\nGoogle Search Console properties:\n${list}\n\nReply with ONLY the exact siteUrl string from the list that should be used for sitemap submission and indexing. No explanation.`,
      {
        maxTokens: 120,
        systemPrompt:
          "You pick the correct Google Search Console property for a website. Reply with only the siteUrl value, nothing else.",
      },
    );
    const pick = raw.trim().replace(/^["']|["']$/g, "");
    if (sites.some((s) => s.siteUrl === pick)) return pick;
  } catch {
    /* fallback below */
  }
  return null;
}

export async function runGscAutoSetup(opts: {
  userId: string;
  accessToken: string;
  /**
   * When true, only match the GSC property + submit sitemaps.
   * Use before `runAutomatableManualActions` in the same request so Indexing API
   * quota is not burned twice.
   */
  skipIndexingApi?: boolean;
}): Promise<GscAutoSetupResult> {
  const canonical = getSiteUrl();
  const sitemapUrl = getSitemapUrl();

  let sites: GscSiteEntry[] = [];
  try {
    sites = await listGscSites(opts.accessToken);
  } catch (e) {
    return {
      ok: false,
      siteUrl: null,
      sitemapOk: false,
      indexingSubmitted: 0,
      indexingAttempted: 0,
      sitesFound: 0,
      message: String(e),
      aiUsed: false,
    };
  }

  if (sites.length === 0) {
    return {
      ok: false,
      siteUrl: null,
      sitemapOk: false,
      indexingSubmitted: 0,
      indexingAttempted: 0,
      sitesFound: 0,
      message:
        "No Search Console properties on this Google account. Add and verify your site at search.google.com/search-console first.",
      aiUsed: false,
    };
  }

  let matched = matchGscSiteToCanonical(sites, canonical);
  let aiUsed = false;
  if (!matched && sites.length > 1) {
    matched = await pickSiteWithAi(sites, canonical);
    aiUsed = !!matched;
  }
  if (!matched) {
    const host = getSiteHostname();
    return {
      ok: false,
      siteUrl: null,
      sitemapOk: false,
      indexingSubmitted: 0,
      indexingAttempted: 0,
      sitesFound: sites.length,
      message:
        sites.length === 0
          ? "No Search Console properties on this Google account. Add and verify your site first."
          : `Could not match ${canonical} to any of ${sites.length} GSC properties. In Search Console (same Google account), add ${host} as a domain property (sc-domain:${host}) or URL prefix ${canonical}/ with Owner access, then click Sync property.`,
      aiUsed,
    };
  }

  const matchedEntry =
    findMatchedGscSite(sites, canonical) ?? sites.find((s) => s.siteUrl === matched);
  if (!hasGscWritePermission(matchedEntry?.permissionLevel)) {
    return {
      ok: false,
      siteUrl: matched,
      sitemapOk: false,
      indexingSubmitted: 0,
      indexingAttempted: 0,
      sitesFound: sites.length,
      message: `Found ${matched} but permission is "${matchedEntry?.permissionLevel ?? "unknown"}" — you need Owner or Full access on that property in Search Console.`,
      aiUsed,
    };
  }

  await db
    .update(seedCredentials)
    .set({ googleSiteUrl: matched, googleIndexingEnabled: true, updatedAt: new Date() })
    .where(eq(seedCredentials.userId, opts.userId));

  const securitySitemapUrl = getSecuritySitemapUrl();
  const sm = await submitSitemapWithAccessToken(opts.accessToken, matched, sitemapUrl);
  const smSecurity = await submitSitemapWithAccessToken(
    opts.accessToken,
    matched,
    securitySitemapUrl,
  );

  // Rotate never-/least-recently-submitted URLs first. The old slice(0, 200)
  // burned daily Indexing API quota on the same homepage/static set every sync,
  // so new hub/tool pages never received URL_UPDATED notifications.
  let indexingSubmitted = 0;
  let indexingAttempted = 0;
  let indexingQuotaExhausted = false;

  if (opts.skipIndexingApi || isGoogleIndexingQuotaExhaustedToday()) {
    indexingQuotaExhausted = isGoogleIndexingQuotaExhaustedToday();
  } else {
    const allUrls = await getAllSiteUrlsForIndexing();
    let batch = await getIndexingBatch(200);
    if (batch.length === 0) batch = allUrls.slice(0, 200);
    indexingAttempted = batch.length;

    if (batch.length > 0) {
      const gi = await submitUrlsWithAccessToken(opts.accessToken, batch);
      indexingSubmitted = gi.submitted;
      indexingQuotaExhausted = gi.quotaExhausted || noteGoogleIndexingErrors(gi.errors);
      if (indexingQuotaExhausted) markGoogleIndexingQuotaExhausted();
      // Record only URLs Google accepted so never-notified pages stay at the
      // front of tomorrow's rotation when daily quota cuts the batch short.
      if (gi.submittedUrls.length > 0) {
        await recordSubmission(gi.submittedUrls);
      }
    }
  }

  const ok = sm.ok;
  const sitemapBits = [
    sm.ok ? "main sitemap submitted" : `main sitemap failed: ${sm.error || "unknown"}`,
    smSecurity.ok
      ? "security sitemap submitted"
      : `security sitemap: ${smSecurity.error || "skipped"}`,
  ];
  const indexingBit = opts.skipIndexingApi
    ? "Indexing API deferred to traffic engine"
    : indexingQuotaExhausted && indexingSubmitted === 0
      ? GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE
      : indexingQuotaExhausted
        ? `${indexingSubmitted}/${indexingAttempted} URLs sent then daily quota (IndexNow + sitemap still cover discovery)`
        : `${indexingSubmitted}/${indexingAttempted} URLs sent to Google Indexing API (rotated for new pages)`;

  return {
    ok,
    siteUrl: matched,
    sitemapOk: sm.ok,
    securitySitemapOk: smSecurity.ok,
    indexingSubmitted,
    indexingAttempted,
    indexingQuotaExhausted,
    sitesFound: sites.length,
    message: sm.ok
      ? `Connected ${matched} · ${sitemapBits.join(" · ")} · ${indexingBit}`
      : sm.error || "Sitemap submission failed",
    aiUsed,
  };
}
