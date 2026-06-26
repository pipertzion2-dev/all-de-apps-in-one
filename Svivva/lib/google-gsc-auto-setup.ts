import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateText } from "@/lib/orbit/ai-client";
import { isAnyAiProviderAvailable } from "@/lib/llm/openai";
import { submitSitemapWithAccessToken, submitUrlsWithAccessToken } from "@/lib/google-indexing";
import {
  listGscSites,
  matchGscSiteToCanonical,
  type GscSiteEntry,
} from "@/lib/google-gsc-oauth";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { getSiteUrl, getSitemapUrl } from "@/lib/site-url";

export type GscAutoSetupResult = {
  ok: boolean;
  siteUrl: string | null;
  sitemapOk: boolean;
  indexingSubmitted: number;
  indexingAttempted: number;
  sitesFound: number;
  message: string;
  aiUsed: boolean;
};

async function pickSiteWithAi(
  sites: GscSiteEntry[],
  canonical: string,
): Promise<string | null> {
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
  if (!matched && sites.length === 1) matched = sites[0].siteUrl;
  if (!matched) {
    return {
      ok: false,
      siteUrl: null,
      sitemapOk: false,
      indexingSubmitted: 0,
      indexingAttempted: 0,
      sitesFound: sites.length,
      message: `Could not match ${canonical} to any of ${sites.length} GSC properties. Verify the site in Search Console.`,
      aiUsed,
    };
  }

  await db
    .update(seedCredentials)
    .set({ googleSiteUrl: matched, googleIndexingEnabled: true, updatedAt: new Date() })
    .where(eq(seedCredentials.userId, opts.userId));

  const sm = await submitSitemapWithAccessToken(opts.accessToken, matched, sitemapUrl);

  const allUrls = await getAllSiteUrlsForIndexing();
  const batch = allUrls.slice(0, 200);
  let indexingSubmitted = 0;
  if (batch.length > 0) {
    const gi = await submitUrlsWithAccessToken(opts.accessToken, batch);
    indexingSubmitted = gi.submitted;
  }

  const ok = sm.ok && (indexingSubmitted > 0 || sm.ok);
  return {
    ok,
    siteUrl: matched,
    sitemapOk: sm.ok,
    indexingSubmitted,
    indexingAttempted: batch.length,
    sitesFound: sites.length,
    message: sm.ok
      ? `Connected ${matched} · Sitemap submitted · ${indexingSubmitted}/${batch.length} URLs sent to Google Indexing API`
      : sm.error || "Sitemap submission failed",
    aiUsed,
  };
}
