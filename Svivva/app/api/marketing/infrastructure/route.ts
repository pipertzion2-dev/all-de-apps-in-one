import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts, seedCredentials } from "@/lib/schema";
import { eq, like, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { sql } from "drizzle-orm";

const GODADDY_API = "https://api.godaddy.com/v1";
const ROOT_CATEGORIES = ["seo-landing", "seed-marketing"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

    const [toolCount] = await db
      .select({ count: count() })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));

    const allPages = await db
      .select({ slug: seoLandingPages.slug, category: seoLandingPages.category, title: seoLandingPages.title, toolUrl: seoLandingPages.toolUrl })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));

    const [blogCount] = await db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.published, true));

    const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);

    const toolPages = allPages.filter((p) => !ROOT_CATEGORIES.includes(p.category || ""));
    const rootPages = allPages.filter((p) => ROOT_CATEGORIES.includes(p.category || ""));
    const seedPages = allPages.filter((p) => p.category === "seed-marketing");
    const userAppPages = allPages.filter((p) => p.toolUrl?.startsWith("app:"));

    const staticCount = 8;
    const lpCount = 3;
    const totalSitemapUrls = staticCount + (blogCount?.count || 0) + toolPages.length + rootPages.length + lpCount;

    const infrastructure = {
      domain: {
        configured: !!(creds?.godaddyDomain || creds?.customDomain),
        domain: creds?.godaddyDomain || creds?.customDomain || null,
        hasGodaddyCreds: !!(creds?.godaddyApiKey && creds?.godaddyApiSecret),
        verified: !!(creds?.domainVerified),
      },
      google: {
        analyticsId: process.env.NEXT_PUBLIC_GA_ID || null,
        adsId: process.env.NEXT_PUBLIC_GADS_ID || null,
        siteUrl: creds?.googleSiteUrl || null,
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        robotsUrl: `${baseUrl}/robots.txt`,
      },
      content: {
        totalSitemapUrls,
        toolPages: toolPages.length,
        rootSeoPages: rootPages.length,
        seedMarketingPages: seedPages.length,
        userAppPages: userAppPages.length,
        blogPosts: blogCount?.count || 0,
      },
      pages: {
        tools: toolPages.map((p) => ({ slug: p.slug, url: `${baseUrl}/tools/${p.slug}`, title: p.title })),
        root: rootPages.map((p) => ({ slug: p.slug, url: `${baseUrl}/${p.slug}`, title: p.title })),
      },
    };

    return NextResponse.json(infrastructure);
  } catch (e) {
    console.error("marketing infrastructure GET error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, replitDomain, googleSiteUrl } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

    if (action === "submit-sitemap") {
      const sitemapUrl = `${googleSiteUrl || baseUrl}/sitemap.xml`;
      const results = await Promise.allSettled([
        fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { signal: AbortSignal.timeout(5000) }),
        fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { signal: AbortSignal.timeout(5000) }),
      ]);
      const googleOk = results[0].status === "fulfilled" && (results[0].value as Response).ok;
      const bingOk = results[1].status === "fulfilled" && (results[1].value as Response).ok;

      if (googleSiteUrl) {
        await db.execute(sql`
          INSERT INTO seed_credentials (user_id, google_site_url) VALUES (${user.id}, ${googleSiteUrl})
          ON CONFLICT (user_id) DO UPDATE SET google_site_url = ${googleSiteUrl}
        `);
      }

      return NextResponse.json({ success: true, google: googleOk, bing: bingOk, sitemapUrl });
    }

    if (action === "godaddy-cname") {
      const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
      if (!creds?.godaddyApiKey || !creds?.godaddyApiSecret || !creds?.godaddyDomain) {
        return NextResponse.json({ error: "GoDaddy credentials and domain required" }, { status: 400 });
      }
      if (!replitDomain) {
        return NextResponse.json({ error: "Replit deployment domain required (e.g. yourapp.replit.app)" }, { status: 400 });
      }

      const authHeader = `sso-key ${creds.godaddyApiKey}:${creds.godaddyApiSecret}`;
      const cleanReplitDomain = replitDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const records = [
        { type: "CNAME", name: "www", data: cleanReplitDomain, ttl: 600 },
        { type: "TXT", name: "_svivva", data: "svivva-verified", ttl: 600 },
      ];

      const dnsRes = await fetch(`${GODADDY_API}/domains/${creds.godaddyDomain}/records`, {
        method: "PATCH",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(records),
        signal: AbortSignal.timeout(12000),
      });

      const dnsBody = await dnsRes.json().catch(() => ({}));

      if (!dnsRes.ok) {
        return NextResponse.json({ error: `GoDaddy DNS error: ${dnsBody.message || dnsRes.status}` }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        domain: creds.godaddyDomain,
        replitDomain: cleanReplitDomain,
        message: `www.${creds.godaddyDomain} → ${cleanReplitDomain} CNAME added. DNS propagation takes 5–30 minutes.`,
      });
    }

    if (action === "test-routes") {
      const allPages = await db
        .select({ slug: seoLandingPages.slug, category: seoLandingPages.category })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.published, true));

      const sample = allPages.slice(0, 10);
      const results = await Promise.allSettled(
        sample.map((p) => {
          const url = ROOT_CATEGORIES.includes(p.category || "")
            ? `${baseUrl}/${p.slug}`
            : `${baseUrl}/tools/${p.slug}`;
          return fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) }).then((r) => ({ url, status: r.status, ok: r.ok }));
        })
      );

      const tested = results.map((r, i) => r.status === "fulfilled" ? r.value : { url: "error", status: 0, ok: false });
      const passed = tested.filter((t) => t.ok).length;

      return NextResponse.json({ success: true, tested: tested.length, passed, failed: tested.length - passed, results: tested });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("marketing infrastructure POST error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
