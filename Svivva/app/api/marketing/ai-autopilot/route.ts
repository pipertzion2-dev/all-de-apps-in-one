import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts, seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { randomBytes } from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

async function indexnowSubmit(urls: string[]): Promise<{ submitted: boolean; count: number }> {
  try {
    const rows = await db.execute(sql`SELECT indexnow_key FROM seed_credentials LIMIT 1`);
    const key = (rows as unknown as any[])[0]?.indexnow_key;
    if (!key) return { submitted: false, count: 0 };
    const host = BASE_URL.replace(/^https?:\/\//, "");
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${BASE_URL}/.well-known/indexnow`, urlList: urls }),
      signal: AbortSignal.timeout(20000),
    });
    return { submitted: res.status === 200 || res.status === 202, count: urls.length };
  } catch {
    return { submitted: false, count: 0 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, count = 6 } = await req.json();

    if (action === "discover-keywords") {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert SEO strategist for AI SaaS tools. Generate a mix of high-intent, medium-competition keywords that will drive traffic to an AI API builder platform.",
          },
          {
            role: "user",
            content: `Generate ${count * 3} keyword ideas for "Svivva" — an AI platform that turns natural language prompts into production-ready APIs with schema enforcement, version control, A/B testing, and a marketplace. Include a mix of: informational (how-to, what-is), commercial (best, vs, tool), and transactional (buy, pricing, free trial) keywords. Return JSON: { keywords: [{ keyword, intent: "informational|commercial|transactional", searchVolume: "high|medium|low", type: "landing_page|blog_article" }] }`,
          },
        ],
      });

      const { keywords } = JSON.parse(completion.choices[0].message.content || "{}");
      return NextResponse.json({ keywords: keywords || [] });
    }

    if (action === "run-autopilot") {
      const { mode = "balanced" } = await req.json().catch(() => ({ mode: "balanced" }));
      const log: { type: string; title: string; url: string; action: string }[] = [];
      const newUrls: string[] = [];

      const numPages = mode === "aggressive" ? 8 : mode === "conservative" ? 3 : 5;
      const numPosts = mode === "aggressive" ? 4 : mode === "conservative" ? 2 : 3;

      const keywordCompletion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "SEO strategist for an AI API builder SaaS called Svivva. Generate keywords that will bring in developers, product teams, and startup founders looking to build AI-powered features." },
          {
            role: "user",
            content: `Generate ${numPages + numPosts} unique, untapped keyword ideas for Svivva. Mix commercial and informational. Focus on long-tail keywords with specific intent (e.g. "how to build an AI API without coding", "OpenAI response schema validation", "AI API version control tool"). Return JSON: { seoPages: [string] (${numPages} keywords for landing pages), blogTopics: [string] (${numPosts} topics for blog articles) }`,
          },
        ],
      });

      const { seoPages = [], blogTopics = [] } = JSON.parse(keywordCompletion.choices[0].message.content || "{}");

      for (const keyword of seoPages.slice(0, numPages)) {
        try {
          const slug = keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
          const existing = await db.select({ id: seoLandingPages.id }).from(seoLandingPages).where(eq(seoLandingPages.slug, slug)).limit(1);
          const finalSlug = existing.length ? `${slug}-${randomBytes(3).toString("hex")}` : slug;

          const gen = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "SEO copywriter for Svivva AI API Builder. Write conversion-focused landing page content." },
              {
                role: "user",
                content: `Landing page for keyword: "${keyword}". Return JSON: { title, metaTitle (max 60 chars), metaDescription (max 155 chars), content (3 short paragraphs HTML), headline, subheadline }`,
              },
            ],
          });

          const data = JSON.parse(gen.choices[0].message.content || "{}");

          await db.insert(seoLandingPages).values({
            slug: finalSlug,
            title: data.title || keyword,
            keyword,
            headline: data.headline || data.title || keyword,
            howItWorks: data.howItWorks || `AI-powered solution for ${keyword}`,
            whoItsFor: data.whoItsFor || "Teams and developers building with AI",
            content: data.content || `<p>${keyword}</p>`,
            metaTitle: data.metaTitle || data.title || keyword,
            metaDescription: data.metaDescription || "",
            category: "seo-landing",
            published: true,
            toolUrl: `${BASE_URL}/${finalSlug}`,
          });

          const url = `${BASE_URL}/${finalSlug}`;
          newUrls.push(url);
          log.push({ type: "landing_page", title: data.title || keyword, url, action: "created" });
        } catch (e) {
          log.push({ type: "landing_page", title: keyword, url: "", action: `error: ${(e as Error).message.slice(0, 60)}` });
        }
      }

      for (const topic of blogTopics.slice(0, numPosts)) {
        try {
          const keywordTag = topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
          const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, keywordTag)).limit(1);
          const finalSlug = existing.length ? `${keywordTag}-${randomBytes(3).toString("hex")}` : keywordTag;

          const gen = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "Technical SEO blogger for Svivva. Write substantive, useful articles that rank on Google and convert readers to Svivva users." },
              {
                role: "user",
                content: `Blog article for: "${topic}". Return JSON: { title, excerpt (1-2 sentences), content (markdown article 600-900 words with H2 headings, practical examples, and CTA for Svivva at the end), metaTitle, metaDescription, tags (array of 3-5 strings) }`,
              },
            ],
          });

          const data = JSON.parse(gen.choices[0].message.content || "{}");
          const id = randomBytes(12).toString("hex");

          await db.insert(blogPosts).values({
            id,
            slug: finalSlug,
            title: data.title || topic,
            excerpt: data.excerpt || "",
            content: data.content || "",
            metaTitle: data.metaTitle || data.title || topic,
            metaDescription: data.metaDescription || data.excerpt || "",
            tags: Array.isArray(data.tags) ? data.tags : [keywordTag],
            published: true,
            publishedAt: new Date(),
          } as any);

          const url = `${BASE_URL}/blog/${finalSlug}`;
          newUrls.push(url);
          log.push({ type: "blog_article", title: data.title || topic, url, action: "created" });
        } catch (e) {
          log.push({ type: "blog_article", title: topic, url: "", action: `error: ${(e as Error).message.slice(0, 60)}` });
        }
      }

      let indexnowResult = { submitted: false, count: 0 };
      if (newUrls.length > 0) {
        indexnowResult = await indexnowSubmit(newUrls);
      }

      return NextResponse.json({
        success: true,
        created: log.filter((l) => l.action === "created").length,
        errors: log.filter((l) => l.action.startsWith("error")).length,
        log,
        indexnow: indexnowResult,
        totalNewUrls: newUrls.length,
        message: `Created ${log.filter((l) => l.action === "created").length} pieces of content. ${indexnowResult.submitted ? `Submitted ${indexnowResult.count} URLs to IndexNow immediately.` : "IndexNow not configured — set up a key in the Google Search tab."}`,
      });
    }

    if (action === "generate-social-batch") {
      const pages = await db.select({ slug: seoLandingPages.slug, title: seoLandingPages.title })
        .from(seoLandingPages).where(eq(seoLandingPages.published, true)).limit(5);
      const posts = await db.select({ slug: blogPosts.slug, title: blogPosts.title })
        .from(blogPosts).where(eq(blogPosts.published, true)).limit(5);

      const allContent = [
        ...pages.map((p) => ({ title: p.title, url: `${BASE_URL}/${p.slug}`, type: "landing page" })),
        ...posts.map((p) => ({ title: p.title, url: `${BASE_URL}/blog/${p.slug}`, type: "blog post" })),
      ];

      const gen = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Social media manager for Svivva AI API Builder. Write punchy, engaging posts that drive traffic." },
          {
            role: "user",
            content: `Generate social media posts for these Svivva pages: ${JSON.stringify(allContent)}. Return JSON: { posts: [{ platform: "twitter|linkedin|reddit", title, copy, url, hashtags }] } — one post per piece of content per platform.`,
          },
        ],
      });

      const { posts: socialPosts = [] } = JSON.parse(gen.choices[0].message.content || "{}");
      return NextResponse.json({ posts: socialPosts });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("ai-autopilot error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
