/**
 * Google Search Console Search Analytics — queries, pages, impressions, CTR, position.
 * Requires OAuth or service-account access with webmasters scope.
 */
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  getGoogleOAuthAccessTokenForUser,
  listGscSites,
  matchGscSiteToCanonical,
} from "@/lib/google-gsc-oauth";
import {
  getGoogleServiceAccountAccessToken,
  parseGoogleServiceAccount,
} from "@/lib/google-service-account";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { getSiteUrl } from "@/lib/site-url";

export type GscSearchRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSearchAnalyticsReport = {
  ok: boolean;
  siteUrl: string | null;
  startDate: string;
  endDate: string;
  queries: GscSearchRow[];
  pages: GscSearchRow[];
  /** Queries ranking positions 5–20 (page-1 opportunities). */
  nearPageOne: GscSearchRow[];
  /** Pages with high impressions but CTR below 2%. */
  lowCtrPages: GscSearchRow[];
  /** New or rising queries (top by impressions, not in prior window). */
  newQueries: GscSearchRow[];
  error?: string;
  fetchedAt: string;
};

type GscQueryBody = {
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit?: number;
  startRow?: number;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function resolveAccessToken(userId: string): Promise<string | null> {
  const oauth = await getGoogleOAuthAccessTokenForUser(userId);
  if (oauth) return oauth;

  const [row] = await db
    .select({ sa: seedCredentials.googleServiceAccountJson })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);
  if (!row?.sa) return null;
  try {
    const sa = parseGoogleServiceAccount(row.sa);
    return getGoogleServiceAccountAccessToken(sa, "https://www.googleapis.com/auth/webmasters");
  } catch {
    return null;
  }
}

async function resolveGscSiteUrl(accessToken: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ site: seedCredentials.googleSiteUrl })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);
  if (row?.site?.trim()) return row.site.trim();

  const sites = await listGscSites(accessToken);
  return matchGscSiteToCanonical(sites, getSiteUrl());
}

async function fetchSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: GscQueryBody,
): Promise<GscSearchRow[]> {
  const encoded = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const data = (await res.json()) as {
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `GSC searchAnalytics failed (${res.status})`);
  }
  return (data.rows ?? []).map((r) => ({
    keys: r.keys,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

/** Pull GSC performance data for Orbit weekly SEO routine. */
export async function fetchGscSearchAnalytics(opts?: {
  days?: number;
  rowLimit?: number;
}): Promise<GscSearchAnalyticsReport> {
  const days = opts?.days ?? 28;
  const rowLimit = opts?.rowLimit ?? 250;
  const endDate = isoDate(daysAgo(2));
  const startDate = isoDate(daysAgo(days + 2));
  const priorStart = isoDate(daysAgo(days * 2 + 2));
  const priorEnd = isoDate(daysAgo(days + 3));
  const fetchedAt = new Date().toISOString();

  const userId = await resolveGscCredentialsUserId();
  const accessToken = await resolveAccessToken(userId);
  if (!accessToken) {
    return {
      ok: false,
      siteUrl: null,
      startDate,
      endDate,
      queries: [],
      pages: [],
      nearPageOne: [],
      lowCtrPages: [],
      newQueries: [],
      error: "Connect Google Search Console at /dashboard/gsc-connect",
      fetchedAt,
    };
  }

  let siteUrl: string | null;
  try {
    siteUrl = await resolveGscSiteUrl(accessToken, userId);
  } catch (e) {
    return {
      ok: false,
      siteUrl: null,
      startDate,
      endDate,
      queries: [],
      pages: [],
      nearPageOne: [],
      lowCtrPages: [],
      newQueries: [],
      error: e instanceof Error ? e.message : String(e),
      fetchedAt,
    };
  }

  if (!siteUrl) {
    return {
      ok: false,
      siteUrl: null,
      startDate,
      endDate,
      queries: [],
      pages: [],
      nearPageOne: [],
      lowCtrPages: [],
      newQueries: [],
      error: "No matching GSC property — sync at /dashboard/gsc-connect",
      fetchedAt,
    };
  }

  try {
    const [queries, pages, priorQueries] = await Promise.all([
      fetchSearchAnalytics(accessToken, siteUrl, {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit,
      }),
      fetchSearchAnalytics(accessToken, siteUrl, {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit,
      }),
      fetchSearchAnalytics(accessToken, siteUrl, {
        startDate: priorStart,
        endDate: priorEnd,
        dimensions: ["query"],
        rowLimit,
      }),
    ]);

    const nearPageOne = queries.filter((q) => q.position >= 5 && q.position <= 20 && q.impressions >= 10);
    const lowCtrPages = pages.filter((p) => p.impressions >= 50 && p.ctr < 0.02);

    const priorKeys = new Set(priorQueries.map((q) => q.keys[0]?.toLowerCase()));
    const newQueries = queries
      .filter((q) => !priorKeys.has(q.keys[0]?.toLowerCase() ?? "") && q.impressions >= 5)
      .slice(0, 30);

    return {
      ok: true,
      siteUrl,
      startDate,
      endDate,
      queries: queries.slice(0, 100),
      pages: pages.slice(0, 100),
      nearPageOne: nearPageOne.slice(0, 30),
      lowCtrPages: lowCtrPages.slice(0, 20),
      newQueries,
      fetchedAt,
    };
  } catch (e) {
    return {
      ok: false,
      siteUrl,
      startDate,
      endDate,
      queries: [],
      pages: [],
      nearPageOne: [],
      lowCtrPages: [],
      newQueries: [],
      error: e instanceof Error ? e.message : String(e),
      fetchedAt,
    };
  }
}
