import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createSign } from "crypto";
import { getSiteUrl, getSitemapUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

interface ServiceAccount {
  private_key: string;
  client_email: string;
  token_uri: string;
  project_id?: string;
}

function base64url(str: string | Buffer): string {
  const b = typeof str === "string" ? Buffer.from(str) : str;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri, exp: now + 3600, iat: now }));
  const sigInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(sigInput);
  const sig = base64url(sign.sign(sa.private_key));
  const jwt = `${sigInput}.${sig}`;
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Token: ${res.status} — ${t.slice(0, 200)}`); }
  return (await res.json()).access_token;
}

export type DiagStep = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "skip";
  detail: string;
  fix?: string;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);

  const steps: DiagStep[] = [];
  const canonicalSite = getSiteUrl();
  const canonicalSitemap = getSitemapUrl();

  // Step 1 — site URL format
  const rawUrl = creds?.googleSiteUrl || "";
  const siteUrl = rawUrl.trim();
  const urlOk = siteUrl.startsWith("https://") || siteUrl.startsWith("http://") || siteUrl.startsWith("sc-domain:");
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
    const smRes = await fetch(canonicalSitemap, { signal: AbortSignal.timeout(8000), method: "GET" });
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
    steps.push({ id: "sitemap_accessible", label: "Sitemap accessible", status: "fail", detail: `Could not reach ${canonicalSitemap}.` });
  }

  // Step 3 — IndexNow key file
  const indexnowKey = creds?.indexnowKey || "";
  if (indexnowKey) {
    try {
      const keyRes = await fetch(`${canonicalSite}/${indexnowKey}.txt`, { signal: AbortSignal.timeout(8000), method: "HEAD" });
      steps.push({
        id: "indexnow_key",
        label: "IndexNow key file",
        status: keyRes.ok ? "ok" : "fail",
        detail: keyRes.ok
          ? `Key file reachable at /${indexnowKey}.txt`
          : `Key file not found (HTTP ${keyRes.status}). Bing/IndexNow submissions will fail.`,
      });
    } catch {
      steps.push({ id: "indexnow_key", label: "IndexNow key file", status: "fail", detail: "Could not reach IndexNow key file." });
    }
  } else {
    steps.push({ id: "indexnow_key", label: "IndexNow key file", status: "skip", detail: "No IndexNow key configured." });
  }

  // Step 4 — service account (optional enhancement)
  let sa: ServiceAccount | null = null;
  try {
    const saJson = creds?.googleServiceAccountJson || null;
    if (saJson) sa = JSON.parse(saJson);
  } catch { /* ignore */ }

  if (sa) {
    try {
      await getAccessToken(sa, "https://www.googleapis.com/auth/webmasters.readonly");
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

  return NextResponse.json({
    steps,
    score: total > 0 ? Math.round((passing / total) * 100) : 0,
    siteUrl: rawUrl,
    serviceAccountEmail: sa?.client_email || null,
  });
}
