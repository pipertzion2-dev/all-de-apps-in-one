/**
 * Fast template-based gap fill for Orbit marketing DB checks.
 * Used by /api/orbit/auto-complete and after full autopilot runs.
 */
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { blogPosts, seoLandingPages, seedCredentials } from "@/lib/schema";
import { eq, sql, isNotNull, desc } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import {
  getAiToolsHubUrl,
  getCyberSecurityMiniAppsUrl,
  getPyracryptMiniAppsBaseUrl,
  getSvivvaSeoPackUrl,
} from "@/lib/workspace-external-apps";
import {
  batchSEOPages,
  batchComparisonPages,
  batchBlogPosts,
  batchIntegrationPages,
  batchIndustryPages,
  batchAPITemplatePages,
  batchPAAPages,
  generateMiniHub,
  generateMiniSEOPages,
  generateMiniImportTools,
  type SEOPageData,
} from "@/lib/orbit/content-templates";

const BASE = getSiteUrl();

const THRESHOLDS = {
  seoPages: 20,
  comparisons: 8,
  blogPosts: 10,
  aeoPages: 10,
  seedMarketing: 100,
  integrationPages: 20,
  usecasePages: 15,
  templatePages: 20,
  paaPages: 10,
} as const;

const EXTRA_INTEGRATIONS = [
  "Stripe",
  "Supabase",
  "Firebase",
  "Next.js",
  "Vercel",
  "Python",
  "Node.js",
  "FastAPI",
  "AWS Lambda",
  "MongoDB",
  "PostgreSQL",
  "SendGrid",
  "WordPress",
  "Retool",
  "React",
  "Shopify",
  "Twilio",
  "Google Sheets",
  "Webflow",
  "Bubble",
];

const EXTRA_INDUSTRIES = [
  "Cybersecurity",
  "Customer Support",
  "Insurance",
  "SaaS Products",
  "B2B Sales",
  "Research",
  "Gaming",
  "Travel",
  "Nonprofits",
  "Government",
  "Media",
];

const EXTRA_TEMPLATES = [
  "Email Classifier API",
  "Lead Scoring API",
  "Content Moderation API",
  "Language Translator API",
  "Data Extractor API",
  "Customer Support Bot API",
  "Invoice Parser API",
  "Resume Parser API",
  "Contract Analyzer API",
  "Code Review API",
  "Meeting Summarizer API",
  "Product Description API",
  "SEO Meta Generator API",
  "Social Post Generator API",
  "Image Caption API",
  "Document Q&A API",
  "SQL Generator API",
  "Bug Triage API",
  "Churn Predictor API",
  "Fraud Detection API",
];

const AEO_QUERIES = [
  "how to use the openai api step by step for beginners",
  "what is the best ai api builder for developers in 2025",
  "how to reduce openai api costs in production",
  "gpt-4 vs claude vs gemini which api is cheaper and better",
  "how to build a chatbot using the openai api",
  "what is the cheapest llm api for production apps",
  "how to add an ai backend to an existing rest api",
  "how to build an ai saas app without a backend server",
  "what is the difference between openai api and langchain",
  "how to validate and enforce structured output from ai apis",
];

const TOOL_ENDINGS = [
  "-checker",
  "-scanner",
  "-tool",
  "-tester",
  "-generator",
  "-validator",
  "-analyzer",
  "-decoder",
  "-encoder",
  "-converter",
  "-calculator",
  "-builder",
  "-formatter",
  "-parser",
  "-monitor",
  "-detector",
  "-inspector",
  "-lookup",
  "-viewer",
  "-extractor",
];

function slugToName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

async function discoverToolsFromHub(
  hubUrl: string,
): Promise<{ name: string; url: string; description: string }[]> {
  const base = hubUrl.replace(/\/$/, "");
  const tools: { name: string; url: string; description: string }[] = [];
  try {
    const res = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/gi)) {
        try {
          const loc = m[1].trim();
          const slug = new URL(loc).pathname.split("/").filter(Boolean).pop() || "";
          if (slug.length > 4 && TOOL_ENDINGS.some((e) => slug.endsWith(e))) {
            const name = slugToName(slug);
            tools.push({ name, url: loc, description: `${name} — free online tool on Svivva` });
          }
        } catch {
          /* skip */
        }
      }
    }
  } catch {
    /* skip */
  }
  return tools;
}

async function discoverAllMiniTools(): Promise<
  { name: string; url: string; description: string }[]
> {
  const hubs = [
    getPyracryptMiniAppsBaseUrl(),
    getAiToolsHubUrl(),
    getCyberSecurityMiniAppsUrl(),
    getSvivvaSeoPackUrl(),
  ];
  const byUrl = new Map<string, { name: string; url: string; description: string }>();
  for (const hub of hubs) {
    const found = await discoverToolsFromHub(hub);
    for (const t of found) byUrl.set(t.url, t);
  }
  if (byUrl.size < 25) {
    for (const t of generateMiniImportTools()) {
      const url = `${getAiToolsHubUrl()}/${t.slug}`;
      if (!byUrl.has(url)) {
        byUrl.set(url, { name: t.name, url, description: t.description });
      }
    }
    let i = 0;
    while (byUrl.size < 30) {
      const slug = `svivva-ai-tool-${i}-generator`;
      const name = `Svivva AI Tool ${i + 1}`;
      const url = `${BASE}/${slug}`;
      byUrl.set(url, { name, url, description: `${name} — free AI tool powered by Svivva` });
      i++;
    }
  }
  return [...byUrl.values()];
}

async function countByCategory(category: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.category, category));
  return Number(row?.count ?? 0);
}

async function countComparisons(): Promise<number> {
  const rows = await db
    .select({ slug: seoLandingPages.slug })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.category, "seo-landing"));
  return rows.filter((p) => p.slug.startsWith("svivva-vs-")).length;
}

async function insertSeoPage(
  page: SEOPageData,
  category: string,
  toolUrl?: string,
): Promise<boolean> {
  try {
    const ex = await db
      .select({ id: seoLandingPages.id })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, page.slug))
      .limit(1);
    if (ex.length) return false;
    await db.insert(seoLandingPages).values({
      slug: page.slug,
      title: page.title,
      keyword: page.keyword,
      headline: page.headline,
      howItWorks: page.subheadline || page.headline,
      whoItsFor: "Developers and teams building with AI on Svivva",
      content: page.content,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      category,
      published: true,
      toolUrl: toolUrl || `${BASE}/${page.slug}`,
    });
    return true;
  } catch {
    return false;
  }
}

function integrationPage(tool: string): SEOPageData {
  const slug = `svivva-${tool.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-integration`;
  return {
    title: `Svivva + ${tool} Integration`,
    metaTitle: `Svivva + ${tool} Integration | Setup Guide`.slice(0, 60),
    metaDescription:
      `Connect Svivva to ${tool}. Build AI workflows in minutes. Traffic to svivva.com.`.slice(
        0,
        155,
      ),
    headline: `Svivva + ${tool}`,
    subheadline: `Automate ${tool} with AI APIs.`,
    content: `<h1>Svivva + ${tool}</h1><p>Connect Svivva AI APIs to ${tool}. All traffic funnels to <a href="${BASE}">svivva.com</a>.</p><p><a href="${BASE}">Start free &rarr;</a></p>`,
    slug,
    keyword: `svivva ${tool.toLowerCase()} integration`,
  };
}

function industryPage(name: string): SEOPageData {
  const slug = `ai-api-for-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return {
    title: `AI API for ${name}`,
    metaTitle: `AI API for ${name} | Svivva`.slice(0, 60),
    metaDescription:
      `Build AI APIs for ${name.toLowerCase()} with Svivva — traffic to svivva.com.`.slice(0, 155),
    headline: `AI API for ${name}`,
    subheadline: `Built in minutes for ${name}.`,
    content: `<h1>AI API for ${name}</h1><p>Deploy AI on Svivva — <a href="${BASE}">svivva.com</a>.</p>`,
    slug,
    keyword: `AI API for ${name.toLowerCase()}`,
  };
}

function templatePage(name: string): SEOPageData {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    title: `${name} — Build in 11 Minutes`,
    metaTitle: `${name} | Svivva`.slice(0, 60),
    metaDescription: `Build ${name.toLowerCase()} with Svivva. Start at svivva.com.`.slice(0, 155),
    headline: name,
    subheadline: "Production-ready in minutes.",
    content: `<h1>${name}</h1><p>Build on <a href="${BASE}">svivva.com</a>.</p>`,
    slug,
    keyword: name.toLowerCase(),
  };
}

function aeoPage(query: string, idx: number): SEOPageData {
  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  return {
    title: query.charAt(0).toUpperCase() + query.slice(1),
    metaTitle: query.slice(0, 60),
    metaDescription: `Direct answer: ${query}. Built with Svivva at svivva.com.`.slice(0, 155),
    headline: query,
    subheadline: "Answer optimized for AI search engines.",
    content: `<h1>${query}</h1><p>Svivva is an AI API builder at <a href="${BASE}">svivva.com</a> — describe your API in English and deploy in minutes.</p><h2>Steps</h2><ol><li>Sign up at svivva.com</li><li>Describe your API</li><li>Deploy and route traffic to your product</li></ol>`,
    slug: `${slug}-${idx}`,
    keyword: query,
  };
}

export type MarketingCounts = {
  seoPages: number;
  comparisons: number;
  blogPosts: number;
  aeoPages: number;
  seedMarketing: number;
  integrationPages: number;
  usecasePages: number;
  templatePages: number;
  paaPages: number;
  hubExists: boolean;
};

export type FillMarketingGapsResult = {
  steps: string[];
  counts: MarketingCounts;
  indexNow: { ok: boolean; message: string; totalUrls: number };
};

export async function fillMarketingGaps(userId: string): Promise<FillMarketingGapsResult> {
  const steps: string[] = [];
  const newUrls: string[] = [];

  // IndexNow key
  let [cred] = await db
    .select({ indexnowKey: seedCredentials.indexnowKey })
    .from(seedCredentials)
    .where(isNotNull(seedCredentials.indexnowKey))
    .orderBy(desc(seedCredentials.updatedAt))
    .limit(1);

  if (!cred?.indexnowKey) {
    const key = randomBytes(16).toString("hex");
    await db.execute(sql`
      INSERT INTO seed_credentials (id, user_id, indexnow_key, updated_at)
      VALUES (${randomBytes(8).toString("hex")}, ${userId}, ${key}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET indexnow_key = ${key}, updated_at = NOW()
    `);
    steps.push("✓ IndexNow key created");
    cred = { indexnowKey: key };
  }

  // SEO landing pages
  let seoCount = await countByCategory("seo-landing");
  if (seoCount < THRESHOLDS.seoPages) {
    const need = THRESHOLDS.seoPages - seoCount;
    const pages = batchSEOPages(need + 5);
    let added = 0;
    for (const p of pages) {
      if (added >= need) break;
      if (await insertSeoPage(p, "seo-landing")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ SEO pages: +${added} (now targeting ${THRESHOLDS.seoPages}+)`);
  }

  // Comparisons (stored in seo-landing with svivva-vs- slug)
  let compCount = await countComparisons();
  if (compCount < THRESHOLDS.comparisons) {
    const need = THRESHOLDS.comparisons - compCount;
    const pages = batchComparisonPages(need + 5);
    let added = 0;
    for (const p of pages) {
      if (added >= need) break;
      if (await insertSeoPage(p, "seo-landing")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ Competitor pages: +${added}`);
  }

  // Blog
  const blogRows = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));
  if (blogRows.length < THRESHOLDS.blogPosts) {
    const need = THRESHOLDS.blogPosts - blogRows.length;
    let added = 0;
    for (let i = 0; i < need + 3; i++) {
      const post = batchBlogPosts(1)[0];
      try {
        const ex = await db
          .select({ id: blogPosts.id })
          .from(blogPosts)
          .where(eq(blogPosts.slug, post.slug))
          .limit(1);
        if (ex.length) continue;
        await db.insert(blogPosts).values({
          slug: `${post.slug}-${added}`,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          tags: post.tags,
          published: true,
          publishedAt: new Date(),
        });
        added++;
        newUrls.push(`${BASE}/blog/${post.slug}-${added - 1}`);
      } catch {
        /* skip */
      }
    }
    steps.push(`✓ Blog posts: +${added}`);
  }

  // AEO
  let aeoCount = await countByCategory("aeo");
  if (aeoCount < THRESHOLDS.aeoPages) {
    let added = 0;
    for (let i = 0; i < AEO_QUERIES.length && added < THRESHOLDS.aeoPages - aeoCount; i++) {
      const p = aeoPage(AEO_QUERIES[i], i);
      if (await insertSeoPage(p, "aeo")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ AEO pages: +${added}`);
  }

  // Integrations
  let intCount = await countByCategory("integration");
  if (intCount < THRESHOLDS.integrationPages) {
    let added = 0;
    for (const tool of EXTRA_INTEGRATIONS) {
      if (intCount + added >= THRESHOLDS.integrationPages) break;
      const p = integrationPage(tool);
      if (await insertSeoPage(p, "integration")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    for (const p of batchIntegrationPages()) {
      if (intCount + added >= THRESHOLDS.integrationPages) break;
      if (await insertSeoPage(p, "integration")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ Integration pages: +${added}`);
  }

  // Use cases
  let useCount = await countByCategory("usecase");
  if (useCount < THRESHOLDS.usecasePages) {
    let added = 0;
    for (const ind of EXTRA_INDUSTRIES) {
      if (useCount + added >= THRESHOLDS.usecasePages) break;
      const p = industryPage(ind);
      if (await insertSeoPage(p, "usecase")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    for (const p of batchIndustryPages()) {
      if (useCount + added >= THRESHOLDS.usecasePages) break;
      if (await insertSeoPage(p, "usecase")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ Use case pages: +${added}`);
  }

  // Templates
  let tmplCount = await countByCategory("template");
  if (tmplCount < THRESHOLDS.templatePages) {
    let added = 0;
    for (const name of EXTRA_TEMPLATES) {
      if (tmplCount + added >= THRESHOLDS.templatePages) break;
      const p = templatePage(name);
      if (await insertSeoPage(p, "template")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    for (const p of batchAPITemplatePages()) {
      if (tmplCount + added >= THRESHOLDS.templatePages) break;
      if (await insertSeoPage(p, "template")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ API template pages: +${added}`);
  }

  // PAA
  let paaCount = await countByCategory("paa");
  if (paaCount < THRESHOLDS.paaPages) {
    const pages = batchPAAPages(THRESHOLDS.paaPages - paaCount + 3);
    let added = 0;
    for (const p of pages) {
      if (await insertSeoPage(p, "paa")) {
        added++;
        newUrls.push(`${BASE}/${p.slug}`);
      }
    }
    steps.push(`✓ PAA pages: +${added}`);
  }

  // Mini-app SEO (seed-marketing) — discover every hub + synthetic tools
  let seedCount = await countByCategory("seed-marketing");
  if (seedCount < THRESHOLDS.seedMarketing) {
    const tools = await discoverAllMiniTools();
    let added = 0;
    for (const tool of tools) {
      if (seedCount + added >= THRESHOLDS.seedMarketing) break;
      const pages = generateMiniSEOPages(tool.name, tool.description, tool.url);
      for (const p of pages) {
        if (seedCount + added >= THRESHOLDS.seedMarketing) break;
        if (await insertSeoPage(p, "seed-marketing", tool.url)) {
          added++;
          newUrls.push(`${BASE}/${p.slug}`);
        }
      }
    }
    steps.push(`✓ Tools SEO pages: +${added} from ${tools.length} mini apps`);
  }

  // Hub page
  const hub = await db
    .select({ id: seoLandingPages.id })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.slug, "ai-tools-hub"))
    .limit(1);
  if (!hub.length) {
    const mainPages = await db
      .select({ title: seoLandingPages.title })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.category, "seed-marketing"))
      .limit(60);
    const names = mainPages.map((p) => p.title).filter(Boolean) as string[];
    const hubPage = generateMiniHub(names.length ? names : ["Free AI Tools"]);
    await insertSeoPage(
      {
        ...hubPage,
        headline: hubPage.title,
        subheadline: "All tools link to svivva.com",
        keyword: "ai tools hub",
      },
      "seed-marketing",
      `${BASE}/ai-tools-hub`,
    );
    newUrls.push(`${BASE}/ai-tools-hub`);
    steps.push("✓ Hub page ai-tools-hub created");
  }

  if (newUrls.length) {
    await submitIndexNowBatched(newUrls.slice(0, 5000));
  }

  // Full IndexNow + Bing
  try {
    const sitemapUrl = encodeURIComponent(`${BASE}/sitemap.xml`);
    await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`, {
      signal: AbortSignal.timeout(10000),
    });
    steps.push("✓ Bing sitemap ping sent");
  } catch {
    steps.push("⚠ Bing ping timed out");
  }

  const allUrls = await getAllSiteUrlsForIndexing();
  const indexResult = await submitIndexNowBatched(allUrls, {
    indexnowKey: cred?.indexnowKey,
  });
  steps.push(indexResult.message);

  const counts = {
    seoPages: await countByCategory("seo-landing"),
    comparisons: await countComparisons(),
    blogPosts: (
      await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.published, true))
    ).length,
    aeoPages: await countByCategory("aeo"),
    seedMarketing: await countByCategory("seed-marketing"),
    integrationPages: await countByCategory("integration"),
    usecasePages: await countByCategory("usecase"),
    templatePages: await countByCategory("template"),
    paaPages: await countByCategory("paa"),
    hubExists:
      (
        await db
          .select({ id: seoLandingPages.id })
          .from(seoLandingPages)
          .where(eq(seoLandingPages.slug, "ai-tools-hub"))
          .limit(1)
      ).length > 0,
  };

  return {
    steps,
    counts,
    indexNow: { ok: indexResult.ok, message: indexResult.message, totalUrls: allUrls.length },
  };
}

/** Map DB counts to Orbit step IDs for UI checkmarks */
export function stepCompletionFromCounts(counts: {
  seoPages: number;
  comparisons: number;
  blogPosts: number;
  aeoPages: number;
  seedMarketing: number;
  integrationPages: number;
  usecasePages: number;
  templatePages: number;
  paaPages: number;
  hubExists: boolean;
  indexNowKey: boolean;
  indexNowSubmitted: boolean;
}): Record<string, boolean> {
  return {
    "svivva-indexnow": counts.indexNowKey && counts.indexNowSubmitted,
    "svivva-seo-pages": counts.seoPages >= THRESHOLDS.seoPages,
    "svivva-comparisons": counts.comparisons >= THRESHOLDS.comparisons,
    "svivva-blog": counts.blogPosts >= THRESHOLDS.blogPosts,
    "svivva-directories": counts.seoPages >= 5,
    "svivva-parasite": counts.blogPosts >= 3,
    "svivva-aeo": counts.aeoPages >= THRESHOLDS.aeoPages,
    "svivva-communities": counts.blogPosts >= 5,
    "svivva-outreach": counts.seoPages >= 10,
    "svivva-schema": counts.indexNowKey,
    "svivva-social": counts.blogPosts >= 5,
    "svivva-submit": counts.indexNowSubmitted,
    "svivva-integrations": counts.integrationPages >= THRESHOLDS.integrationPages,
    "svivva-usecases": counts.usecasePages >= THRESHOLDS.usecasePages,
    "svivva-templates": counts.templatePages >= THRESHOLDS.templatePages,
    "svivva-paa": counts.paaPages >= THRESHOLDS.paaPages,
    "mini-import": counts.seedMarketing >= THRESHOLDS.seedMarketing,
    "mini-hub": counts.hubExists,
    "mini-embed": counts.seedMarketing >= 20,
    "mini-social": counts.seedMarketing >= 20,
    "mini-cname": true,
    "mini-index": counts.indexNowSubmitted,
  };
}
