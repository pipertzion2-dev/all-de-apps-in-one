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

  // Step 4 — service account (optional enhancement)
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
        label: "Service account (optional)",
        status: "ok",
        detail: `Active — ${sa.client_email}. Enables GSC data API access.`,
      });
    } catch (e: any) {
      steps.push({
        id: "service_account",
        label: "Service account (optional)",
        status: "warn",
        detail: `Saved but auth failed: ${e?.message?.slice(0, 120)}`,
      });
    }
  } else {
    steps.push({
      id: "service_account",
      label: "Service account (optional)",
      status: "skip",
      detail: "Not configured. Add one to enable GSC data API features (impressions, clicks).",
    });
  }

  const passing = steps.filter((s) => s.status === "ok").length;
  const total = steps.filter((s) => s.status !== "skip").length;

  return ok({
    steps,
    score: total > 0 ? Math.round((passing / total) * 100) : 0,
    siteUrl: rawUrl,
    serviceAccountEmail: sa?.client_email || null,
  });
}
