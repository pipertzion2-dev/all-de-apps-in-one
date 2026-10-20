import { and, desc, eq, isNotNull, lte, notInArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { submitSitemapToGSC, submitUrlsToGoogleIndexingApi } from "@/lib/google-indexing";
import { getGoogleOAuthAccessTokenForUser, ensureGscOAuthColumns } from "@/lib/google-gsc-oauth";
import { getSitemapUrl } from "@/lib/site-url";
import type { IndexProvider, IndexSubmitResult } from "./index-types";

const GOOGLE_INDEXING_BATCH = 200;

async function getGscCredentials(): Promise<{
  site: string;
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
        return { mode: "oauth", accessToken, site: row.site };
      }
    } catch {
      /* fall through */
    }
  }

  if (row.sa?.trim()) {
    return { mode: "service_account", sa: row.sa, site: row.site };
  }

  return null;
}

export async function submitToIndexProvider(
  provider: IndexProvider,
  urls: string[],
): Promise<IndexSubmitResult> {
  if (urls.length === 0) {
    return { provider, ok: true, message: "No URLs to submit", submittedCount: 0, urlCount: 0 };
  }

  switch (provider) {
    case "indexnow": {
      const result = await submitIndexNowBatched(urls, { updateMatchingCredentialRows: true });
      return {
        provider,
        ok: result.ok,
        message: result.message,
        submittedCount: result.submittedCount,
        urlCount: result.totalUrls,
      };
    }
    case "gsc": {
      const creds = await getGscCredentials();
      if (!creds) {
        return {
          provider,
          ok: false,
          message: "GSC not configured — add service account or OAuth in Orbit credentials",
          submittedCount: 0,
          urlCount: urls.length,
        };
      }
      const sitemapUrl = getSitemapUrl();
      let ok = false;
      let message = "";
      if (creds.mode === "oauth" && creds.accessToken) {
        const { submitSitemapWithAccessToken } = await import("@/lib/google-indexing");
        const res = await submitSitemapWithAccessToken(creds.accessToken, creds.site, sitemapUrl);
        ok = res.ok;
        message = res.error || "Sitemap submitted to GSC";
      } else if (creds.sa) {
        const res = await submitSitemapToGSC(creds.sa, creds.site, sitemapUrl);
        ok = res.ok;
        message = res.error || "Sitemap submitted to GSC";
      }
      return {
        provider,
        ok,
        message: ok ? `✓ GSC sitemap: ${sitemapUrl}` : message,
        submittedCount: ok ? urls.length : 0,
        urlCount: urls.length,
      };
    }
    case "google_indexing": {
      const creds = await getGscCredentials();
      if (!creds?.sa) {
        return {
          provider,
          ok: false,
          message: "Google Indexing API requires service account credentials",
          submittedCount: 0,
          urlCount: urls.length,
        };
      }
      const batch = urls.slice(0, GOOGLE_INDEXING_BATCH);
      const result = await submitUrlsToGoogleIndexingApi(creds.sa, batch);
      const ok = result.submitted > 0 && result.errors.length === 0;
      return {
        provider,
        ok,
        message:
          result.errors[0] ||
          `Google Indexing API: ${result.submitted}/${batch.length} URLs submitted`,
        submittedCount: result.submitted,
        urlCount: batch.length,
      };
    }
    default:
      return {
        provider: provider as IndexProvider,
        ok: false,
        message: `Unsupported index provider: ${String(provider)}`,
        submittedCount: 0,
        urlCount: urls.length,
      };
  }
}

export async function submitToProviders(
  providers: IndexProvider[],
  urls: string[],
): Promise<IndexSubmitResult[]> {
  const results: IndexSubmitResult[] = [];
  for (const provider of providers) {
    results.push(await submitToIndexProvider(provider, urls));
  }
  return results;
}
