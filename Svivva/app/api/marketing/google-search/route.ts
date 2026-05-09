import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials, seoLandingPages, blogPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { submitUrlsToGoogleIndexingApi, submitSitemapToGSC } from "@/lib/google-indexing";
import { randomBytes } from "crypto";

const ROOT_CATEGORIES = ["seo-landing", "seed-marketing"];

async function getAllSiteUrls(): Promise<string[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";
  const staticUrls = [
    baseUrl,
    `${baseUrl}/blog`,
    `${baseUrl}/tools`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/docs`,
  ];

  const posts = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));
  const pages = await db
    .select({ slug: seoLandingPages.slug, category: seoLandingPages.category })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  const blogUrls = posts.map((p) => `${baseUrl}/blog/${p.slug}`);
  const pageUrls = pages.map((p) =>
    ROOT_CATEGORIES.includes(p.category || "")
      ? `${baseUrl}/${p.slug}`
      : `${baseUrl}/tools/${p.slug}`,
  );

  return [...staticUrls, ...blogUrls, ...pageUrls];
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";
    const urls = await getAllSiteUrls();

    return NextResponse.json({
      indexnow: {
        key: creds?.indexnowKey || null,
        keyUrl: creds?.indexnowKey ? `${baseUrl}/.well-known/indexnow` : null,
        lastSubmit: creds?.lastIndexnowSubmit || null,
        urlCount: urls.length,
      },
      google: {
        hasServiceAccount: !!creds?.googleServiceAccountJson,
        indexingEnabled: creds?.googleIndexingEnabled || false,
        lastIndexing: creds?.lastGoogleIndexing || null,
        siteUrl: creds?.googleSiteUrl || null,
      },
      totalUrls: urls.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { action } = body;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

    const [creds] = await db
      .select()
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);

    if (action === "indexnow-setup") {
      const key = randomBytes(16).toString("hex");
      await db.execute(sql`
        INSERT INTO seed_credentials (id, user_id, indexnow_key, updated_at)
        VALUES (${randomBytes(8).toString("hex")}, ${user.id}, ${key}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET indexnow_key = ${key}, updated_at = NOW()
      `);
      return NextResponse.json({
        key,
        keyUrl: `${baseUrl}/.well-known/indexnow`,
        message: "IndexNow key generated. Now click 'Submit All URLs' to notify search engines.",
      });
    }

    if (action === "indexnow-submit") {
      const key = creds?.indexnowKey;
      if (!key)
        return NextResponse.json({ error: "Generate an IndexNow key first" }, { status: 400 });

      const urls = await getAllSiteUrls();
      const host = baseUrl.replace(/^https?:\/\//, "");

      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `${baseUrl}/.well-known/indexnow`,
          urlList: urls,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const bingRes = await fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `${baseUrl}/.well-known/indexnow`,
          urlList: urls,
        }),
        signal: AbortSignal.timeout(30000),
      }).catch(() => null);

      const ok = res.status === 200 || res.status === 202;

      await db.execute(sql`
        UPDATE seed_credentials SET last_indexnow_submit = NOW(), updated_at = NOW() WHERE user_id = ${user.id}
      `);

      return NextResponse.json({
        success: ok,
        urlsSubmitted: urls.length,
        indexnow: { status: res.status, ok },
        bing: {
          status: bingRes?.status || 0,
          ok: bingRes?.status === 200 || bingRes?.status === 202,
        },
        message: ok
          ? `Submitted ${urls.length} URLs to IndexNow (Bing, Yandex, Yahoo). Indexing begins within hours.`
          : `IndexNow returned ${res.status} — check your key URL is accessible.`,
      });
    }

    if (action === "save-service-account") {
      const { serviceAccountJson, siteUrl } = body;
      if (!serviceAccountJson)
        return NextResponse.json({ error: "Service account JSON required" }, { status: 400 });

      let parsed: any;
      try {
        parsed = JSON.parse(serviceAccountJson);
        if (!parsed.private_key || !parsed.client_email)
          throw new Error("Missing private_key or client_email");
      } catch (e) {
        return NextResponse.json(
          { error: `Invalid JSON: ${(e as Error).message}` },
          { status: 400 },
        );
      }

      await db.execute(sql`
        INSERT INTO seed_credentials (id, user_id, google_service_account_json, google_site_url, google_indexing_enabled, updated_at)
        VALUES (${randomBytes(8).toString("hex")}, ${user.id}, ${serviceAccountJson}, ${siteUrl || ""}, true, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
          google_service_account_json = ${serviceAccountJson},
          google_site_url = COALESCE(${siteUrl || null}, seed_credentials.google_site_url),
          google_indexing_enabled = true,
          updated_at = NOW()
      `);

      return NextResponse.json({
        success: true,
        email: parsed.client_email,
        message: "Service account saved. Ready to submit URLs to Google.",
      });
    }

    if (action === "google-submit-sitemap") {
      if (!creds?.googleServiceAccountJson)
        return NextResponse.json({ error: "Save a Google service account first" }, { status: 400 });
      const siteUrl = body.siteUrl || creds?.googleSiteUrl;
      if (!siteUrl)
        return NextResponse.json(
          { error: "Site URL required (e.g. https://svivva.com)" },
          { status: 400 },
        );
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      const result = await submitSitemapToGSC(creds.googleServiceAccountJson, siteUrl, sitemapUrl);
      return NextResponse.json({ ...result, sitemapUrl, siteUrl });
    }

    if (action === "google-index-urls") {
      if (!creds?.googleServiceAccountJson)
        return NextResponse.json({ error: "Save a Google service account first" }, { status: 400 });
      const urls = await getAllSiteUrls();
      const batch = urls.slice(0, 200);
      const result = await submitUrlsToGoogleIndexingApi(creds.googleServiceAccountJson, batch);
      await db.execute(
        sql`UPDATE seed_credentials SET last_google_indexing = NOW(), updated_at = NOW() WHERE user_id = ${user.id}`,
      );
      return NextResponse.json({
        ...result,
        total: urls.length,
        batched: batch.length,
        message: `Submitted ${result.submitted}/${batch.length} URLs to Google Indexing API.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("google-search POST error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
