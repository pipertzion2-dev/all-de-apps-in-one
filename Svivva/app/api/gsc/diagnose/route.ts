import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl, getSitemapUrl } from "@/lib/site-url";
import {
  getGoogleServiceAccountAccessToken,
  GoogleServiceAccount,
} from "@/lib/google-service-account";
import {
  ensureGscOAuthColumns,
  getGoogleOAuthAccessTokenForUser,
  isGoogleGscOAuthConfigured,
  listGscSites,
  matchGscSiteToCanonical,
} from "@/lib/google-gsc-oauth";
import { forbidden, ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";

export type DiagStep = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "skip";
  detail: string;
  fix?: string;
};

export async function GET() {
  if (!(await isOrbitAdminAllowed())) return forbidden();

  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";

  await ensureGscOAuthColumns();

  const [creds] = await db
    .select()
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);

  const steps: DiagStep[] = [];
  const canonicalSite = getSiteUrl();
  const canonicalSitemap = getSitemapUrl();

  // Step 1 — site URL format
  const rawUrl = creds?.googleSiteUrl || "";
  const siteUrl = rawUrl.trim();
  const urlOk =
    siteUrl.startsWith("https://") ||
    siteUrl.startsWith("http://") ||
    siteUrl.startsWith("sc-domain:");
  steps.push({
    id: "site_url",
    label: "Site URL format",
    status: !siteUrl ? "fail" : urlOk ? "ok" : "warn",
    detail: !siteUrl
      ? "No site URL saved."
      : urlOk
        ? `Saved as: ${siteUrl}`
        : `Saved as "${siteUrl}" — GSC requires a full URL with protocol (e.g. ${canonicalSite}). Click Fix to auto-correct.`,
    fix: !urlOk && siteUrl ? "https://" + siteUrl.replace(/^\/+/, "").toLowerCase() : undefined,
  });

  // Step 2 — sitemap accessible
  // Use GET (not HEAD): Next.js sitemap routes don't always answer HEAD,
  // which would cause spurious "fail" status here.
  let sitemapOk = false;
  try {
    const smRes = await fetch(canonicalSitemap, {
      signal: AbortSignal.timeout(8000),
      method: "GET",
    });
    sitemapOk = smRes.ok;
    steps.push({
      id: "sitemap_accessible",
      label: "Sitemap accessible",
      status: sitemapOk ? "ok" : "fail",
      detail: sitemapOk
        ? `${canonicalSitemap} is publicly reachable.`
        : `Sitemap returned HTTP ${smRes.status}. Google cannot crawl it.`,
    });
  } catch {
    steps.push({
      id: "sitemap_accessible",
      label: "Sitemap accessible",
      status: "fail",
      detail: `Could not reach ${canonicalSitemap}.`,
    });
  }

  // Step 3 — IndexNow key file
  const indexnowKey = creds?.indexnowKey || "";
  if (indexnowKey) {
    try {
      const keyRes = await fetch(`${canonicalSite}/${indexnowKey}.txt`, {
        signal: AbortSignal.timeout(8000),
        method: "HEAD",
      });
      steps.push({
        id: "indexnow_key",
        label: "IndexNow key file",
        status: keyRes.ok ? "ok" : "fail",
        detail: keyRes.ok
          ? `Key file reachable at /${indexnowKey}.txt`
          : `Key file not found (HTTP ${keyRes.status}). Bing/IndexNow submissions will fail.`,
      });
    } catch {
      steps.push({
        id: "indexnow_key",
        label: "IndexNow key file",
        status: "fail",
        detail: "Could not reach IndexNow key file.",
      });
    }
  } else {
    steps.push({
      id: "indexnow_key",
      label: "IndexNow key file",
      status: "skip",
      detail: "No IndexNow key configured.",
    });
  }

  // Step 4 — Google account (OAuth — recommended)
  const oauthEmail = creds?.googleOauthEmail || null;
  const oauthConnected = !!creds?.googleOauthRefreshToken?.trim();
  if (oauthConnected) {
    steps.push({
      id: "google_oauth",
      label: "Google account connected",
      status: "ok",
      detail: oauthEmail
        ? `Signed in as ${oauthEmail}. Orbit can submit sitemaps and request indexing automatically.`
        : "Google OAuth connected. Orbit can submit sitemaps and request indexing automatically.",
    });
  } else {
    steps.push({
      id: "google_oauth",
      label: "Google account",
      status: isGoogleGscOAuthConfigured() ? "fail" : "warn",
      detail: isGoogleGscOAuthConfigured()
        ? "Not connected — click Connect with Google (one sign-in, AI configures the rest)."
        : "OAuth not configured on server — set GOOGLE_GSC_CLIENT_ID + SECRET in Vercel, or use service account below.",
    });
  }

  // Step 5 — service account (legacy / optional)
  let sa: GoogleServiceAccount | null = null;
  try {
    const saJson = creds?.googleServiceAccountJson || null;
    if (saJson) sa = JSON.parse(saJson) as GoogleServiceAccount;
  } catch {
    /* ignore */
  }

  if (sa) {
    try {
      await getGoogleServiceAccountAccessToken(
        sa,
        "https://www.googleapis.com/auth/webmasters.readonly",
      );
      steps.push({
        id: "service_account",
        label: "Service account (advanced)",
        status: "ok",
        detail: `Active — ${sa.client_email}. Enables GSC data API access.`,
      });
    } catch (e: any) {
      steps.push({
        id: "service_account",
        label: "Service account (advanced)",
        status: "warn",
        detail: `Saved but auth failed: ${e?.message?.slice(0, 120)}`,
      });
    }
  } else {
    steps.push({
      id: "service_account",
      label: "Service account (advanced)",
      status: "skip",
      detail: "Not configured. Use Connect with Google above — easier than service account JSON.",
    });
  }

  const passing = steps.filter((s) => s.status === "ok").length;
  const total = steps.filter((s) => s.status !== "skip").length;

  let gscPropertyOk = false;
  let gscMatchedSite: string | null = null;
  let gscSitesSample: string[] = [];

  if (oauthConnected) {
    try {
      const accessToken = await getGoogleOAuthAccessTokenForUser(userId);
      if (accessToken) {
        const sites = await listGscSites(accessToken);
        gscSitesSample = sites.slice(0, 8).map((s) => s.siteUrl);
        const matchedUrl = matchGscSiteToCanonical(sites, canonicalSite);
        const matched = matchedUrl ? sites.find((s) => s.siteUrl === matchedUrl) : undefined;
        gscMatchedSite = matchedUrl;
        const level = matched?.permissionLevel?.toLowerCase() ?? "";
        gscPropertyOk =
          !!matched && (level.includes("owner") || level.includes("full"));
        steps.push({
          id: "gsc_property",
          label: "Search Console property",
          status: gscPropertyOk ? "ok" : matched ? "warn" : "fail",
          detail: gscPropertyOk
            ? `Verified: ${gscMatchedSite} (${matched?.permissionLevel})`
            : matched
              ? `Found ${gscMatchedSite} but permission is "${matched?.permissionLevel}" — need Owner or Full.`
              : sites.length
                ? `No property matches ${canonicalSite}. Add it in Search Console, then reconnect.`
                : "No Search Console properties on this Google account — add https://svivva.com first.",
          fix: gscPropertyOk ? undefined : "https://search.google.com/search-console",
        });
      }
    } catch (e: unknown) {
      steps.push({
        id: "gsc_property",
        label: "Search Console property",
        status: "warn",
        detail: `Could not list properties: ${e instanceof Error ? e.message : String(e)}`.slice(0, 160),
        fix: "https://search.google.com/search-console",
      });
    }
  }

  return ok({
    steps,
    score: total > 0 ? Math.round((passing / total) * 100) : 0,
    siteUrl: rawUrl,
    serviceAccountEmail: sa?.client_email || null,
    oauthConnected,
    oauthEmail,
    oauthAvailable: isGoogleGscOAuthConfigured(),
    gscPropertyOk,
    gscMatchedSite,
    gscSitesSample,
  });
}
