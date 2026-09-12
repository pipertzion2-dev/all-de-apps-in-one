import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl, getSitemapUrl, getSecuritySitemapUrl, getSiteHostname } from "@/lib/site-url";
import {
  getGoogleServiceAccountAccessToken,
  GoogleServiceAccount,
} from "@/lib/google-service-account";
import {
  ensureGscOAuthColumns,
  getGoogleOAuthAccessTokenForUser,
  isGoogleGscOAuthConfigured,
  listGscSites,
  listGscSitemaps,
  findMatchedGscSite,
  hasGscWritePermission,
  type GscSitemapStatus,
} from "@/lib/google-gsc-oauth";
import { forbidden, ok } from "@/lib/http-response";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { getActiveIndexNowKey, verifyIndexNowKeyFile } from "@/lib/indexing/indexnow-key";
import { getGscConnectionStatus } from "@/lib/orbit/gsc-connection-status";
import { fetchGscSearchAnalytics } from "@/lib/seo/gsc-search-analytics";

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

  await hydratePlatformSecrets();

  const userId = await resolveGscCredentialsUserId();

  await ensureGscOAuthColumns();

  const [creds] = await db
    .select()
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);

  const steps: DiagStep[] = [];
  const canonicalSite = getSiteUrl();
  const canonicalSitemap = getSitemapUrl();
  const gscStatus = await getGscConnectionStatus();

  // Step 0 — HTML site verification tag (required before GSC property verification)
  try {
    const homeRes = await fetch(canonicalSite, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const homeHtml = homeRes.ok ? await homeRes.text() : "";
    const envToken = process.env.GOOGLE_SITE_VERIFICATION?.trim();
    const hasMeta = /google-site-verification/i.test(homeHtml);
    steps.push({
      id: "site_verification_meta",
      label: "Google site verification meta tag",
      status: hasMeta || envToken ? "ok" : "warn",
      detail: hasMeta
        ? "Homepage includes google-site-verification meta tag."
        : envToken
          ? "GOOGLE_SITE_VERIFICATION is set in env (meta may render at runtime)."
          : "No verification meta on homepage — add GOOGLE_SITE_VERIFICATION in Vercel or save token in dashboard before verifying in Search Console.",
      fix: hasMeta ? undefined : "https://search.google.com/search-console/welcome",
    });
  } catch {
    steps.push({
      id: "site_verification_meta",
      label: "Google site verification meta tag",
      status: "skip",
      detail: "Could not fetch homepage to check verification meta.",
    });
  }

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

  // Step 3 — IndexNow key file (global key — may live on a different seed_credentials row)
  const indexnowKey = (await getActiveIndexNowKey()) || "";
  if (indexnowKey) {
    const keyCheck = await verifyIndexNowKeyFile(indexnowKey);
    steps.push({
      id: "indexnow_key",
      label: "IndexNow key file",
      status: keyCheck.ok ? "ok" : "fail",
      detail: keyCheck.ok ? keyCheck.detail : keyCheck.detail,
      fix: keyCheck.ok ? undefined : "Run “Set Up IndexNow” in Orbit, then re-run Complete Now.",
    });
  } else {
    steps.push({
      id: "indexnow_key",
      label: "IndexNow key file",
      status: "skip",
      detail: "No IndexNow key configured.",
      fix: "Run “Set Up IndexNow” in Orbit launchpad.",
    });
  }

  // Step 4 — Google account (OAuth — recommended)
  const oauthEmail = gscStatus.oauthEmail || creds?.googleOauthEmail || null;
  const oauthConnected = gscStatus.oauthConnected;
  let oauthAccessToken: string | null = oauthConnected
    ? await getGoogleOAuthAccessTokenForUser(userId)
    : null;

  if (oauthConnected && oauthAccessToken) {
    steps.push({
      id: "google_oauth",
      label: "Google account connected",
      status: "ok",
      detail: oauthEmail
        ? `Signed in as ${oauthEmail}. Orbit can submit sitemaps and request indexing automatically.`
        : "Google OAuth connected. Orbit can submit sitemaps and request indexing automatically.",
    });
  } else if (oauthEmail) {
    steps.push({
      id: "google_oauth",
      label: "Google account",
      status: "fail",
      detail: `Previously signed in as ${oauthEmail}, but the session expired. Click Connect with Google again on /dashboard/gsc-connect — IndexNow still works without this.`,
      fix: "/dashboard/gsc-connect",
    });
  } else {
    steps.push({
      id: "google_oauth",
      label: "Google account",
      status: isGoogleGscOAuthConfigured() ? "fail" : "warn",
      detail: isGoogleGscOAuthConfigured()
        ? "Not connected — click Connect with Google (one sign-in, Orbit submits sitemaps and indexing automatically)."
        : "OAuth not configured — paste client ID + secret on this page, or set GOOGLE_GSC_CLIENT_ID + SECRET in Vercel.",
      fix: isGoogleGscOAuthConfigured() ? "/dashboard/gsc-connect" : undefined,
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
  let gscSitemaps: GscSitemapStatus[] = [];

  if (oauthConnected && oauthAccessToken) {
    try {
      const accessToken = oauthAccessToken;
      if (accessToken) {
        const sites = await listGscSites(accessToken);
        gscSitesSample = sites.slice(0, 8).map((s) => s.siteUrl);
        const matched = findMatchedGscSite(sites, canonicalSite);
        gscMatchedSite = matched?.siteUrl ?? null;
        gscPropertyOk = !!matched && hasGscWritePermission(matched.permissionLevel);
        steps.push({
          id: "gsc_property",
          label: "Search Console property",
          status: gscPropertyOk ? "ok" : matched ? "warn" : "fail",
          detail: gscPropertyOk
            ? `Verified: ${gscMatchedSite} (${matched?.permissionLevel})`
            : matched
              ? `Found ${gscMatchedSite} but permission is "${matched?.permissionLevel}" — need Owner or Full.`
              : sites.length
                ? `No property matches ${canonicalSite}. Add sc-domain:${getSiteHostname()} or ${canonicalSite}/ in Search Console (Owner), then Sync property.`
                : `No Search Console properties on this Google account — add ${getSiteHostname()} first.`,
          fix: gscPropertyOk ? undefined : "https://search.google.com/search-console",
        });

        const host = getSiteHostname();
        const otherDeadProps = gscSitesSample.filter(
          (s) =>
            s.toLowerCase().includes("svivva") ||
            (s.startsWith("sc-domain:") && !s.toLowerCase().includes(host)),
        );
        if (gscPropertyOk && otherDeadProps.length > 0) {
          steps.push({
            id: "gsc_wrong_property_hint",
            label: "Open the right GSC property",
            status: "warn",
            detail: `This Google account also has ${otherDeadProps.join(", ")}. New ${host} pages only appear under sc-domain:${host} (or ${canonicalSite}/) — not under old/disabled properties.`,
            fix: `https://search.google.com/search-console?resource_id=${encodeURIComponent(gscMatchedSite || `sc-domain:${host}`)}`,
          });
        }

        if (gscMatchedSite) {
          try {
            gscSitemaps = await listGscSitemaps(accessToken, gscMatchedSite);
            const mainPath = getSitemapUrl();
            const securityPath = getSecuritySitemapUrl();
            const main = gscSitemaps.find((s) => s.path === mainPath);
            const security = gscSitemaps.find((s) => s.path === securityPath);
            const pending = gscSitemaps.filter((s) => s.isPending).length;
            const withErrors = gscSitemaps.filter((s) => Number(s.errors || 0) > 0);
            steps.push({
              id: "gsc_sitemaps",
              label: "Sitemaps Google has registered",
              status: withErrors.length ? "warn" : main ? "ok" : "warn",
              detail: main
                ? `${gscSitemaps.length} sitemap(s) on property. Main: last downloaded ${main.lastDownloaded || "not yet"} · submitted ${main.lastSubmitted || "—"}${main.isPending ? " · pending" : ""}${security ? ` · security sitemap registered` : " · security sitemap not registered yet"}${withErrors.length ? ` · ${withErrors.length} with errors` : ""}${pending ? ` · ${pending} pending` : ""}. Indexed counts in GSC often lag days behind submission.`
                : `No ${mainPath} registered on this property yet — Sync property / Run indexing to submit it.`,
              fix: `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(gscMatchedSite)}`,
            });
          } catch (e: unknown) {
            steps.push({
              id: "gsc_sitemaps",
              label: "Sitemaps Google has registered",
              status: "warn",
              detail:
                `Could not list GSC sitemaps: ${e instanceof Error ? e.message : String(e)}`.slice(
                  0,
                  160,
                ),
            });
          }
        }
      }
    } catch (e: unknown) {
      steps.push({
        id: "gsc_property",
        label: "Search Console property",
        status: "warn",
        detail: `Could not list properties: ${e instanceof Error ? e.message : String(e)}`.slice(
          0,
          160,
        ),
        fix: "https://search.google.com/search-console",
      });
    }
  }

  // Step — live search performance (proxy for “is Google showing any pages?”)
  let searchPerformance: {
    ok: boolean;
    impressions: number;
    clicks: number;
    pagesWithImpressions: number;
    queries: number;
    topPages: string[];
  } | null = null;
  if (oauthConnected) {
    try {
      const gsc = await fetchGscSearchAnalytics({ days: 90, rowLimit: 250 });
      if (gsc.ok) {
        const impressions = gsc.queries.reduce((n, q) => n + q.impressions, 0);
        const clicks = gsc.queries.reduce((n, q) => n + q.clicks, 0);
        searchPerformance = {
          ok: true,
          impressions,
          clicks,
          pagesWithImpressions: gsc.pages.length,
          queries: gsc.queries.length,
          topPages: gsc.pages.slice(0, 5).map((p) => p.keys[0] ?? ""),
        };
        steps.push({
          id: "gsc_search_performance",
          label: "Google search visibility (90d)",
          status:
            clicks >= 10 ? "ok" : impressions >= 20 || gsc.pages.length >= 3 ? "warn" : "fail",
          detail:
            impressions > 0
              ? `${gsc.pages.length} page(s) with impressions, ${impressions.toLocaleString()} total impressions, ${clicks} clicks (last 90 days). Submission ≠ instant indexing — Google can take days to weeks for new URLs.`
              : "No impressions in the last 90 days on this property. Confirm you are viewing sc-domain:zzaizzai.com (not svivva.com). Sitemap + IndexNow are working; focus on unique content and wait for crawl cycles.",
          fix:
            impressions === 0
              ? `https://search.google.com/search-console?resource_id=${encodeURIComponent(gscMatchedSite || `sc-domain:${getSiteHostname()}`)}`
              : undefined,
        });
      } else {
        steps.push({
          id: "gsc_search_performance",
          label: "Google search visibility (90d)",
          status: "skip",
          detail: gsc.error || "Could not load Search Analytics.",
        });
      }
    } catch (e: unknown) {
      steps.push({
        id: "gsc_search_performance",
        label: "Google search visibility (90d)",
        status: "skip",
        detail: `Search Analytics error: ${e instanceof Error ? e.message : String(e)}`.slice(
          0,
          160,
        ),
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
    gscSitemaps,
    searchPerformance,
    canonicalSite,
    canonicalSitemap,
  });
}
