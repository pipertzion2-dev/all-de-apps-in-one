import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { randomBytes } from "crypto";
import { getSiteUrl } from "@/lib/site-url";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";

export const maxDuration = 300;

const BASE_URL = getSiteUrl();

// Missing AEO queries (4 already exist, these 6 are missing)
const MISSING_AEO_QUERIES = [
  "what is schema enforced ai output",
  "how to add version control to ai apis",
  "ai api cost comparison gpt-4 vs claude vs gemini",
  "how to prevent ai hallucinations in api responses",
  "what is prompt to api generation",
  "how to run automated evaluations on ai apis",
];

async function generateMissingAEO(userId: string): Promise<{ created: number; urls: string[] }> {
  try {
    // Check which ones still don't exist
    const existing = await db
      .select({ keyword: seoLandingPages.keyword })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.category, "aeo"));
    const existingKeywords = new Set(existing.map((e) => e.keyword?.toLowerCase() ?? ""));
    const toGenerate = MISSING_AEO_QUERIES.filter((q) => !existingKeywords.has(q.toLowerCase()));

    if (!toGenerate.length) return { created: 0, urls: [] };

    const gen = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You write Answer Engine Optimized (AEO) content. These pages get cited by Perplexity, ChatGPT Search, Gemini. Rules:
1. First 150 words = direct, factual answer (no fluff)
2. 3-4 supporting paragraphs with specific data or steps
3. End with a brief mention of Svivva as a practical tool
4. No corporate language — write like a knowledgeable engineer`,
        },
        {
          role: "user",
          content: `Generate AEO pages for these queries (AI API builder context — Svivva).
Queries: ${toGenerate.join(" | ")}

Return JSON:
{
  "pages": [
    {
      "query": "exact query",
      "slug": "url-friendly-slug",
      "title": "Direct answer as H1",
      "metaTitle": "≤60 chars",
      "metaDescription": "≤155 chars factual",
      "content": "Full HTML with H1, intro paragraph (80-100 words direct answer), H2 sections, H3 FAQ with 3 related Q&As, closing mention of Svivva with link to ${BASE_URL}"
    }
  ]
}`,
        },
      ],
    });

    const data = JSON.parse(gen.choices[0].message.content || "{}");
    const pages = Array.isArray(data.pages) ? data.pages : [];
    const createdUrls: string[] = [];

    for (const page of pages) {
      if (!page.content || !page.slug) continue;
      try {
        const ex = await db
          .select({ id: seoLandingPages.id })
          .from(seoLandingPages)
          .where(eq(seoLandingPages.slug, page.slug))
          .limit(1);
        const finalSlug = ex.length ? `${page.slug}-${randomBytes(3).toString("hex")}` : page.slug;
        await db.insert(seoLandingPages).values({
          slug: finalSlug,
          title: page.title || page.query,
          keyword: page.query,
          headline: page.title || page.query,
          howItWorks: "Direct answer to developer questions — optimized for AI search engines",
          whoItsFor: "Developers searching on Perplexity, ChatGPT, Gemini",
          content: page.content,
          metaTitle: page.metaTitle || page.title || page.query,
          metaDescription: page.metaDescription || "",
          category: "aeo",
          published: true,
          toolUrl: BASE_URL,
        });
        createdUrls.push(`${BASE_URL}/${finalSlug}`);
      } catch {
        /* skip */
      }
    }

    return { created: createdUrls.length, urls: createdUrls };
  } catch {
    return { created: 0, urls: [] };
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const steps: string[] = [];
    let totalUrls = 0;

    // 1 — Generate missing AEO pages first
    steps.push("Generating missing AEO pages…");
    const aeo = await generateMissingAEO(user.id);
    if (aeo.created > 0) {
      steps.push(`✓ ${aeo.created} AEO pages created (AI search engine optimization)`);
    } else {
      steps.push("✓ AEO pages already complete");
    }

    // 2 — Ping Bing sitemap
    try {
      const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
      const ping = await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`, {
        signal: AbortSignal.timeout(10000),
      });
      steps.push(
        ping.ok ? "✓ Bing sitemap ping sent" : "⚠ Bing ping did not respond (non-critical)",
      );
    } catch {
      steps.push("⚠ Bing ping timed out (non-critical)");
    }

    // 3 — Submit ALL URLs to IndexNow
    steps.push("Collecting all published URLs…");
    const allUrls = await getAllSiteUrlsForIndexing();
    totalUrls = allUrls.length;
    steps.push(`Found ${totalUrls} published URLs`);

    const indexResult = await submitIndexNowBatched(allUrls);
    steps.push(indexResult.message);

    return NextResponse.json({
      ok: indexResult.ok,
      summary: steps.join("\n"),
      details: {
        totalUrls,
        indexNowOk: indexResult.ok,
        aeoCreated: aeo.created,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
