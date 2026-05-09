import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { seedCredentials, blogPosts, seoLandingPages } from "@/lib/schema";
import { eq, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

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
      headers: { "User-Agent": "Svivva-Health-Check/1.0" },
      cache: "no-store",
    });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  } catch (e: any) {
    return { ok: false, status: 0, text: e?.message || "fetch failed" };
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
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

  // 6. Quick links (informational)
  const liveLinks = [
    {
      label: "Google: site:svivva.com",
      href: `https://www.google.com/search?q=site%3A${encodeURIComponent(new URL(SITE).hostname)}`,
    },
    {
      label: "Bing: site:svivva.com",
      href: `https://www.bing.com/search?q=site%3A${encodeURIComponent(new URL(SITE).hostname)}`,
    },
    { label: "Google Search Console", href: "https://search.google.com/search-console" },
    { label: "Bing Webmaster Tools", href: "https://www.bing.com/webmasters" },
    { label: "IndexNow status", href: "https://www.bing.com/indexnow" },
  ];

  // Overall score
  const okCount = checks.filter((c) => c.status === "ok").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const score = Math.round((okCount / checks.length) * 100);

  return NextResponse.json({
    site: SITE,
    score,
    summary: { ok: okCount, warn: warnCount, fail: failCount, total: checks.length },
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
