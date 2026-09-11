import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { db } from "@/lib/db";
import { seedCredentials, blogPosts, seoLandingPages } from "@/lib/schema";
import { eq, isNotNull } from "drizzle-orm";
import { isDuplicateSeoVariantSlug } from "@/lib/seo/duplicate-variants";
import { fetchGscSearchAnalytics } from "@/lib/seo/gsc-search-analytics";
import { getCanonicalUrlsForIndexing } from "@/lib/seo/sitemap/registry";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://zzaizzai.com";

type Check = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "info";
  detail: string;
  value?: string | number;
  link?: { label: string; href: string };
};

async function fetchText(
  url: string,
  timeoutMs = 8000,
): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "ZZAI-Health-Check/1.0" },
      cache: "no-store",
    });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  } catch (e: any) {
    return { ok: false, status: 0, text: e?.message || "fetch failed" };
  }
}

export async function GET() {
  if (!(await isOrbitAdminAllowed())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checks: Check[] = [];

  // 1. Homepage reachable + meta quality
  const home = await fetchText(SITE);
  if (!home.ok) {
    checks.push({
      id: "home",
      label: "Homepage reachable",
      status: "fail",
      detail: `HTTP ${home.status} — site is down or unreachable.`,
    });
  } else {
    const title = home.text.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
    const desc =
      home.text.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]?.trim() || "";
    const og = /<meta\s+property="og:image"/i.test(home.text);
    const canonical =
      home.text.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]?.trim() || "";

    checks.push({
      id: "home",
      label: "Homepage reachable",
      status: "ok",
      detail: `${SITE} → 200 OK`,
      value: `${(home.text.length / 1024).toFixed(0)} KB`,
    });
    checks.push({
      id: "title",
      label: "Page title",
      status: title.length >= 30 && title.length <= 65 ? "ok" : title ? "warn" : "fail",
      detail: title || "(missing)",
      value: `${title.length} chars`,
    });
    checks.push({
      id: "desc",
      label: "Meta description",
      status: desc.length >= 80 && desc.length <= 250 ? "ok" : desc ? "warn" : "fail",
      detail: desc || "(missing)",
      value: `${desc.length} chars`,
    });
    checks.push({
      id: "og",
      label: "OpenGraph image",
      status: og ? "ok" : "warn",
      detail: og
        ? "Configured — social previews will look good."
        : "Missing — social shares will look bare.",
    });
    checks.push({
      id: "canonical",
      label: "Canonical URL",
      status: canonical ? "ok" : "warn",
      detail: canonical || "Not set — Google may treat duplicates separately.",
    });
  }

  // 2. robots.txt
  const robots = await fetchText(`${SITE}/robots.txt`);
  checks.push({
    id: "robots",
    label: "robots.txt",
    status: robots.ok && robots.text.includes("Sitemap:") ? "ok" : robots.ok ? "warn" : "fail",
    detail: robots.ok
      ? robots.text.includes("Sitemap:")
        ? "Allows crawlers + exposes sitemap."
        : "Reachable but does not point to sitemap."
      : `Unreachable (${robots.status})`,
  });

  // 3. Sitemap
  const sitemap = await fetchText(`${SITE}/sitemap.xml`, 15000);
  if (!sitemap.ok) {
    checks.push({
      id: "sitemap",
      label: "Sitemap",
      status: "fail",
      detail: `HTTP ${sitemap.status} — Google cannot discover your pages.`,
    });
  } else {
    const urlCount = (sitemap.text.match(/<loc>/g) || []).length;
    checks.push({
      id: "sitemap",
      label: "Sitemap",
      status: urlCount > 0 ? "ok" : "warn",
      detail: `${urlCount.toLocaleString()} URL${urlCount === 1 ? "" : "s"} discovered.`,
      value: urlCount,
    });
  }

  // 4. IndexNow key + last submission
  let indexnowKey: string | null = null;
  let lastSubmit: Date | null = null;
  try {
    const [row] = await db
      .select({ key: seedCredentials.indexnowKey, last: seedCredentials.lastIndexnowSubmit })
      .from(seedCredentials)
      .where(isNotNull(seedCredentials.indexnowKey))
      .limit(1);
    indexnowKey = row?.key ?? null;
    lastSubmit = row?.last ?? null;
  } catch {}

  if (!indexnowKey) {
    checks.push({
      id: "indexnow-key",
      label: "IndexNow key",
      status: "warn",
      detail: "Not configured. Bing, Yandex, and DuckDuckGo will only crawl on their own schedule.",
      link: { label: "Configure", href: "/dashboard/launchpad" },
    });
  } else {
    // Verify key file is served
    const keyFile = await fetchText(`${SITE}/${indexnowKey}.txt`);
    const validKeyFile = keyFile.ok && keyFile.text.trim() === indexnowKey;
    checks.push({
      id: "indexnow-key",
      label: "IndexNow key",
      status: validKeyFile ? "ok" : "fail",
      detail: validKeyFile
        ? `Verified at /${indexnowKey.slice(0, 8)}…txt — Bing & friends will accept submissions.`
        : "Key file not served correctly. Bing will reject submissions.",
    });
    checks.push({
      id: "indexnow-last",
      label: "Last IndexNow submission",
      status: lastSubmit
        ? Date.now() - lastSubmit.getTime() < 7 * 24 * 60 * 60 * 1000
          ? "ok"
          : "warn"
        : "warn",
      detail: lastSubmit
        ? `${lastSubmit.toLocaleString()} (${humanAgo(lastSubmit)})`
        : "Never submitted. Run Orbit to ping Bing & Yandex.",
      link: { label: "Run Orbit", href: "/dashboard/launchpad" },
    });
  }

  // 5. Content inventory
  let blogCount = 0;
  let seoCount = 0;
  try {
    const [b] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    const all = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    blogCount = all.length;
    const seo = await db
      .select({ id: seoLandingPages.id })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    seoCount = seo.length;
  } catch {}

  checks.push({
    id: "content",
    label: "Published content",
    status: blogCount + seoCount > 20 ? "ok" : blogCount + seoCount > 0 ? "warn" : "fail",
    detail: `${blogCount} blog post${blogCount === 1 ? "" : "s"} + ${seoCount} SEO landing page${seoCount === 1 ? "" : "s"}`,
    value: blogCount + seoCount,
  });

  // 6. Duplicate doorway variants still published
  let variantCount = 0;
  try {
    const pages = await db
      .select({ slug: seoLandingPages.slug })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    variantCount = pages.filter((p) => p.slug && isDuplicateSeoVariantSlug(p.slug)).length;
  } catch {}
  checks.push({
    id: "variants",
    label: "Duplicate SEO variants",
    status: variantCount === 0 ? "ok" : variantCount <= 5 ? "warn" : "fail",
    detail:
      variantCount === 0
        ? "One canonical URL per tool — no doorway duplicates."
        : `${variantCount} duplicate variant(s) still published (free-*, *-guide, best-*). Run traffic quality repair.`,
    value: variantCount,
    link: variantCount ? { label: "Run repair", href: "/dashboard/launchpad" } : undefined,
  });

  // 7. GSC traffic (real ranking signal)
  let gscClicks = 0;
  let gscImpressions = 0;
  try {
    const gsc = await fetchGscSearchAnalytics({ days: 28, rowLimit: 50 });
    if (gsc.ok) {
      gscClicks = gsc.queries.reduce((n, q) => n + q.clicks, 0);
      gscImpressions = gsc.queries.reduce((n, q) => n + q.impressions, 0);
      checks.push({
        id: "gsc-traffic",
        label: "Search traffic (28d)",
        status: gscClicks >= 10 ? "ok" : gscImpressions >= 50 ? "warn" : "fail",
        detail:
          gscClicks > 0
            ? `${gscClicks} clicks, ${gscImpressions.toLocaleString()} impressions in GSC (last 28 days).`
            : gscImpressions > 0
              ? `${gscImpressions.toLocaleString()} impressions but 0 clicks — improve titles and meta descriptions.`
              : "No GSC impressions yet — focus on unique content, not page count.",
        value: gscClicks,
        link: { label: "Search Console", href: "https://search.google.com/search-console" },
      });
    } else {
      checks.push({
        id: "gsc-traffic",
        label: "Search traffic (28d)",
        status: "warn",
        detail: gsc.error || "GSC not connected — connect to track real traffic.",
        link: { label: "Connect GSC", href: "/dashboard/gsc-connect" },
      });
    }
  } catch {
    checks.push({
      id: "gsc-traffic",
      label: "Search traffic (28d)",
      status: "info",
      detail: "Could not fetch GSC data.",
    });
  }

  // 8. Sitemap size vs raw DB (quality-filtered)
  let sitemapUrlCount = 0;
  try {
    sitemapUrlCount = (await getCanonicalUrlsForIndexing()).length;
  } catch {}
  checks.push({
    id: "sitemap-quality",
    label: "Quality-filtered sitemap",
    status: sitemapUrlCount >= 30 ? "ok" : sitemapUrlCount > 0 ? "warn" : "fail",
    detail: `${sitemapUrlCount} URLs pass quality gate (thin/duplicate pages excluded).`,
    value: sitemapUrlCount,
  });

  // Quick links (informational)
  const liveLinks = [
    {
      label: "Google: site:zzaizzai.com",
      href: `https://www.google.com/search?q=site%3A${encodeURIComponent(new URL(SITE).hostname)}`,
    },
    {
      label: "Bing: site:zzaizzai.com",
      href: `https://www.bing.com/search?q=site%3A${encodeURIComponent(new URL(SITE).hostname)}`,
    },
    { label: "Google Search Console", href: "https://search.google.com/search-console" },
    { label: "Bing Webmaster Tools", href: "https://www.bing.com/webmasters" },
    { label: "IndexNow status", href: "https://www.bing.com/indexnow" },
  ];

  // Overall score — warnings and traffic matter, not just uptime
  const okCount = checks.filter((c) => c.status === "ok").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const infoCount = checks.filter((c) => c.status === "info").length;
  const weighted =
    okCount * 1 + warnCount * 0.5 + failCount * 0 + infoCount * 0.75;
  const scoreable = checks.length - infoCount || checks.length;
  let score = Math.round((weighted / scoreable) * 100);
  if (gscClicks === 0 && gscImpressions < 50) score = Math.min(score, 65);
  if (variantCount > 10) score = Math.min(score, 50);

  return NextResponse.json({
    site: SITE,
    score,
    summary: {
      ok: okCount,
      warn: warnCount,
      fail: failCount,
      info: infoCount,
      total: checks.length,
    },
    checks,
    liveLinks,
    checkedAt: new Date().toISOString(),
  });
}

function humanAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
