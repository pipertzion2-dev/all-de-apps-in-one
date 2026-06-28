import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { db } from "@/lib/db";
import { blogPosts, seoLandingPages } from "@/lib/schema";
import { getSiteUrl } from "@/lib/site-url";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { recordSubmission } from "@/lib/seo/index-health";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type IngestBlogPost = {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  author?: string;
  category?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  publish?: boolean;
};

type IngestSeoPage = {
  keyword: string;
  title: string;
  headline: string;
  content: string;
  slug?: string;
  subheadline?: string;
  benefits?: string[];
  howItWorks?: string;
  whoItsFor?: string;
  category?: string;
  toolUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  publish?: boolean;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");
}

function excerptFrom(content: string, fallback: string): string {
  const text = content.replace(/[#*_`>\-]/g, "").replace(/\s+/g, " ").trim();
  return (text.slice(0, 180) || fallback).trim();
}

/**
 * POST — ingest agent-authored content (blog posts + SEO landing pages),
 * publish it, and immediately notify search engines.
 *
 * This is how the Cursor agent (running a strong model like Opus/GPT-5) writes
 * researched articles straight into Svivva without anyone visiting the site.
 *
 * Body: { blogPosts?: IngestBlogPost[], seoPages?: IngestSeoPage[] }
 */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    blogPosts?: IngestBlogPost[];
    seoPages?: IngestSeoPage[];
  };

  const base = getSiteUrl().replace(/\/$/, "");
  const newUrls: string[] = [];
  const created: { type: string; slug: string; url: string }[] = [];
  const errors: string[] = [];

  for (const p of body.blogPosts ?? []) {
    if (!p?.title || !p?.content) {
      errors.push("blog post missing title or content");
      continue;
    }
    const slug = slugify(p.slug || p.title);
    if (!slug) {
      errors.push(`could not derive slug from "${p.title}"`);
      continue;
    }
    const publish = p.publish !== false;
    try {
      await db
        .insert(blogPosts)
        .values({
          slug,
          title: p.title,
          excerpt: p.excerpt || excerptFrom(p.content, p.title),
          content: p.content,
          author: p.author || "Svivva Team",
          category: p.category || "general",
          tags: p.tags || [],
          metaTitle: p.metaTitle || p.title,
          metaDescription: p.metaDescription || excerptFrom(p.content, p.title),
          published: publish,
          publishedAt: publish ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: blogPosts.slug,
          set: {
            title: p.title,
            excerpt: p.excerpt || excerptFrom(p.content, p.title),
            content: p.content,
            category: p.category || "general",
            tags: p.tags || [],
            metaTitle: p.metaTitle || p.title,
            metaDescription: p.metaDescription || excerptFrom(p.content, p.title),
            published: publish,
            updatedAt: new Date(),
          },
        });
      const url = `${base}/blog/${slug}`;
      if (publish) newUrls.push(url);
      created.push({ type: "blog", slug, url });
    } catch (e) {
      errors.push(`blog "${slug}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  for (const p of body.seoPages ?? []) {
    if (!p?.keyword || !p?.title || !p?.content) {
      errors.push("seo page missing keyword, title, or content");
      continue;
    }
    const slug = slugify(p.slug || p.keyword);
    if (!slug) {
      errors.push(`could not derive slug from "${p.keyword}"`);
      continue;
    }
    const publish = p.publish !== false;
    try {
      await db
        .insert(seoLandingPages)
        .values({
          slug,
          keyword: p.keyword,
          title: p.title,
          headline: p.headline,
          subheadline: p.subheadline || null,
          content: p.content,
          benefits: p.benefits || [],
          howItWorks: p.howItWorks || "",
          whoItsFor: p.whoItsFor || "",
          relatedSlugs: [],
          category: p.category || "seo-landing",
          toolUrl: p.toolUrl || null,
          metaTitle: p.metaTitle || p.title,
          metaDescription: p.metaDescription || excerptFrom(p.content, p.headline),
          published: publish,
        })
        .onConflictDoUpdate({
          target: seoLandingPages.slug,
          set: {
            keyword: p.keyword,
            title: p.title,
            headline: p.headline,
            content: p.content,
            benefits: p.benefits || [],
            metaTitle: p.metaTitle || p.title,
            metaDescription: p.metaDescription || excerptFrom(p.content, p.headline),
            published: publish,
          },
        });
      const url = `${base}/${slug}`;
      if (publish) newUrls.push(url);
      created.push({ type: "seo", slug, url });
    } catch (e) {
      errors.push(`seo "${slug}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Notify search engines now; record so the Google rotation prioritizes these.
  let indexNow: { ok: boolean; submitted: number } = { ok: false, submitted: 0 };
  if (newUrls.length > 0) {
    try {
      const r = await submitIndexNowBatched(newUrls);
      indexNow = { ok: r.ok, submitted: r.submittedCount };
      await recordSubmission(newUrls);
    } catch (e) {
      errors.push(`indexnow: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    created,
    publishedUrls: newUrls,
    indexNow,
    errors,
  });
}
