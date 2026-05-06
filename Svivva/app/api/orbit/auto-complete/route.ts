import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts, seedCredentials } from "@/lib/schema";
import { eq, sql, isNotNull, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { randomBytes } from "crypto";

export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

async function getAllSiteUrls(): Promise<string[]> {
  const staticUrls = [
    BASE_URL,
    `${BASE_URL}/blog`,
    `${BASE_URL}/tools`,
    `${BASE_URL}/pyracrypt`,
    `${BASE_URL}/about`,
    `${BASE_URL}/docs`,
  ];
  const posts = await db.select({ slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.published, true));
  const pages = await db
    .select({ slug: seoLandingPages.slug, category: seoLandingPages.category })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  return [
    ...staticUrls,
    ...posts.map((p) => `${BASE_URL}/blog/${p.slug}`),
    // All seoLandingPages are served at root /{slug} — never /tools/{slug}
    ...pages.map((p) => `${BASE_URL}/${p.slug}`),
  ];
}

async function submitIndexNow(
  userId: string,
  urls: string[]
): Promise<{ ok: boolean; count: number; message: string }> {
  try {
    // Query without user_id filter — key is admin-only and there's only ever one entry
    const [credRow] = await db
      .select({ indexnowKey: seedCredentials.indexnowKey })
      .from(seedCredentials)
      .where(isNotNull(seedCredentials.indexnowKey))
      .orderBy(desc(seedCredentials.updatedAt))
      .limit(1);
    const key = credRow?.indexnowKey;
    if (!key) return { ok: false, count: 0, message: "No IndexNow key found — run IndexNow Setup in the Svivva tab first." };

    const host = BASE_URL.replace(/^https?:\/\//, "");
    // Standard IndexNow key location: /{key}.txt served via middleware rewrite
    const keyLocation = `${BASE_URL}/${key}.txt`;
    const CHUNK = 9000;
    let lastStatus = 0;
    let submitted = 0;

    for (let i = 0; i < urls.length; i += CHUNK) {
      const chunk = urls.slice(i, i + CHUNK);
      const body = JSON.stringify({ host, key, keyLocation, urlList: chunk });
      const [r1] = await Promise.allSettled([
        fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
          signal: AbortSignal.timeout(30000),
        }),
      ]);
      // Bing fire-and-forget in parallel
      fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(30000),
      }).catch(() => {});
      lastStatus = r1.status === "fulfilled" ? (r1.value as Response).status : 0;
      submitted += chunk.length;
    }

    const ok = lastStatus === 200 || lastStatus === 202;
    // Only record submission timestamp when IndexNow actually accepted it
    if (ok) {
      await db.update(seedCredentials)
        .set({ lastIndexnowSubmit: new Date(), updatedAt: new Date() });
    }

    const statusMsg =
      lastStatus === 403 ? `IndexNow key verification failed (403) — key file served at ${keyLocation} was rejected. Check the key matches.`
      : lastStatus === 422 ? `IndexNow invalid URL format (422) — some URLs may be malformed`
      : lastStatus === 400 ? `IndexNow bad request (400)`
      : lastStatus === 0   ? `IndexNow: no response (timeout)`
      : `IndexNow returned HTTP ${lastStatus}`;

    return {
      ok,
      count: submitted,
      message: ok
        ? `✓ ${submitted} URLs submitted to Bing, Yandex, Yahoo via IndexNow`
        : statusMsg,
    };
  } catch (e) {
    return { ok: false, count: 0, message: `IndexNow error: ${String(e).slice(0, 120)}` };
  }
}

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
      } catch { /* skip */ }
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
      steps.push(ping.ok ? "✓ Bing sitemap ping sent" : "⚠ Bing ping did not respond (non-critical)");
    } catch {
      steps.push("⚠ Bing ping timed out (non-critical)");
    }

    // 3 — Submit ALL URLs to IndexNow
    steps.push("Collecting all published URLs…");
    const allUrls = await getAllSiteUrls();
    totalUrls = allUrls.length;
    steps.push(`Found ${totalUrls} published URLs`);

    const indexResult = await submitIndexNow(user.id, allUrls);
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
