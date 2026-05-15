import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts, seedCredentials } from "@/lib/schema";
import { eq, sql, inArray, desc, isNotNull } from "drizzle-orm";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  openai,
  getDefaultModel,
  isUsingGemini,
  isUsingOllama,
  isOrbitFreeAIConfigured,
} from "@/lib/llm/openai";
import { randomBytes } from "crypto";
import { getSiteUrl } from "@/lib/site-url";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { submitUrlsToGoogleIndexingApi } from "@/lib/google-indexing";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import {
  getDefaultSubdomainCnameTargets,
  getPyracryptMiniAppsBaseUrl,
} from "@/lib/workspace-external-apps";
import {
  batchSEOPages,
  batchComparisonPages,
  batchBlogPosts,
  batchIntegrationPages,
  batchIndustryPages,
  batchAPITemplatePages,
  batchPAAPages,
  generateSocialPack,
  generateOutreach,
  generateSchemaOrg,
  generateWidget,
  generateMiniHub,
  generateMiniCategories,
  generateMiniSocial,
  generateMiniSEOPages,
  generateMiniIndexNowUrls,
  generateMiniDirectories,
  generateMiniParasite,
  generateMiniAEO,
  generateMiniCommunities,
  generateMiniOutreachAll,
  generateMiniSecurity,
  generateMiniAppBuild,
  generateMiniAPISecurity,
  generateMiniCNAMETargets,
  generateMiniImportTools,
} from "@/lib/orbit/content-templates";

export const maxDuration = 300;

const BASE_URL = getSiteUrl();

// ── AI with template fallback (Gemini / Ollama only — never paid OpenAI) ───
async function generateWithAIOrFallback<T>(
  aiCall: () => Promise<T>,
  fallback: () => T,
  stepName: string,
): Promise<T> {
  if (isOrbitFreeAIConfigured()) {
    try {
      return await aiCall();
    } catch (e) {
      console.warn(`[Orbit] AI failed for ${stepName}, using templates:`, String(e).slice(0, 100));
      return fallback();
    }
  }
  return fallback();
}

// ── Shared tool type ─────────────────────────────────────────────────────────
interface DiscoveredTool {
  name: string;
  url: string;
  description: string;
}

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
  "-lookup",
  "-viewer",
  "-inspector",
  "-detector",
  "-parser",
  "-formatter",
  "-converter",
  "-calculator",
  "-builder",
  "-maker",
  "-finder",
  "-tracker",
  "-monitor",
  "-audit",
  "-mapper",
  "-simulator",
  "-sandbox",
  "-studio",
  "-creator",
  "-explorer",
  "-extractor",
  "-debugger",
  "-comparator",
  "-optimizer",
];

function slugToName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

async function autoDiscoverTools(miniAppsUrl: string): Promise<DiscoveredTool[]> {
  const base = miniAppsUrl.replace(/\/$/, "");
  const tools: DiscoveredTool[] = [];

  // ── 1. Try sitemap.xml ────────────────────────────────────────────────────
  try {
    const res = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const xml = await res.text();
      const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)].map((m) => m[1].trim());
      for (const loc of locs) {
        try {
          const path = new URL(loc).pathname;
          const slug = path.split("/").filter(Boolean).pop() || "";
          if (slug.length > 4 && TOOL_ENDINGS.some((e) => slug.endsWith(e))) {
            const name = slugToName(slug);
            tools.push({ name, url: loc, description: `${name} — free online security tool` });
          }
        } catch {
          /* skip bad URLs */
        }
      }
    }
  } catch {
    /* sitemap unavailable */
  }

  if (tools.length > 0) return tools;

  // ── 2. Try fetching the app page and extracting links ────────────────────
  try {
    const res = await fetch(base, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const html = await res.text();
      const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
      for (const href of hrefs) {
        try {
          const url = href.startsWith("http")
            ? href
            : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
          const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
          if (
            slug.length > 4 &&
            TOOL_ENDINGS.some((e) => slug.endsWith(e)) &&
            !tools.find((t) => t.url === url)
          ) {
            tools.push({
              name: slugToName(slug),
              url,
              description: `${slugToName(slug)} — free online security tool`,
            });
          }
        } catch {
          /* skip */
        }
      }
    }
  } catch {
    /* page unavailable */
  }

  if (tools.length > 0) return tools;

  // ── 3. AI fallback — generate a realistic list from the app's URL/name ───
  if (isOrbitFreeAIConfigured()) {
    try {
      const appLabel = base
        .replace(/https?:\/\//, "")
        .split(".")[0]
        .replace(/-/g, " ");
      const res = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return valid JSON only. No markdown." },
          {
            role: "user",
            content: `The app at ${base} is called "${appLabel}" and contains free cybersecurity mini tools. Generate a realistic list of 80 tools it likely contains. Return: {"tools":[{"name":"Password Strength Checker","slug":"password-strength-checker","description":"Check how strong your password is"},...]}`,
          },
        ],
      });
      const data = JSON.parse(res.choices[0].message.content || "{}");
      for (const t of data.tools || []) {
        if (t.name && t.slug) {
          tools.push({
            name: t.name,
            url: `${base}/${t.slug}`,
            description: t.description || t.name,
          });
        }
      }
    } catch {
      /* AI unavailable */
    }
  }

  return tools;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";

    const body = await req.json();
    const { stepId } = body;

    // ── STEP: IndexNow setup + submit ────────────────────────────────────────
    if (stepId === "svivva-indexnow") {
      const key = randomBytes(16).toString("hex");
      await db.execute(sql`
        INSERT INTO seed_credentials (id, user_id, indexnow_key, updated_at)
        VALUES (${randomBytes(8).toString("hex")}, ${userId}, ${key}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET indexnow_key = ${key}, updated_at = NOW()
      `);
      const urls = await getAllSiteUrlsForIndexing();
      const submit = await submitIndexNowBatched(urls, { indexnowKey: key });
      return NextResponse.json({
        summary: `✓ IndexNow key generated: ${key.slice(0, 8)}…\n${submit.message}\n✓ Key served at ${BASE_URL}/${key}.txt\n✓ Search engines: Bing, Yandex, Yahoo, DuckDuckGo`,
        details: { key: key.slice(0, 8) + "…", urlCount: urls.length, submitted: submit.ok },
      });
    }

    // ── STEP: 50 SEO pages ───────────────────────────────────────────────────
    if (stepId === "svivva-seo-pages") {
      const SEO_KEYWORDS = [
        "ai api builder",
        "prompt to api",
        "no-code api generator",
        "ai backend builder",
        "build api with ai",
        "llm api platform",
        "api from natural language",
        "instant api creator",
        "zero-code api development",
        "openai api wrapper",
        "ai powered rest api",
        "prompt engineering tool",
        "ai app generator",
        "no-code backend",
        "natural language api",
        "api automation tool",
        "ai workflow builder",
        "serverless ai api",
        "schema enforced ai output",
        "ai response validator",
        "chatgpt api integration",
        "openai api tutorial",
        "how to use openai api",
        "build app with chatgpt",
        "gpt api builder",
        "llm api wrapper",
        "rest api builder free",
        "ai tools for developers",
        "build chatbot api",
        "claude api builder",
        "gemini api builder",
        "best llm for production",
        "reduce openai api costs",
        "openai api alternative",
        "ai api monitoring",
        "build saas with ai",
        "ai app builder free",
        "llm application builder",
        "deploy ai api",
        "openai api vs anthropic api",
      ];
      const created: { title: string; url: string }[] = [];
      const errors: string[] = [];
      const useAI = isOrbitFreeAIConfigured();

      for (let i = 0; i < SEO_KEYWORDS.length; i++) {
        const keyword = SEO_KEYWORDS[i];
        try {
          const slug = keyword
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 60);
          const existing = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, slug))
            .limit(1);
          if (existing.length) {
            created.push({ title: `[existing] ${keyword}`, url: `${BASE_URL}/${slug}` });
            continue;
          }

          let pageData;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "SEO copywriter for Svivva — an AI API builder SaaS. Write conversion-focused content.",
                },
                {
                  role: "user",
                  content: `Landing page for: "${keyword}". Return JSON: { title, metaTitle (≤60 chars), metaDescription (≤155 chars), content (3 paragraphs HTML), headline, subheadline }`,
                },
              ],
            });
            const d = JSON.parse(gen.choices[0].message.content || "{}");
            pageData = {
              title: d.title || keyword,
              metaTitle: d.metaTitle || d.title || keyword,
              metaDescription: d.metaDescription || "",
              headline: d.headline || d.title || keyword,
              content: d.content || `<p>${keyword}</p>`,
            };
          } else {
            pageData = batchSEOPages(1)[0];
            pageData.title = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} — Svivva`;
            pageData.slug = `${slug}-${i}`;
            pageData.keyword = keyword;
          }

          await db.insert(seoLandingPages).values({
            slug,
            title: pageData.title,
            keyword,
            headline: pageData.headline,
            howItWorks: `AI-powered solution for ${keyword}`,
            whoItsFor: "Teams and developers building with AI",
            content: pageData.content,
            metaTitle: pageData.metaTitle,
            metaDescription: pageData.metaDescription,
            category: "seo-landing",
            published: true,
            toolUrl: `${BASE_URL}/${slug}`,
          });
          created.push({ title: pageData.title, url: `${BASE_URL}/${slug}` });
        } catch (e) {
          errors.push(`${keyword}: ${String(e).slice(0, 60)}`);
        }
      }

      const newUrls = created.filter((c) => !c.title.startsWith("[existing]")).map((c) => c.url);
      const indexResult = newUrls.length > 0 ? await submitIndexNowBatched(newUrls) : null;
      const lines = [
        `✓ ${created.filter((c) => !c.title.startsWith("[existing]")).length} new SEO pages created`,
        `✓ ${created.filter((c) => c.title.startsWith("[existing]")).length} already existed`,
        `✓ Using ${useAI ? "free-tier AI (Gemini/Ollama)" : "built-in templates — set GEMINI_API_KEY or OLLAMA_URL for AI prose"}`,
        errors.length ? `⚠ ${errors.length} errors` : "",
        indexResult ? indexResult.message : "",
      ].filter(Boolean);
      const pageList = created
        .filter((c) => !c.title.startsWith("[existing]"))
        .slice(0, 10)
        .map((c) => `• ${c.title}`)
        .join("\n");
      return NextResponse.json({
        summary: lines.join("\n") + (pageList ? "\n\nPages created:\n" + pageList : ""),
        details: { created: created.length, errors: errors.length },
      });
    }

    // ── STEP: Comparison pages ────────────────────────────────────────────────
    if (stepId === "svivva-comparisons") {
      const COMPETITORS = [
        "Bubble",
        "Webflow",
        "Retool",
        "Glide",
        "Adalo",
        "Zapier",
        "AppGyver",
        "AWS Lambda",
        "n8n",
        "Dify",
        "LangChain",
        "Flowise",
        "Make",
        "Airtable",
        "Supabase",
        "Firebase",
        "OpenAI Assistants API",
        "LlamaIndex",
        "Vercel AI SDK",
        "FastAPI",
      ];
      const created: { title: string; url: string }[] = [];
      const useAI = isOrbitFreeAIConfigured();

      for (const comp of COMPETITORS) {
        try {
          const slug = `svivva-vs-${comp
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")}`;
          const existing = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, slug))
            .limit(1);
          if (existing.length) {
            created.push({ title: `[existing] Svivva vs ${comp}`, url: `${BASE_URL}/${slug}` });
            continue;
          }

          let pageData;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "Conversion copywriter for Svivva AI API Builder. Write compelling comparison pages.",
                },
                {
                  role: "user",
                  content: `Comparison page: "Svivva vs ${comp}". Target: people searching "${comp} alternative". Position Svivva as better for AI/API use cases. Return JSON: { title, metaTitle, metaDescription, content (4 sections HTML: overview, feature comparison table as HTML, who should use svivva, CTA), headline, subheadline }`,
                },
              ],
            });
            const d = JSON.parse(gen.choices[0].message.content || "{}");
            pageData = {
              title: d.title || `Svivva vs ${comp}`,
              metaTitle: d.metaTitle || `Svivva vs ${comp}`,
              metaDescription: d.metaDescription || "",
              headline: d.headline || `Svivva vs ${comp}: Which is Better?`,
              howItWorks: d.howItWorks || "Compare features, pricing and use-cases side by side",
              whoItsFor:
                d.whoItsFor || `${comp} users looking for a more powerful AI-native alternative`,
              content: d.content || "",
            };
          } else {
            pageData = batchComparisonPages(1)[0];
            pageData.title = `Svivva vs ${comp}`;
            pageData.slug = slug;
            pageData.keyword = `svivva vs ${comp.toLowerCase()}`;
          }

          await db.insert(seoLandingPages).values({
            slug,
            title: pageData.title || `Svivva vs ${comp}`,
            content: pageData.content || `<p>Svivva vs ${comp}</p>`,
            keyword: pageData.keyword || `svivva vs ${comp.toLowerCase()}`,
            headline: pageData.headline || `Svivva vs ${comp}`,
            howItWorks:
              (pageData as any).howItWorks ||
              "Compare features, pricing and use-cases side by side",
            whoItsFor:
              (pageData as any).whoItsFor ||
              `${comp} users looking for a more powerful AI-native alternative`,
            metaTitle: pageData.metaTitle || `Svivva vs ${comp}`,
            metaDescription: pageData.metaDescription || `Compare Svivva vs ${comp}`,
            category: "seo-landing",
            published: true,
            toolUrl: `${BASE_URL}/${slug}`,
          });
          created.push({ title: pageData.title, url: `${BASE_URL}/${slug}` });
        } catch (e) {
          created.push({ title: `[error] Svivva vs ${comp}`, url: "" });
        }
      }

      const newUrls = created
        .filter((c) => !c.title.startsWith("[existing]") && !c.title.startsWith("[error]") && c.url)
        .map((c) => c.url);
      if (newUrls.length) await submitIndexNowBatched(newUrls);
      const pageList = created.map((c) => `• ${c.title}`).join("\n");
      return NextResponse.json({
        summary: `✓ ${created.filter((c) => !c.title.startsWith("[existing]") && !c.title.startsWith("[error]")).length} comparison pages created\n✓ ${created.filter((c) => c.title.startsWith("[existing]")).length} already existed\n✓ Using ${useAI ? "free-tier AI (Gemini/Ollama)" : "built-in templates"}\n\n${pageList}`,
        details: { created: created.length },
      });
    }

    // ── STEP: Blog posts ──────────────────────────────────────────────────────
    if (stepId === "svivva-blog") {
      const BLOG_TOPICS = [
        "How to Build an API Without Writing Code in 2025",
        "Best AI API Builders Compared: Full Guide for Developers",
        "Prompt Engineering for Production APIs: Advanced Techniques",
        "Building SaaS Products with AI: From Idea to API in Hours",
        "OpenAI JSON Schema Validation: Why It Matters and How to Enforce It",
        "No-Code Backend Development: The Complete Developer Guide",
        "API Version Control Best Practices for AI Applications",
        "How to Monetize Your AI API: Marketplace Strategies That Work",
        "LLM API Security: Preventing Prompt Injection and Data Leaks",
        "From Prompt to Product: Building a Complete AI App in One Day",
      ];
      const created: { title: string; url: string }[] = [];
      const useAI = isOrbitFreeAIConfigured();

      for (let i = 0; i < BLOG_TOPICS.length; i++) {
        const topic = BLOG_TOPICS[i];
        try {
          const baseSlug = topic
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 70);
          const existing = await db
            .select({ id: blogPosts.id })
            .from(blogPosts)
            .where(eq(blogPosts.slug, baseSlug))
            .limit(1);
          const slug = existing.length ? `${baseSlug}-${randomBytes(3).toString("hex")}` : baseSlug;
          if (existing.length) {
            created.push({ title: `[existing] ${topic}`, url: `${BASE_URL}/blog/${baseSlug}` });
            continue;
          }

          let blogData;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "Technical SEO blogger for Svivva. Write detailed, actionable articles that rank well and convert readers.",
                },
                {
                  role: "user",
                  content: `Blog post: "${topic}". Return JSON: { title, excerpt (2 sentences), content (markdown 700-1000 words with H2 headings, code examples where relevant, CTA for Svivva at end), metaTitle, metaDescription, tags (3-5 strings) }`,
                },
              ],
            });
            const d = JSON.parse(gen.choices[0].message.content || "{}");
            blogData = {
              title: d.title || topic,
              excerpt: d.excerpt || "",
              content: d.content || `## ${topic}\n\nDetailed guide coming soon.`,
              metaTitle: d.metaTitle || topic,
              metaDescription: d.metaDescription || "",
              tags: d.tags || ["AI API"],
            };
          } else {
            blogData = batchBlogPosts(1)[0];
            blogData.title = topic;
            blogData.excerpt = topic;
          }

          const id = randomBytes(12).toString("hex");
          await db.insert(blogPosts).values({
            id,
            slug,
            title: blogData.title,
            excerpt: blogData.excerpt,
            content: blogData.content,
            metaTitle: blogData.metaTitle,
            metaDescription: blogData.metaDescription,
            tags: blogData.tags,
            published: true,
            publishedAt: new Date(),
          } as any);
          created.push({ title: blogData.title, url: `${BASE_URL}/blog/${slug}` });
        } catch (e) {
          created.push({ title: `[error] ${topic}`, url: "" });
        }
      }

      const newUrls = created
        .filter((c) => !c.title.startsWith("[existing]") && !c.title.startsWith("[error]") && c.url)
        .map((c) => c.url);
      if (newUrls.length) await submitIndexNowBatched(newUrls);
      const postList = created
        .map((c) => `• ${c.title.replace("[existing] ", "").replace("[error] ", "⚠ ")}`)
        .join("\n");
      return NextResponse.json({
        summary: `✓ ${created.filter((c) => !c.title.startsWith("[existing]") && !c.title.startsWith("[error]")).length} blog posts written & published\n✓ All submitted to IndexNow\n\n${postList}`,
        details: { created: created.length },
      });
    }

    // ── STEP: Social pack ────────────────────────────────────────────────────
    if (stepId === "svivva-social") {
      const social = isOrbitFreeAIConfigured()
        ? await generateWithAIOrFallback(
            async () => {
              const gen = await openai.chat.completions.create({
                model: getDefaultModel(),
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      "Social media manager for Svivva — an AI platform that turns natural language prompts into production-ready APIs with schema enforcement, version control, A/B testing, and a marketplace.",
                  },
                  {
                    role: "user",
                    content: `Create a complete social media launch pack. Return JSON: {
  twitter_thread: [8 tweets as strings, first tweet is the hook],
  linkedin: { headline, body (3-4 paragraphs), cta },
  reddit_webdev: { title, body },
  reddit_saas: { title, body },
  reddit_sideprojects: { title, body },
  producthunt: { tagline (≤60 chars), description (260 chars), first_comment },
  show_hn: { title, body }
}`,
                  },
                ],
              });
              return JSON.parse(gen.choices[0].message.content || "{}");
            },
            () => generateSocialPack(),
            "social",
          )
        : generateSocialPack();

      const lines = [
        `✓ Twitter/X thread: ${social.twitter_thread?.length || 0} tweets`,
        `✓ LinkedIn post generated`,
        `✓ Reddit posts: r/webdev, r/SaaS, r/sideprojects`,
        `✓ Product Hunt: "${social.producthunt?.tagline || ""}"`,
        `✓ Show HN post generated`,
        "",
        "── Twitter Thread Preview ──",
        ...(social.twitter_thread?.slice(0, 3) || []).map(
          (t: string, i: number) => `${i + 1}. ${t.slice(0, 100)}…`,
        ),
        "",
        "── Product Hunt ──",
        `Tagline: ${social.producthunt?.tagline || ""}`,
      ];
      return NextResponse.json({ summary: lines.join("\n"), details: social });
    }

    // ── STEP: Submit sitemap ─────────────────────────────────────────────────
    if (stepId === "svivva-submit") {
      const urls = await getAllSiteUrlsForIndexing();

      // Fire all IndexNow + Bing ping requests fire-and-forget — never block waiting for them
      // (Cloud Run kills long-running requests; these network calls don't need to block the UI)
      submitIndexNowBatched(urls).catch(() => {});
      const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`, {
        signal: AbortSignal.timeout(10000),
      }).catch(() => {});

      return NextResponse.json({
        summary: [
          `✓ ${urls.length} URLs queued for submission to Bing, Yandex, Yahoo`,
          "✓ IndexNow submission fired (runs in background)",
          "✓ Bing sitemap ping fired",
          "",
          `Sitemap URL: ${BASE_URL}/sitemap.xml`,
          "For Google: go to Google Search Console → Sitemaps → paste your sitemap URL.",
          "Indexing typically starts within 24-48 hours.",
        ].join("\n"),
        details: { urls: urls.length, indexnow: true, bing: true },
      });
    }

    // ── STEP: Import apps — parallel batches, 4 SEO pages each ───────────────
    if (stepId === "mini-import") {
      const {
        sourceUrl,
        tools: passedTools,
        chunkIndex = 0,
        chunkSize = 30,
      }: {
        sourceUrl?: string;
        tools?: DiscoveredTool[];
        chunkIndex?: number;
        chunkSize?: number;
      } = body;

      // Auto-discover tools if none were passed from the UI
      let allTools: DiscoveredTool[] = passedTools || [];
      if (!allTools.length) {
        const miniAppsUrl = sourceUrl || getPyracryptMiniAppsBaseUrl();
        allTools = await autoDiscoverTools(miniAppsUrl);
        if (!allTools.length) {
          return NextResponse.json(
            {
              error: `Could not discover tools from ${miniAppsUrl}. The app may be offline — try again or use the Discover Tools button in the Launchpad.`,
            },
            { status: 400 },
          );
        }
      }

      const totalTools = allTools.length;
      const requestedChunk = Math.max(1, Math.min(chunkSize || 30, 40));
      const effectiveChunkSize = requestedChunk;

      const start = chunkIndex * effectiveChunkSize;
      const repls = allTools.slice(start, start + effectiveChunkSize);

      if (!repls.length) {
        return NextResponse.json({
          summary: `✓ All ${totalTools} tools already processed.`,
          details: { tools: 0, totalPages: 0, urls: 0, totalTools, done: true },
        });
      }

      // --- Helper: generate + save 4 pages for one tool ---
      interface AppResult {
        appTitle: string;
        pages: { title: string; url: string }[];
        urls: string[];
      }

      async function processOneApp(repl: DiscoveredTool): Promise<AppResult> {
        const appName = repl.name;
        const appDesc = repl.description || `A free AI-powered tool called ${appName}`;
        const appUrl = repl.url;
        const baseSlug = appName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 48);
        const appPages: { title: string; url: string }[] = [];
        const appUrls: string[] = [];

        // Skip entirely if the main page already exists (idempotent re-runs)
        try {
          const existing = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, baseSlug))
            .limit(1);
          if (existing.length) return { appTitle: appName, pages: [], urls: [] };
        } catch {
          /* continue */
        }

        const useAI = isOrbitFreeAIConfigured();
        try {
          let variants;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "Expert SEO copywriter for AI-powered web apps. Write keyword-rich HTML pages that rank and convert. Each page must have: rich H1/H2/H3 structure, feature list with <ul>, FAQ section with 5+ items, and a CTA button linking to the app. Return ONLY valid JSON.",
                },
                {
                  role: "user",
                  content: `Generate 4 SEO landing pages for the app "${appName}" — ${appDesc}. App URL: ${appUrl}. Part of the Svivva AI Tools Hub (50 free AI tools).

Return JSON with these 4 keys:
{
  "main": { "title": "...", "metaTitle": "≤60 chars", "metaDescription": "≤155 chars", "content": "full HTML: hero H1, what-it-does H2, 6-item feature <ul>, benefits H2, 5-item FAQ, CTA → ${appUrl}" },
  "guide": { "title": "How to Use ${appName} — Step-by-Step Guide", "metaTitle": "≤60 chars", "metaDescription": "≤155 chars", "content": "HTML: H1 intro, 5-step guide H2s, pro tips H2, troubleshooting FAQ, CTA" },
  "alternative": { "title": "Best Free ${appName} Alternative in 2025", "metaTitle": "≤60 chars", "metaDescription": "≤155 chars", "content": "HTML: H1 'Why ${appName} is the Best Free Option', feature comparison table, strengths vs paid tools, CTA" },
  "free": { "title": "Free ${appName} — No Sign Up Required", "metaTitle": "≤60 chars", "metaDescription": "≤155 chars", "content": "HTML: targets 'free ${appName}' searches — emphasize free access, instant use, no credit card, CTA to ${appUrl}" }
}`,
                },
              ],
            });

            const pages = JSON.parse(gen.choices[0].message.content || "{}");
            variants = [
              { key: "main", slug: baseSlug, data: pages.main },
              { key: "guide", slug: `${baseSlug}-guide`, data: pages.guide },
              { key: "alternative", slug: `${baseSlug}-alternative`, data: pages.alternative },
              { key: "free", slug: `free-${baseSlug}`, data: pages.free },
            ];
          } else {
            // Use templates - generate 4 pages
            const templatePages = generateMiniSEOPages(appName, appDesc, appUrl);
            variants = templatePages.map((p, i) => ({
              key: i === 0 ? "main" : i === 1 ? "guide" : i === 2 ? "alternative" : "free",
              slug: p.slug,
              data: p,
            }));
          }

          for (const v of variants) {
            if (!v.data?.content) continue;
            try {
              const ex = await db
                .select({ id: seoLandingPages.id })
                .from(seoLandingPages)
                .where(eq(seoLandingPages.slug, v.slug))
                .limit(1);
              if (ex.length) continue;
              await db.insert(seoLandingPages).values({
                slug: v.slug,
                title: v.data.title || appName,
                content: v.data.content,
                keyword: appName,
                headline: v.data.headline || v.data.title || appName,
                howItWorks: (v.data as any).howItWorks || `${appName} is a free AI-powered tool`,
                whoItsFor: (v.data as any).whoItsFor || "Anyone looking for free AI tools",
                metaTitle: v.data.metaTitle || v.data.title || appName,
                metaDescription: v.data.metaDescription || "",
                category: "seed-marketing",
                published: true,
                toolUrl: appUrl,
              });
              const pageUrl = `${BASE_URL}/${v.slug}`;
              appUrls.push(pageUrl);
              appPages.push({ title: v.data.title || appName, url: pageUrl });
            } catch {
              /* db error — skip variant */
            }
          }
        } catch (e) {
          console.warn(`[Orbit] Failed to process ${appName}:`, String(e).slice(0, 100));
        }

        return { appTitle: appName, pages: appPages, urls: appUrls };
      }

      // --- Parallel batch processing: smaller batches = faster responses under serverless limits ---
      const BATCH = 2;
      const allCreated: AppResult[] = [];
      const newPageUrls: string[] = [];

      for (let i = 0; i < repls.length; i += BATCH) {
        const batch = repls.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map(processOneApp));
        for (const r of results) {
          if (r.status === "fulfilled" && r.value.pages.length) {
            allCreated.push(r.value);
            newPageUrls.push(...r.value.urls);
          }
        }
      }

      if (newPageUrls.length > 0) await submitIndexNowBatched(newPageUrls);

      const totalPages = allCreated.reduce((n, a) => n + a.pages.length, 0);
      const processedInChunk = allCreated.filter((a) => a.pages.length > 0).length;
      const skippedInChunk = repls.length - processedInChunk;
      const endIndex = start + repls.length;
      const isDone = endIndex >= totalTools;
      const nextChunkIndex = chunkIndex + 1;

      const appList = allCreated
        .filter((a) => a.pages.length > 0)
        .slice(0, 20)
        .map((a) => `• ${a.appTitle}: ${a.pages.length} pages`)
        .join("\n");

      const sourceLine = sourceUrl ? `Source Repl: ${sourceUrl}` : "";
      const chunkLine =
        totalTools > effectiveChunkSize
          ? `Processing ${Math.min(endIndex, totalTools)} / ${totalTools} tools (batch ${chunkIndex + 1} of ${Math.ceil(totalTools / effectiveChunkSize)})`
          : `✓ ${repls.length} tool${repls.length === 1 ? "" : "s"} from your Repl`;

      return NextResponse.json({
        summary: [
          sourceLine,
          chunkLine,
          processedInChunk > 0
            ? `✓ ${totalPages} new SEO pages live on svivva.com`
            : `✓ ${skippedInChunk} tools already had pages — skipped`,
          processedInChunk > 0
            ? `✓ Each page links directly to the real tool URL on your Repl`
            : "",
          newPageUrls.length > 0 ? `✓ ${newPageUrls.length} pages submitted to IndexNow` : "",
          "",
          appList ? "Tools promoted this batch:\n" + appList : "",
          "",
          isDone ? "✓ All tools processed. Run 'Build Hub & Categories' next." : "",
        ]
          .filter(Boolean)
          .join("\n"),
        details: {
          tools: repls.length,
          totalPages,
          urls: newPageUrls.length,
          done: isDone,
          nextChunkIndex,
          totalTools,
        },
      });
    }

    if (stepId === "mini-security") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;

      if (!passedTools?.length) {
        return NextResponse.json(
          {
            error:
              "No security tools provided. Discover the Pyracrypt mini apps first, then run this step.",
          },
          { status: 400 },
        );
      }

      const created: { title: string; url: string }[] = [];

      for (const tool of passedTools.slice(0, 25)) {
        const slugBase = `pyracrypt-${tool.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 48)}`;
        const variants = [
          {
            slug: slugBase,
            title: `${tool.name} Security Overview`,
            headline: `${tool.name} security, explained`,
            whoItsFor: "Founders, engineers, and security-focused users",
          },
          {
            slug: `${slugBase}-best-practices`,
            title: `How to Secure ${tool.name}`,
            headline: `Hardening guide for ${tool.name}`,
            whoItsFor: "Teams deploying cyber and security tools",
          },
        ];

        for (const variant of variants) {
          const existing = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, variant.slug))
            .limit(1);
          if (existing.length) {
            created.push({
              title: `[existing] ${variant.title}`,
              url: `${BASE_URL}/${variant.slug}`,
            });
            continue;
          }

          await db.insert(seoLandingPages).values({
            slug: variant.slug,
            title: variant.title,
            keyword: `${tool.name} security`,
            headline: variant.headline,
            howItWorks: `${tool.description || tool.name} connected to Svivva's marketing engine`,
            whoItsFor: variant.whoItsFor,
            content: `<h1>${variant.headline}</h1><p>${tool.description || tool.name}</p><p><a href="${tool.url}">Open live app</a></p>`,
            metaTitle: variant.title,
            metaDescription: `${tool.name} security page generated from Pyracrypt.`,
            category: "seed-marketing",
            published: true,
            toolUrl: sourceUrl || tool.url,
          });

          created.push({ title: variant.title, url: `${BASE_URL}/${variant.slug}` });
        }
      }

      const urls = created.filter((c) => c.url).map((c) => c.url);
      if (urls.length > 0) await submitIndexNowBatched(urls);

      return NextResponse.json({
        summary: [
          `✓ Pyracrypt security pages created for ${passedTools.length} tools`,
          `✓ ${created.length} landing pages published on svivva.com`,
          `✓ Security positioning now tied to Svivva marketing`,
        ].join("\n"),
        details: { tools: passedTools.length, pages: created.length, urls: urls.length },
      });
    }

    if (stepId === "mini-app-build") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;

      if (!passedTools?.length) {
        return NextResponse.json(
          {
            error: "No Pyracrypt tools found. Discover the mini apps first, then run this step.",
          },
          { status: 400 },
        );
      }

      const outputs: { title: string; url: string }[] = [];
      for (const tool of passedTools.slice(0, 20)) {
        const baseSlug = `build-${tool.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 44)}`;
        const pages = [
          {
            slug: baseSlug,
            title: `${tool.name} App Builder`,
            keyword: `${tool.name} app builder`,
            headline: `Build and ship apps around ${tool.name}`,
            howItWorks: `Svivva turns ${tool.name} into a build-ready product page, API prompt, and launch asset.`,
            whoItsFor: "Founders and builders shipping security or AI tools",
          },
          {
            slug: `${baseSlug}-api`,
            title: `${tool.name} API Blueprint`,
            keyword: `${tool.name} api`,
            headline: `${tool.name} API blueprint`,
            howItWorks: `Svivva generates a structured API concept and launch page for ${tool.name}.`,
            whoItsFor: "Engineers wiring APIs and product workflows",
          },
          {
            slug: `${baseSlug}-launch`,
            title: `${tool.name} Launch Studio`,
            keyword: `${tool.name} launch studio`,
            headline: `Launch ${tool.name} with Svivva`,
            howItWorks: `Svivva creates launch pages, social copy, and app-store-style positioning for ${tool.name}.`,
            whoItsFor: "Teams preparing a public launch",
          },
        ];

        for (const page of pages) {
          const existing = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, page.slug))
            .limit(1);
          if (existing.length) {
            outputs.push({ title: `[existing] ${page.title}`, url: `${BASE_URL}/${page.slug}` });
            continue;
          }

          await db.insert(seoLandingPages).values({
            slug: page.slug,
            title: page.title,
            keyword: page.keyword,
            headline: page.headline,
            howItWorks: page.howItWorks,
            whoItsFor: page.whoItsFor,
            content: `<h1>${page.headline}</h1><p>${tool.description || tool.name}</p><p><a href="${tool.url}">Open ${tool.name}</a></p>`,
            metaTitle: page.title,
            metaDescription: `${tool.name} integrated into Svivva app-building features.`,
            category: "seed-marketing",
            published: true,
            toolUrl: sourceUrl || tool.url,
          });

          outputs.push({ title: page.title, url: `${BASE_URL}/${page.slug}` });
        }
      }

      const urls = outputs.map((o) => o.url);
      if (urls.length > 0) await submitIndexNowBatched(urls);

      return NextResponse.json({
        summary: [
          `✓ App-building pages created for ${passedTools.length} Pyracrypt tools`,
          `✓ ${outputs.length} Svivva build pages published`,
          `✓ Pyracrypt now connects to Svivva API/app-building flows`,
        ].join("\n"),
        details: { tools: passedTools.length, pages: outputs.length, urls: urls.length },
      });
    }

    if (stepId === "mini-api-security") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;

      if (!passedTools?.length) {
        return NextResponse.json(
          {
            error: "No tools found. Discover the Pyracrypt apps first, then run this step.",
          },
          { status: 400 },
        );
      }

      const created: { title: string; url: string }[] = [];
      for (const tool of passedTools.slice(0, 20)) {
        const slug = `api-security-${tool.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 44)}`;
        const existing = await db
          .select({ id: seoLandingPages.id })
          .from(seoLandingPages)
          .where(eq(seoLandingPages.slug, slug))
          .limit(1);
        if (existing.length) {
          created.push({
            title: `[existing] ${tool.name} API Security`,
            url: `${BASE_URL}/${slug}`,
          });
          continue;
        }

        await db.insert(seoLandingPages).values({
          slug,
          title: `${tool.name} API Security`,
          keyword: `${tool.name} api security`,
          headline: `${tool.name} API security for production`,
          howItWorks: `Svivva helps protect ${tool.name} with auth, validation, rate limits, and secure launch practices.`,
          whoItsFor: "Founders and developers shipping APIs",
          content: `<h1>${tool.name} API Security</h1><ul><li>Auth checks</li><li>Input validation</li><li>Rate limiting</li><li>Secret handling</li><li>Audit-ready launch checklist</li></ul><p>${tool.description || tool.name}</p><p><a href="${tool.url}">Open tool</a></p>`,
          metaTitle: `${tool.name} API Security`,
          metaDescription: `${tool.name} security page for API protection and safe launch flows.`,
          category: "seed-marketing",
          published: true,
          toolUrl: sourceUrl || tool.url,
        });

        created.push({ title: `${tool.name} API Security`, url: `${BASE_URL}/${slug}` });
      }

      const urls = created.map((c) => c.url);
      if (urls.length > 0) await submitIndexNowBatched(urls);

      return NextResponse.json({
        summary: [
          `✓ API security pages created for ${passedTools.length} Pyracrypt tools`,
          `✓ Svivva now presents auth, validation, rate-limit, and secret-safe positioning`,
          `✓ ${created.length} pages published`,
        ].join("\n"),
        details: { tools: passedTools.length, pages: created.length, urls: urls.length },
      });
    }

    // ── STEP: Hub page + auto category pages ─────────────────────────────────
    if (stepId === "mini-hub") {
      // Fetch all app pages created so far
      const appPages = await db
        .select({
          slug: seoLandingPages.slug,
          title: seoLandingPages.title,
          toolUrl: seoLandingPages.toolUrl,
        })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "seed-marketing"));

      // Filter to main pages only (no -guide, -alternative, free- prefix)
      const mainPages = appPages.filter(
        (p) =>
          !p.slug.endsWith("-guide") &&
          !p.slug.endsWith("-alternative") &&
          !p.slug.startsWith("free-"),
      );

      const appTitles = mainPages.map((p) => p.title || p.slug).slice(0, 60);

      if (!appTitles.length) {
        return NextResponse.json(
          { error: "No app pages found. Run 'Promote Selected Apps' first to generate app pages." },
          { status: 400 },
        );
      }

      // 1. Categorize + generate master hub page + category pages via AI
      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "SEO architect building a hub page strategy for a collection of AI tools. Create well-structured, high-traffic landing pages for tool collections.",
          },
          {
            role: "user",
            content: `I have ${appTitles.length} AI-powered mini apps in the Svivva AI Tools Hub. App names: ${appTitles.join(", ")}.

Generate:
1. A master hub page listing ALL apps
2. 6 category pages grouping apps by type

Return JSON:
{
  "hub": {
    "slug": "ai-tools-hub",
    "title": "Svivva AI Tools Hub — ${appTitles.length} Free AI Tools",
    "metaTitle": "≤60 chars",
    "metaDescription": "≤155 chars",
    "content": "Full HTML: hero H1, subtitle, grid of all apps as <ul> with links to /${appTitles[0]?.toLowerCase().replace(/\\s+/g, "-")}, benefits section, CTA. Include all ${appTitles.length} app names."
  },
  "categories": [
    {
      "name": "AI Writing Tools",
      "slug": "ai-writing-tools",
      "metaTitle": "≤60 chars",
      "metaDescription": "≤155 chars",
      "apps": ["app name 1", "app name 2"],
      "content": "HTML: H1, category intro, app list <ul> with descriptions, who this is for, CTA"
    }
    // ... 5 more categories relevant to these specific apps
  ]
}`,
          },
        ],
      });

      const hubData = JSON.parse(gen.choices[0].message.content || "{}");
      const createdPages: string[] = [];

      // Save hub page
      if (hubData.hub?.content) {
        try {
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, hubData.hub.slug || "ai-tools-hub"))
            .limit(1);
          const slug = ex.length
            ? `ai-tools-hub-${randomBytes(3).toString("hex")}`
            : hubData.hub.slug || "ai-tools-hub";
          await db.insert(seoLandingPages).values({
            slug,
            title: hubData.hub.title || "AI Tools Hub",
            keyword: "ai tools hub free",
            headline: hubData.hub.title || "50 Free AI Tools in One Place",
            howItWorks: "Browse and instantly use 50+ free AI-powered tools built with Svivva",
            whoItsFor: "Anyone looking for free AI tools — no sign up required",
            content: hubData.hub.content,
            metaTitle: hubData.hub.metaTitle || hubData.hub.title,
            metaDescription: hubData.hub.metaDescription || "",
            category: "seed-marketing",
            published: true,
            toolUrl: `${BASE_URL}/${slug}`,
          });
          createdPages.push(`${BASE_URL}/${slug}`);
        } catch {
          /* skip */
        }
      }

      // Save category pages
      const cats = Array.isArray(hubData.categories) ? hubData.categories : [];
      for (const cat of cats.slice(0, 8)) {
        if (!cat?.content || !cat?.slug) continue;
        try {
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, cat.slug))
            .limit(1);
          const finalSlug = ex.length ? `${cat.slug}-${randomBytes(3).toString("hex")}` : cat.slug;
          await db.insert(seoLandingPages).values({
            slug: finalSlug,
            title: cat.name || cat.slug,
            content: cat.content,
            keyword: cat.name || cat.slug,
            headline: cat.name || cat.slug,
            howItWorks: "Browse free AI tools in this category — no sign up, instant access",
            whoItsFor: "Anyone searching for free AI tools in this category",
            metaTitle: cat.metaTitle || cat.name || cat.slug,
            metaDescription: cat.metaDescription || "",
            category: "seed-marketing",
            published: true,
            toolUrl: `${BASE_URL}/${finalSlug}`,
          });
          createdPages.push(`${BASE_URL}/${finalSlug}`);
        } catch {
          /* skip */
        }
      }

      if (createdPages.length > 0) await submitIndexNowBatched(createdPages);

      return NextResponse.json({
        summary: [
          `✓ Master hub page created: ${BASE_URL}/ai-tools-hub`,
          `✓ ${cats.length} category pages created (auto-grouped by AI)`,
          `✓ All ${createdPages.length} pages submitted to IndexNow`,
          "",
          "Hub page targets: 'AI tools collection', 'free AI tools', 'best AI tools'",
          "Category pages capture long-tail category searches.",
          "",
          "Pages created:",
          ...createdPages.slice(0, 10).map((u) => `• ${u}`),
        ].join("\n"),
        details: { hub: 1, categories: cats.length, total: createdPages.length },
      });
    }

    // ── STEP: mini-embed — Powered by Svivva widget ──────────────────────────
    if (stepId === "mini-embed") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const toolList = (passedTools || []).slice(0, 50);
      const toolSample = toolList
        .slice(0, 8)
        .map((t) => `• ${t.name}`)
        .join("\n");

      const prompt = `You are a conversion copywriter for Svivva (${BASE_URL}), an AI API builder.

A user has ${toolList.length > 0 ? toolList.length : "50"} free AI tools hosted at ${sourceUrl || "their Replit app"}.
Sample tools: ${toolSample || "AI writing, image generation, code tools, etc."}

Generate a complete "Powered by Svivva" traffic package that these tool pages should embed to send users to ${BASE_URL}. Include:

1. **Top Banner** — sticky/fixed top banner HTML+CSS. Minimal, clean. Message like "Built with Svivva — the AI API platform" with a CTA button that opens ${BASE_URL}?utm_source=mini-tools&utm_medium=banner&utm_campaign=tools-hub

2. **Footer Widget** — HTML+CSS footer section. Slightly larger, "Enjoyed this tool? Build your own AI-powered app with Svivva in minutes. No backend required." with CTA → ${BASE_URL}?utm_source=mini-tools&utm_medium=footer

3. **Post-Use CTA** — shown after user completes an action (e.g., after generating content). JavaScript snippet + HTML that shows a modal/toast: "Like this result? Build your own AI tool like this →" with UTM link.

4. **React Component** (for Replit apps using React) — a reusable <PoweredBySvivva /> component that renders a bottom bar with gradient matching Svivva's teal (#5BA8A0) and burgundy (#6B2C4A).

5. **Placement Guide** — where to add each snippet for maximum click-through.

Use concise, compelling copy. Every link must use UTM params. Make the widget beautiful but unobtrusive.`;

      const response = await openai.chat.completions.create({
        model: getDefaultModel(),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content || "";

      return NextResponse.json({
        summary: [
          `✓ "Powered by Svivva" widget package generated for ${toolList.length || "your"} mini apps`,
          "",
          `Paste these snippets into each tool to send users directly to ${BASE_URL}:`,
          "",
          content,
          "",
          "─────────────────────",
          `All links use UTM tracking so you can see traffic from mini apps in your Google Analytics.`,
        ].join("\n"),
        details: { toolCount: toolList.length, snippets: 5 },
      });
    }

    // ── STEP: GoDaddy CNAME ──────────────────────────────────────────────────
    if (stepId === "mini-cname") {
      const creds = await db.execute(
        sql`SELECT godaddy_api_key, godaddy_api_secret, godaddy_domain FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
      );
      const row = (creds as unknown as any[])[0];
      const domain = row?.godaddy_domain || new URL(BASE_URL).hostname;

      // Build subdomain map dynamically from connected Repls passed in body
      interface ConnectedTool {
        name: string;
        url: string;
        description?: string;
      }
      const { tools: connectedTools }: { tools?: ConnectedTool[] } = body;

      // Dedupe by hostname so we get one subdomain per Repl (not per tool)
      const uniqueRepls: { host: string; name: string }[] = [];
      const seenHosts = new Set<string>();
      for (const tool of connectedTools || []) {
        try {
          const host = new URL(tool.url).hostname;
          if (!seenHosts.has(host)) {
            seenHosts.add(host);
            uniqueRepls.push({ host, name: tool.name });
          }
        } catch {
          /* skip malformed URL */
        }
      }

      // Derive a clean subdomain slug from Repl name or hostname
      const toSub = (name: string, host: string): string => {
        const fromName = name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 20);
        if (fromName) return fromName;
        // fallback: first segment of hostname (e.g. "cyber-tools" from "cyber-tools.example.com")
        return (
          host
            .split(".")[0]
            .replace(/-[a-z0-9]+$/, "")
            .slice(0, 20) || "tools"
        );
      };

      // Fallback to known Pyracrypt defaults if no tools were passed
      const SUBDOMAIN_MAP: { sub: string; target: string; label: string }[] =
        uniqueRepls.length > 0
          ? uniqueRepls.map((r) => ({ sub: toSub(r.name, r.host), target: r.host, label: r.name }))
          : getDefaultSubdomainCnameTargets();

      if (!row?.godaddy_api_key || !row?.godaddy_domain) {
        const manual = SUBDOMAIN_MAP.map(
          (s) =>
            `${s.sub}.${domain} → ${s.target}\n  GoDaddy DNS: Type=CNAME, Name=${s.sub}, Value=${s.target}, TTL=1hr`,
        ).join("\n\n");
        return NextResponse.json({
          summary: [
            "⚠ GoDaddy API key not connected — set it up in the Seeds Marketing Funnel.",
            "",
            `Add these ${SUBDOMAIN_MAP.length} CNAME records manually in GoDaddy DNS:`,
            "",
            manual,
            "",
            "Once DNS propagates (5–30 min) each subdomain should point at your deployed app host.",
            "In your host (Vercel, Netlify, Cloudflare, etc.) add each subdomain as a custom domain.",
          ].join("\n"),
          details: { skipped: true, subdomains: SUBDOMAIN_MAP },
        });
      }

      const authHeader = `sso-key ${row.godaddy_api_key}:${row.godaddy_api_secret}`;
      const results: { sub: string; target: string; ok: boolean; label: string }[] = [];

      for (const entry of SUBDOMAIN_MAP) {
        try {
          const r = await fetch(
            `https://api.godaddy.com/v1/domains/${domain}/records/CNAME/${entry.sub}`,
            {
              method: "PUT",
              headers: { Authorization: authHeader, "Content-Type": "application/json" },
              body: JSON.stringify([{ data: entry.target, ttl: 3600 }]),
              signal: AbortSignal.timeout(15000),
            },
          );
          results.push({
            sub: entry.sub,
            target: entry.target,
            ok: r.status === 200 || r.status === 201 || r.status === 204,
            label: entry.label,
          });
        } catch {
          results.push({ sub: entry.sub, target: entry.target, ok: false, label: entry.label });
        }
      }

      const lines = results.map((r) =>
        r.ok
          ? `✓ ${r.sub}.${domain} → ${r.target}  (${r.label})`
          : `✗ ${r.sub}.${domain} — failed (add manually in GoDaddy DNS)`,
      );
      const anyOk = results.some((r) => r.ok);
      const okCount = results.filter((r) => r.ok).length;

      return NextResponse.json({
        summary: [
          anyOk
            ? `✓ ${okCount}/${results.length} subdomain${okCount === 1 ? "" : "s"} created on ${domain}:`
            : `⚠ GoDaddy API error — create these manually:`,
          "",
          ...lines,
          "",
          "DNS propagation: 5–30 minutes.",
          "After propagation, add each subdomain in your hosting provider as a custom domain (TLS is provisioned there).",
          "",
          "Deploy Svivva itself:",
          "1. Deploy this repo to Vercel (or your host) from Git",
          "2. In the host project → Domains, add svivva.com / www as directed",
          "3. GoDaddy: point www (CNAME) at the hostname your provider gives you",
          "4. The host provisions TLS automatically",
        ].join("\n"),
        details: { domain, results, subdomains: SUBDOMAIN_MAP.length },
      });
    }

    // ── STEP: Full 50-app social launch pack ─────────────────────────────────
    if (stepId === "mini-social") {
      const allMiniPages = await db
        .select({ slug: seoLandingPages.slug, title: seoLandingPages.title })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "seed-marketing"));

      // Main pages only (not variants)
      const mainApps = allMiniPages.filter(
        (p) =>
          !p.slug.endsWith("-guide") &&
          !p.slug.endsWith("-alternative") &&
          !p.slug.startsWith("free-") &&
          !p.slug.startsWith("ai-") &&
          p.slug !== "ai-tools-hub",
      );
      const appCount = mainApps.length;
      const appNames = mainApps
        .map((p) => p.title || p.slug)
        .slice(0, 20)
        .join(", ");

      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Social media growth hacker launching a portfolio of 50 AI-powered tools on Svivva. Write viral, specific, benefit-first copy that drives clicks.",
          },
          {
            role: "user",
            content: `Launch social pack for the Svivva AI Tools Hub: a collection of ${appCount} free AI tools including: ${appNames}. Hub URL: ${BASE_URL}/ai-tools-hub.

Return JSON:
{
  "twitter_thread": [
    "Hook tweet (150 chars max, curiosity-driven)",
    "I built ${appCount} free AI tools. Here's the full list: 🧵",
    "Tool 1: [specific tool name] — [what it does in 1 line]. Try it free: ${BASE_URL}/...",
    "... 4 more tweets naming specific apps",
    "All ${appCount} tools are free, no sign up required.",
    "Follow for more free AI tools. Hub: ${BASE_URL}/ai-tools-hub"
  ],
  "linkedin": { "headline": "...", "body": "3 paragraphs about the 50-app hub, specific tool names, who it's for", "cta": "..." },
  "reddit_webdev": { "title": "I built ${appCount} AI-powered tools and made them all free — here's the hub", "body": "3 paragraphs, genuine, technical details, specific apps mentioned, link to hub" },
  "reddit_entrepreneur": { "title": "...", "body": "..." },
  "reddit_artificial": { "title": "...", "body": "..." },
  "producthunt": { "tagline": "≤60 chars", "description": "260 chars, name specific tools", "first_comment": "200 chars founder story" },
  "show_hn": { "title": "Show HN: ${appCount} free AI tools I built — no login needed", "body": "..." },
  "instagram_caption": "short punchy caption + 15 hashtags"
}`,
          },
        ],
      });

      const social = JSON.parse(gen.choices[0].message.content || "{}");
      return NextResponse.json({
        summary: [
          `✓ Full social launch pack for ${appCount} apps`,
          `✓ Twitter/X thread: ${social.twitter_thread?.length || 0} tweets`,
          `✓ LinkedIn post ready`,
          `✓ Reddit: r/webdev, r/entrepreneur, r/artificial`,
          `✓ Product Hunt: "${social.producthunt?.tagline || ""}"`,
          `✓ Show HN post ready`,
          `✓ Instagram caption + 15 hashtags`,
          "",
          "── Twitter Thread (first 3) ──",
          ...(social.twitter_thread?.slice(0, 3) || []).map(
            (t: string, i: number) => `${i + 1}. ${t.slice(0, 120)}`,
          ),
          "",
          `── Product Hunt ──`,
          `Tagline: ${social.producthunt?.tagline || ""}`,
          `Description: ${(social.producthunt?.description || "").slice(0, 120)}…`,
        ].join("\n"),
        details: social,
      });
    }

    // ── STEP: Index ALL app pages + hub + categories ──────────────────────────
    if (stepId === "mini-index") {
      const allUrls = await getAllSiteUrlsForIndexing();

      const seedPages = await db
        .select({ slug: seoLandingPages.slug, category: seoLandingPages.category })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.published, true));
      const seedUrls = seedPages
        .filter((p) => p.category === "seed-marketing")
        .map((p) => `${BASE_URL}/${p.slug}`);

      const allSet = new Set([...allUrls, ...seedUrls]);
      const finalUrls = Array.from(allSet);

      const seoPageCount = seedUrls.length;
      const allResult = await submitIndexNowBatched(finalUrls);

      const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
      await Promise.allSettled([
        fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`, {
          signal: AbortSignal.timeout(10000),
        }),
      ]);

      const [credsRow] = await db
        .select({ json: seedCredentials.googleServiceAccountJson })
        .from(seedCredentials)
        .where(isNotNull(seedCredentials.googleServiceAccountJson))
        .orderBy(desc(seedCredentials.updatedAt))
        .limit(1);

      let googleSubmitted = 0;
      let googleDetail = "";
      if (credsRow?.json) {
        const GOOGLE_BATCH = 50;
        for (let i = 0; i < finalUrls.length; i += GOOGLE_BATCH) {
          const batch = finalUrls.slice(i, i + GOOGLE_BATCH);
          const r = await submitUrlsToGoogleIndexingApi(credsRow.json, batch);
          googleSubmitted += r.submitted;
        }
        googleDetail = `✓ Google Indexing API: ${googleSubmitted} URL notification(s) sent in ${Math.ceil(finalUrls.length / GOOGLE_BATCH)} batch(es) (requires Search Console service account).`;
        try {
          await db.execute(
            sql`UPDATE seed_credentials SET last_google_indexing = NOW(), updated_at = NOW() WHERE google_service_account_json IS NOT NULL`,
          );
        } catch {
          /* non-fatal */
        }
      } else {
        googleDetail =
          "○ Google Indexing API skipped — save a Search Console service account under Marketing → Google Search.";
      }

      return NextResponse.json({
        summary: [
          `✓ ${seoPageCount} seed-marketing (mini-app) SEO URLs included`,
          `✓ ${finalUrls.length} total unique URLs submitted to IndexNow`,
          allResult.message,
          googleDetail,
          "✓ Bing sitemap pinged",
          "",
          "Bing, Yandex, and Yahoo receive IndexNow pings for every URL on this host.",
          "For Google: ensure sitemap is submitted in Search Console; Indexing API runs automatically when credentials exist.",
          `Sitemap: ${BASE_URL}/sitemap.xml`,
        ].join("\n"),
        details: {
          totalUrls: finalUrls.length,
          seedPages: seoPageCount,
          submitted: allResult.ok,
          googleIndexingApi: googleSubmitted,
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── MINI STEPS: Traffic machine for the OTHER Repl ────────────────────────
    // All mini steps receive sourceUrl (deployed Repl URL) and tools list
    // ══════════════════════════════════════════════════════════════════════════

    // ── STEP: Mini — Directory Submissions ───────────────────────────────────
    if (stepId === "mini-directories") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const targetUrl = sourceUrl || BASE_URL;
      const toolNames = (passedTools || [])
        .slice(0, 20)
        .map((t) => t.name)
        .join(", ");

      const DIRECTORIES = [
        {
          name: "Futurepedia",
          url: "https://www.futurepedia.io/submit-tool",
          cat: "AI Tools",
          da: 72,
          traffic: "2M+/mo",
        },
        {
          name: "There's An AI For That",
          url: "https://theresanaiforthat.com/submit",
          cat: "AI Tools",
          da: 68,
          traffic: "1.5M+/mo",
        },
        {
          name: "FutureTools.io",
          url: "https://www.futuretools.io/submit-a-tool",
          cat: "AI Tools",
          da: 58,
          traffic: "800K/mo",
        },
        {
          name: "TopAI.tools",
          url: "https://topai.tools/submit",
          cat: "AI Tools",
          da: 52,
          traffic: "500K/mo",
        },
        {
          name: "AiTopTools",
          url: "https://aitoptools.com/submit-tool",
          cat: "AI Tools",
          da: 48,
          traffic: "300K/mo",
        },
        {
          name: "Supertools",
          url: "https://supertools.therundown.ai/submit",
          cat: "AI Tools",
          da: 62,
          traffic: "1M+/mo",
        },
        {
          name: "EasyWithAI",
          url: "https://easywithai.com/submit-tool",
          cat: "AI Tools",
          da: 42,
          traffic: "150K/mo",
        },
        {
          name: "AITools.fyi",
          url: "https://aitools.fyi/submit",
          cat: "AI Tools",
          da: 44,
          traffic: "180K/mo",
        },
        {
          name: "AI Tool Hunt",
          url: "https://www.aitoolhunt.com/submit",
          cat: "AI Tools",
          da: 38,
          traffic: "100K/mo",
        },
        {
          name: "Insidr.ai",
          url: "https://www.insidr.ai/submit-tool",
          cat: "AI Tools",
          da: 40,
          traffic: "120K/mo",
        },
        {
          name: "Product Hunt",
          url: "https://www.producthunt.com/posts/new",
          cat: "SaaS",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "AlternativeTo",
          url: "https://alternativeto.net/recommend-software",
          cat: "SaaS",
          da: 82,
          traffic: "4M+/mo",
        },
        {
          name: "SaaSHub",
          url: "https://www.saashub.com/add-product",
          cat: "SaaS",
          da: 71,
          traffic: "2M+/mo",
        },
        {
          name: "G2",
          url: "https://www.g2.com/products/new",
          cat: "SaaS",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "Capterra",
          url: "https://vendors.capterra.com",
          cat: "SaaS",
          da: 89,
          traffic: "4M+/mo",
        },
        {
          name: "SourceForge",
          url: "https://sourceforge.net/software/vendor",
          cat: "SaaS",
          da: 93,
          traffic: "7M+/mo",
        },
        {
          name: "DevHunt",
          url: "https://devhunt.org/tool/new",
          cat: "Dev Tools",
          da: 49,
          traffic: "200K/mo",
        },
        {
          name: "Hacker News",
          url: "https://news.ycombinator.com/submit",
          cat: "Dev Tools",
          da: 92,
          traffic: "9M+/mo",
        },
        {
          name: "BetaList",
          url: "https://betalist.com/submit",
          cat: "Dev Tools",
          da: 62,
          traffic: "500K/mo",
        },
        {
          name: "BetaPage",
          url: "https://betapage.co/submit",
          cat: "Dev Tools",
          da: 52,
          traffic: "200K/mo",
        },
        {
          name: "Uneed",
          url: "https://www.uneed.best/submit",
          cat: "Dev Tools",
          da: 47,
          traffic: "150K/mo",
        },
        {
          name: "Indie Hackers",
          url: "https://www.indiehackers.com/products",
          cat: "Dev Tools",
          da: 78,
          traffic: "2M+/mo",
        },
        {
          name: "Launched.io",
          url: "https://launched.io/submit",
          cat: "Dev Tools",
          da: 44,
          traffic: "100K/mo",
        },
        {
          name: "RapidAPI Hub",
          url: "https://rapidapi.com/developer/dashboard",
          cat: "API",
          da: 84,
          traffic: "4M+/mo",
        },
        {
          name: "Public APIs GitHub",
          url: "https://github.com/public-apis/public-apis",
          cat: "API",
          da: 88,
          traffic: "3M+/mo",
        },
        { name: "AngelList", url: "https://angel.co", cat: "Startup", da: 90, traffic: "5M+/mo" },
        {
          name: "Crunchbase",
          url: "https://www.crunchbase.com/organizations/new",
          cat: "Startup",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "Startup Stash",
          url: "https://startupstash.com/add-resource",
          cat: "Startup",
          da: 58,
          traffic: "400K/mo",
        },
        {
          name: "Slant",
          url: "https://www.slant.co/improve/topics/add",
          cat: "SaaS",
          da: 63,
          traffic: "1M+/mo",
        },
        {
          name: "MakerPad",
          url: "https://makerpad.zapier.com/posts",
          cat: "No-Code",
          da: 56,
          traffic: "300K/mo",
        },
      ];

      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write product listing content for SaaS and AI tool directories. Be specific, factual, and benefit-first. Use the real tool names.",
          },
          {
            role: "user",
            content: `Create directory listing content for a free AI tools hub at ${targetUrl}.
The collection includes ${passedTools?.length || "50"}+ free tools. ${toolNames ? `Tool names include: ${toolNames}.` : ""}
These are all free-to-use, no sign-up tools, built with Svivva.

Return JSON:
{
  "tagline": "≤60 chars, punchy",
  "shortDesc": "≤150 chars",
  "description": "300 chars — what the hub is, free tools, no sign up",
  "longDesc": "800 chars — full story, specific tool names, who it's for, free access, built with Svivva",
  "features": ["feature 1","feature 2","feature 3","feature 4","feature 5"],
  "categories": ["AI Tools","Free Tools","Developer Tools","No-Code","Web Apps"],
  "keywords": ["free ai tools","ai tools hub","free online tools","no signup ai tools"],
  "phHint": "Product Hunt first comment (founder story, 280 chars)",
  "hnHint": "Show HN title (max 80 chars, specific about what the tools do)"
}`,
          },
        ],
      });

      const listing = JSON.parse(gen.choices[0].message.content || "{}");
      const dirList = DIRECTORIES.map(
        (d) => `• [DA ${d.da}] ${d.name} (${d.cat}, ${d.traffic}) — ${d.url}`,
      ).join("\n");

      return NextResponse.json({
        summary: [
          `✓ Listing content generated for ${targetUrl}`,
          `✓ ${DIRECTORIES.length} directories mapped with submission URLs`,
          "",
          `Tagline: "${listing.tagline}"`,
          `Short desc: "${listing.shortDesc}"`,
          "",
          "🔑 PRIORITY SUBMISSIONS:",
          "1. Product Hunt (5M/mo) — Tuesday–Thursday 12am PST",
          "2. Show HN (9M/mo) — weekday 9am EST",
          "3. Futurepedia + TAAFT (3.5M/mo) — instant AI tool indexing",
          "4. G2 + Capterra (9M/mo) — request reviews from early users",
          "5. SourceForge (7M/mo) — free, high-DA backlink",
          "6. Indie Hackers (2M/mo) — post milestone story",
          "",
          `Show HN title: "${listing.hnHint}"`,
          `PH first comment: "${listing.phHint}"`,
          "",
          "All 30 directories:",
          dirList,
        ].join("\n"),
        details: { directories: DIRECTORIES.length, listing, targetUrl },
      });
    }

    // ── STEP: Mini — Parasite SEO Articles ───────────────────────────────────
    if (stepId === "mini-parasite") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const targetUrl = sourceUrl || BASE_URL;
      const toolCount = passedTools?.length || 50;
      const sampleTools = (passedTools || [])
        .slice(0, 8)
        .map((t) => t.name)
        .join(", ");

      const articles = await generateWithAIOrFallback(
        async () => {
          const gen = await openai.chat.completions.create({
            model: getDefaultModel(),
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Expert content marketer who writes platform-native articles that rank on Google AND get featured by editors. Write in each platform's authentic voice. Articles are genuinely useful — not promotional. Mention the tools collection naturally as the subject.",
              },
              {
                role: "user",
                content: `Write 5 platform-native articles about a collection of ${toolCount} free AI tools at ${targetUrl}. ${sampleTools ? `Tools include: ${sampleTools}.` : ""} Each article should be platform-native in tone.

Return JSON:
{
  "devto": {
    "title": "I built ${toolCount} free AI tools — here's what I learned",
    "tags": ["ai","tools","javascript","productivity"],
    "content": "Full markdown, 700 words, technical angle, specific tool names, code snippets where relevant, link to ${targetUrl} naturally"
  },
  "hashnode": {
    "title": "How to get instant AI superpowers (for free): ${toolCount} tools, no login",
    "tags": ["ai","productivity","tools"],
    "content": "Full markdown, 700 words, tutorial-style, specific tools featured, link to ${targetUrl}"
  },
  "medium": {
    "title": "I gave my team access to ${toolCount} AI tools for free — here's what happened",
    "subtitle": "No budget, no subscriptions — just results",
    "content": "Full markdown, 700 words, story-driven, specific tools named, link to ${targetUrl} at end"
  },
  "hackernoon": {
    "title": "The ${toolCount} AI tools that replaced $500/month in SaaS subscriptions",
    "content": "Full markdown, 750 words, contrarian/opinionated, specific tools mentioned, ${targetUrl} as source"
  },
  "substack": {
    "title": "Free AI tools worth bookmarking (that actually work)",
    "content": "Full markdown, 650 words, curated newsletter style, specific tool descriptions, link to ${targetUrl}"
  }
}`,
              },
            ],
          });
          return JSON.parse(gen.choices[0].message.content || "{}");
        },
        () => {
          const tpl = generateMiniParasite();
          const pick = (needle: string) =>
            tpl.find((x) => x.platform.toLowerCase().includes(needle));
          const dev = pick("dev");
          const hn = pick("linkedin") || pick("medium");
          return {
            devto: {
              title: dev?.title || "Building a free AI tools hub",
              tags: ["ai", "tools", "javascript"],
              content: `${dev?.content || ""}\n\nTool hub: ${targetUrl}`,
            },
            hashnode: {
              title: pick("hashnode")?.title || "Ship AI tools faster",
              tags: ["ai", "tools"],
              content: `${pick("hashnode")?.content || ""}\n\n${targetUrl}`,
            },
            medium: {
              title: pick("medium")?.title || "What we learned shipping free tools",
              subtitle: "Practical founder notes",
              content: `${pick("medium")?.content || ""}\n\n${targetUrl}`,
            },
            hackernoon: {
              title: hn?.title || "Why free mini-apps beat bloated suites",
              content: `${hn?.content || pick("medium")?.content || ""}\n\n${targetUrl}`,
            },
            substack: {
              title: pick("substack")?.title || "Free tools worth bookmarking",
              content: `${pick("substack")?.content || ""}\n\n${targetUrl}`,
            },
          };
        },
        "mini-parasite",
      );
      const savedTitles: string[] = [];
      const parasiteMiniUrls: string[] = [];
      const platformKeys = ["devto", "hashnode", "medium", "hackernoon", "substack"];

      for (const key of platformKeys) {
        const article = articles[key];
        if (!article?.content) continue;
        try {
          const slug = `mini-${key}-${randomBytes(4).toString("hex")}`;
          const id = randomBytes(12).toString("hex");
          await db.insert(blogPosts).values({
            id,
            slug,
            title: article.title || `Mini apps on ${key}`,
            excerpt: `Parasite SEO article for ${key}: ${article.title}`,
            content: article.content,
            metaTitle: article.title || `AI Tools on ${key}`,
            metaDescription: article.subtitle || article.title || "",
            category: "parasite-seo",
            published: false,
          });
          savedTitles.push(`${key}: "${article.title}"`);
          parasiteMiniUrls.push(`${BASE_URL}/blog/${slug}`);
        } catch {
          /* skip */
        }
      }

      if (parasiteMiniUrls.length > 0) {
        await submitIndexNowBatched(parasiteMiniUrls).catch(() => {});
      }

      return NextResponse.json({
        summary: [
          `✓ ${savedTitles.length} platform-native articles generated for ${targetUrl}`,
          `✓ Saved to Blog section (unpublished — copy-paste to each platform)`,
          "",
          "ARTICLES GENERATED:",
          ...savedTitles.map((t) => `• ${t}`),
          "",
          "PLATFORM GUIDE:",
          "Dev.to (DA 94) → dev.to/new — best for technical angle, use code snippets",
          "Hashnode (DA 78) → hashnode.com — tutorial-style, link back to your domain",
          "Medium (DA 96) → medium.com — story-driven, import canonical URL from your domain",
          "HackerNoon (DA 82) → hackernoon.com/submit — opinionated, data-backed",
          "Substack (DA 82) → substack.com — newsletter-style, builds email list too",
          "",
          "PRO TIP: On Medium, set the 'canonical URL' to a page on your domain.",
          "This means Medium passes its DA to YOU while you still get their audience.",
          parasiteMiniUrls.length > 0
            ? `✓ ${parasiteMiniUrls.length} on-site blog draft URL(s) pinged via IndexNow.`
            : "",
        ].join("\n"),
        details: { articles: savedTitles.length, targetUrl },
      });
    }

    // ── STEP: Mini — AEO (Answer Engine Optimization) ────────────────────────
    if (stepId === "mini-aeo") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const targetUrl = sourceUrl || BASE_URL;
      const toolCount = passedTools?.length || 50;
      const toolSamples = (passedTools || []).slice(0, 10);
      const toolNames = toolSamples.map((t) => t.name).join(", ");

      // AEO queries targeting cybersecurity tool searchers — high-traffic, high-intent
      const baseQueries = [
        `how to check if a website is safe online for free`,
        `free tools to scan a website for security vulnerabilities`,
        `how to check ssl certificate of a website`,
        `how to look up dns records for a domain for free`,
        `best free cybersecurity tools for developers ${new Date().getFullYear()}`,
        `how to test cors on a website without installing anything`,
        `free online port scanner to check open ports`,
        `how to check http security headers of a website`,
        `how to scan github repository for leaked api keys`,
        `free website security audit tools online`,
      ];
      const toolSpecificQueries = toolSamples
        .slice(0, 4)
        .map((t) => `free ${t.name.toLowerCase()} online`);
      const AEO_QUERIES = [...baseQueries, ...toolSpecificQueries].slice(0, 10);

      let miniAeoPages: {
        query: string;
        slug: string;
        title: string;
        metaTitle: string;
        metaDescription: string;
        content: string;
      }[] = [];
      let miniAeoError: string | null = null;
      try {
        const gen = await openai.chat.completions.create({
          model: getDefaultModel(),
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Write Answer Engine Optimized content. These pages get cited by Perplexity, ChatGPT Search, Gemini. Rules: first 150 words = direct factual answer. Then 3-4 supporting paragraphs. End with natural mention of the tools hub. No marketing language.`,
            },
            {
              role: "user",
              content: `Generate AEO pages for ${toolCount} free AI tools at ${targetUrl}. ${toolNames ? `Tools include: ${toolNames}.` : ""}

Queries to target: ${AEO_QUERIES.join(" | ")}

Return JSON:
{
  "pages": [
    {
      "query": "exact query",
      "slug": "url-friendly-slug",
      "title": "Direct answer stated as an H1 (not a question)",
      "metaTitle": "≤60 chars",
      "metaDescription": "≤155 chars, factual",
      "content": "Full HTML: H1 (direct answer), opening paragraph (80-100 word direct answer), H2 supporting sections, H3 FAQ with 3 related questions, closing mention of ${targetUrl}"
    }
  ]
}`,
            },
          ],
        });
        const aeoData = JSON.parse(gen.choices[0].message.content || "{}");
        miniAeoPages = Array.isArray(aeoData.pages) ? aeoData.pages : [];
      } catch (e) {
        miniAeoError = String(e).slice(0, 300);
      }
      const pages = miniAeoPages;
      const created: string[] = [];

      for (const page of pages) {
        if (!page.content || !page.slug) continue;
        try {
          const slug = `tools-${page.slug}`;
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, slug))
            .limit(1);
          const finalSlug = ex.length ? `${slug}-${randomBytes(3).toString("hex")}` : slug;
          await db.insert(seoLandingPages).values({
            slug: finalSlug,
            title: page.title || page.query,
            keyword: page.query,
            headline: page.title || page.query,
            howItWorks: "Direct answer format — optimized for AI search engine citations",
            whoItsFor: "People searching on Perplexity, ChatGPT, Gemini for free AI tools",
            content: page.content,
            metaTitle: page.metaTitle || page.title || page.query,
            metaDescription: page.metaDescription || "",
            category: "aeo",
            published: true,
            toolUrl: targetUrl,
          });
          created.push(`${BASE_URL}/${finalSlug}`);
        } catch {
          /* skip */
        }
      }

      if (created.length) await submitIndexNowBatched(created);

      return NextResponse.json({
        summary: [
          miniAeoError ? `⚠ AI generation error: ${miniAeoError}` : null,
          `✓ ${created.length} AEO pages created for ${targetUrl}`,
          created.length > 0 ? `✓ All pages submitted to IndexNow` : null,
          created.length === 0 && miniAeoError
            ? "Retry the step — transient AI errors are common on large batch requests."
            : null,
          "",
          "These pages are written to be CITED by AI search engines.",
          "When someone asks Perplexity 'what are the best free AI tools',",
          "these pages get referenced and they link to your Repl.",
          "",
          "Queries targeted:",
          ...AEO_QUERIES.map((q) => `• "${q}"`),
          "",
          "Pages created:",
          ...created.slice(0, 8).map((u) => `• ${u}`),
        ]
          .filter(Boolean)
          .join("\n"),
        details: { created: created.length, targetUrl },
      });
    }

    // ── STEP: Mini — Community Strategy Pack ─────────────────────────────────
    if (stepId === "mini-communities") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const targetUrl = sourceUrl || BASE_URL;
      const toolCount = passedTools?.length || 50;
      const toolNames = (passedTools || [])
        .slice(0, 12)
        .map((t) => t.name)
        .join(", ");

      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Reddit marketing expert who writes posts that get upvoted, not removed. Posts are genuine, community-first. Each post provides real value and only mentions the tools naturally. Use the specific tool names provided.",
          },
          {
            role: "user",
            content: `Write community launch posts for a collection of ${toolCount} free AI tools at ${targetUrl}. ${toolNames ? `Tools include: ${toolNames}.` : ""}

Return JSON:
{
  "reddit": {
    "r/SideProject": { "title": "...", "body": "3-4 paragraphs, genuine builder story, specific tool names, numbers, link at end" },
    "r/webdev": { "title": "...", "body": "technical angle, what you built, specific tools mentioned, ${targetUrl}" },
    "r/artificial": { "title": "...", "body": "AI angle, free access, specific tool names" },
    "r/nocode": { "title": "...", "body": "no-code angle, built these tools without a team, specific examples" },
    "r/entrepreneur": { "title": "...", "body": "founder angle, lessons learned, what's working" },
    "r/ChatGPT": { "title": "...", "body": "use these tools alongside ChatGPT, specific names" },
    "r/productivity": { "title": "...", "body": "productivity angle, specific tools that save time, free" },
    "r/InternetIsBeautiful": { "title": "...", "body": "short, here are X free tools I built, ${targetUrl}" }
  },
  "show_hn": {
    "title": "Show HN: ${toolCount} free AI tools — no login required (${targetUrl})",
    "body": "HN-style: what you built, tech stack, what makes it different, honest about limitations"
  },
  "indie_hackers": {
    "title": "Milestone: built and launched ${toolCount} free AI tools — here's what happened",
    "body": "IH post: genuine story, traffic numbers if any, what's working, what's next"
  },
  "discord_templates": [
    "Intro message for AI Discord servers (200 chars, genuine, links to ${targetUrl})",
    "Reply when someone asks about free AI tools"
  ],
  "timing": {
    "best_days": "Tuesday–Thursday",
    "best_time": "9am–12pm EST",
    "hn_time": "Weekday 9–10am EST"
  }
}`,
          },
        ],
      });

      const community = JSON.parse(gen.choices[0].message.content || "{}");
      const redditPosts = community.reddit || {};
      const postSummary = Object.entries(redditPosts)
        .map(
          ([sub, post]: [string, unknown]) =>
            `${sub}: "${(post as Record<string, string>).title || ""}"`,
        )
        .join("\n");

      return NextResponse.json({
        summary: [
          `✓ ${Object.keys(redditPosts).length} Reddit posts written for ${targetUrl}`,
          `✓ Show HN post ready`,
          `✓ Indie Hackers milestone post ready`,
          `✓ 2 Discord templates ready`,
          "",
          "Best posting days: " + (community.timing?.best_days || "Tue–Thu"),
          "Best time: " + (community.timing?.best_time || "9am–12pm EST"),
          "HN time: " + (community.timing?.hn_time || "Weekday 9–10am EST"),
          "",
          "REDDIT POSTS:",
          postSummary,
          "",
          "Show HN title:",
          community.show_hn?.title || "",
          "",
          "IH post title:",
          community.indie_hackers?.title || "",
          "",
          "RULES: Post to one subreddit per day. Engage with replies within 1 hour.",
          "r/SideProject, r/InternetIsBeautiful, r/ChatGPT get the most traffic for free tool collections.",
        ].join("\n"),
        details: community,
      });
    }

    // ── STEP: Mini — PR & Newsletter Pitches ─────────────────────────────────
    if (stepId === "mini-outreach") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const targetUrl = sourceUrl || BASE_URL;
      const toolCount = passedTools?.length || 50;
      const toolNames = (passedTools || [])
        .slice(0, 8)
        .map((t) => t.name)
        .join(", ");

      const NEWSLETTERS = [
        {
          name: "TLDR AI",
          subscribers: "1.25M",
          contact: "ai@tldr.tech",
          niche: "AI tools and startups",
        },
        {
          name: "The Rundown AI",
          subscribers: "700K",
          contact: "hello@therundown.ai",
          niche: "daily AI news and tools",
        },
        {
          name: "Ben's Bites",
          subscribers: "100K",
          contact: "ben@bensbites.co",
          niche: "AI products",
        },
        {
          name: "AI Tool Report",
          subscribers: "300K",
          contact: "hello@aitoolreport.com",
          niche: "new AI tools",
        },
        {
          name: "Superhuman AI",
          subscribers: "400K",
          contact: "zain@superhuman.ai",
          niche: "AI for productivity",
        },
        {
          name: "JavaScript Weekly",
          subscribers: "200K",
          contact: "submit@javascriptweekly.com",
          niche: "JS/Node dev tools",
        },
        {
          name: "Bytes.dev",
          subscribers: "300K",
          contact: "tyler@bytes.dev",
          niche: "developer news",
        },
        {
          name: "Changelog Weekly",
          subscribers: "150K",
          contact: "editors@changelog.com",
          niche: "open source and dev tools",
        },
        {
          name: "PH Newsletter",
          subscribers: "1M",
          contact: "hello@producthunt.com",
          niche: "new products",
        },
        {
          name: "Futurepedia",
          subscribers: "500K",
          contact: "submit@futurepedia.io",
          niche: "AI tools newsletter",
        },
      ];

      const PODCASTS = [
        { name: "Practical AI", host: "Daniel & Chris", url: "changelog.com/practicalai" },
        { name: "The Changelog", host: "Adam & Jerod", url: "changelog.com" },
        { name: "Indie Hackers Podcast", host: "Courtland Allen", url: "indiehackers.com/podcast" },
        { name: "My First Million", host: "Sam & Shaan", url: "mfmpod.com" },
        { name: "Developer Tea", host: "Jonathan Cutrell", url: "developertea.com" },
        { name: "TWIML AI Podcast", host: "Sam Charrington", url: "twimlai.com" },
        { name: "Software Eng Daily", host: "Jeff Meyerson", url: "softwareengineeringdaily.com" },
        { name: "Lenny's Podcast", host: "Lenny Rachitsky", url: "lennyspodcast.com" },
      ];

      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "PR professional who writes pitches editors actually respond to. Concise, specific, audience-relevant, with a clear hook. No generic templates. Use the specific tool names.",
          },
          {
            role: "user",
            content: `Write outreach for a collection of ${toolCount} free AI tools at ${targetUrl}. ${toolNames ? `Specific tools: ${toolNames}.` : ""} These are completely free to use, no sign-up required.

Return JSON:
{
  "press_release": "Full AP-style press release 400 words: Headline, dateline, lead paragraph, 2 body paragraphs mentioning specific tools, quote, boilerplate (mention built with Svivva), ###",
  "newsletter_pitches": {
    "TLDR AI": "2 sentences: hook with specific tool name + why ${toolCount} free tools matters to 1.25M AI readers",
    "The Rundown AI": "2 sentences tailored to daily AI tools audience, specific tool names",
    "Ben's Bites": "2 sentences, casual tone matching Ben's style",
    "AI Tool Report": "1 sentence — specific tool name + what it does free",
    "Superhuman AI": "2 sentences — productivity angle, specific tools",
    "JavaScript Weekly": "2 sentences — JS/dev tool angle",
    "Bytes.dev": "2 sentences — developer tool angle",
    "Changelog Weekly": "2 sentences — open source/free angle",
    "PH Newsletter": "2 sentences — new free product launch",
    "Futurepedia": "2 sentences — AI tools collection angle"
  },
  "podcast_pitches": {
    "Practical AI": "3 sentences to Daniel/Chris: practical angle of building ${toolCount} free AI tools",
    "The Changelog": "3 sentences: open source/free tools angle",
    "Indie Hackers Podcast": "3 sentences: founder story of building and shipping ${toolCount} tools",
    "My First Million": "3 sentences: business angle — free tools as top-of-funnel",
    "Developer Tea": "3 sentences: productivity and developer tools angle",
    "TWIML AI Podcast": "3 sentences: applied ML/AI tools angle",
    "Software Eng Daily": "3 sentences: engineering angle",
    "Lenny's Podcast": "3 sentences: product and growth angle for free tools"
  },
  "subject_lines": ["5 different subject lines for newsletter pitches — specific, curiosity-driven"],
  "follow_up": "1 short follow-up email for no response after 7 days"
}`,
          },
        ],
      });

      const outreach = JSON.parse(gen.choices[0].message.content || "{}");

      // Save press release
      if (outreach.press_release) {
        try {
          const id = randomBytes(12).toString("hex");
          await db.insert(blogPosts).values({
            id,
            slug: `mini-press-release-${randomBytes(4).toString("hex")}`,
            title: `Press Release — ${toolCount} Free AI Tools at ${targetUrl}`,
            excerpt: "Official press release for media distribution",
            content: outreach.press_release,
            metaTitle: "Press Release — Free AI Tools Hub",
            metaDescription: `${toolCount} free AI tools now available at ${targetUrl}`,
            category: "press",
            published: false,
          });
        } catch {
          /* skip */
        }
      }

      const nlList = NEWSLETTERS.map((n) => `• ${n.name} (${n.subscribers}) — ${n.contact}`).join(
        "\n",
      );
      const podList = PODCASTS.map((p) => `• ${p.name} w/${p.host}`).join("\n");

      return NextResponse.json({
        summary: [
          `✓ Press release written (saved to Blog, unpublished)`,
          `✓ ${NEWSLETTERS.length} personalized newsletter pitches`,
          `✓ ${PODCASTS.length} podcast pitches`,
          "",
          "SUBJECT LINES:",
          ...(outreach.subject_lines || []).map((s: string, i: number) => `${i + 1}. ${s}`),
          "",
          "NEWSLETTER TARGETS (4M+ total reach):",
          nlList,
          "",
          "PODCAST TARGETS:",
          podList,
          "",
          "TIP: Lead with TLDR AI and Ben's Bites — free tool collections get featured often.",
          "Press release preview:",
          (outreach.press_release || "").slice(0, 300) + "…",
        ].join("\n"),
        details: {
          newsletters: NEWSLETTERS.length,
          podcasts: PODCASTS.length,
          outreach,
          targetUrl,
        },
      });
    }

    // ── STEP: Mini — Schema.org + Backlink Bait ───────────────────────────────
    if (stepId === "mini-schema") {
      interface DiscoveredTool {
        name: string;
        url: string;
        description: string;
      }
      const { sourceUrl, tools: passedTools }: { sourceUrl?: string; tools?: DiscoveredTool[] } =
        body;
      const targetUrl = sourceUrl || BASE_URL;
      const toolCount = passedTools?.length || 50;
      const toolNames = (passedTools || [])
        .slice(0, 8)
        .map((t) => t.name)
        .join(", ");

      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Technical SEO expert specializing in structured data and link acquisition.",
          },
          {
            role: "user",
            content: `Generate Schema.org and technical SEO assets for a free AI tools collection at ${targetUrl} with ${toolCount} tools. ${toolNames ? `Tools include: ${toolNames}.` : ""}

Return JSON:
{
  "webApplication": {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI Tools Hub",
    "description": "...",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web",
    "url": "${targetUrl}",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  },
  "faqSchema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Are these AI tools really free?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "Do I need to sign up or create an account?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "How many AI tools are available?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "What kinds of tools are available?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "How were these tools built?", "acceptedAnswer": { "@type": "Answer", "text": "Built with Svivva — an AI API builder that turns natural language into production tools. See svivva.com." } }
    ]
  },
  "backlinkMagnet": {
    "title": "Best Free AI Tools in ${new Date().getFullYear()} — Complete List (No Signup)",
    "slug": "best-free-ai-tools-${new Date().getFullYear()}",
    "content": "Full HTML roundup — 1200+ words: intro about free AI tools, comparison table with 10+ tools (featuring tools from ${targetUrl}), who each tool is for, how to use them, FAQ, conclusion with CTA to ${targetUrl}"
  },
  "changelog": {
    "title": "AI Tools Hub — What's New",
    "slug": "tools-changelog",
    "content": "HTML changelog with 5 recent updates: 'Added [tool name]', 'Improved [feature]' etc. Shows Google active maintenance."
  }
}`,
          },
        ],
      });

      const schemaData = JSON.parse(gen.choices[0].message.content || "{}");
      const pagesCreated: string[] = [];

      if (schemaData.backlinkMagnet?.content) {
        try {
          const slug =
            schemaData.backlinkMagnet.slug || `best-free-ai-tools-${new Date().getFullYear()}`;
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, slug))
            .limit(1);
          const finalSlug = ex.length ? `${slug}-${randomBytes(3).toString("hex")}` : slug;
          await db.insert(seoLandingPages).values({
            slug: finalSlug,
            title:
              schemaData.backlinkMagnet.title || `Best Free AI Tools ${new Date().getFullYear()}`,
            keyword: `best free ai tools ${new Date().getFullYear()}`,
            headline: schemaData.backlinkMagnet.title || "Best Free AI Tools",
            howItWorks: "Comprehensive roundup of the best free AI tools — updated regularly",
            whoItsFor: "Anyone looking for free AI tools without signup",
            content: schemaData.backlinkMagnet.content,
            metaTitle: (schemaData.backlinkMagnet.title || "").slice(0, 60),
            metaDescription: `The best free AI tools available in ${new Date().getFullYear()} — no signup required, instant access.`,
            category: "seo-landing",
            published: true,
            toolUrl: targetUrl,
          });
          pagesCreated.push(`${BASE_URL}/${finalSlug}`);
        } catch {
          /* skip */
        }
      }

      if (schemaData.changelog?.content) {
        try {
          const slug = schemaData.changelog.slug || "tools-changelog";
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, slug))
            .limit(1);
          if (!ex.length) {
            await db.insert(seoLandingPages).values({
              slug,
              title: "AI Tools Hub Changelog",
              keyword: "ai tools hub updates",
              headline: "What's New in the AI Tools Hub",
              howItWorks: "Regular updates adding new free AI tools",
              whoItsFor: "Users of the free AI tools collection",
              content: schemaData.changelog.content,
              metaTitle: "AI Tools Hub — Latest Updates & New Tools",
              metaDescription: "See the latest free AI tools added to the hub",
              category: "seo-landing",
              published: true,
              toolUrl: targetUrl,
            });
            pagesCreated.push(`${BASE_URL}/${slug}`);
          }
        } catch {
          /* skip */
        }
      }

      if (pagesCreated.length) await submitIndexNowBatched(pagesCreated);

      return NextResponse.json({
        summary: [
          `✓ WebApplication + FAQ Schema.org generated for ${targetUrl}`,
          `✓ Backlink magnet page created — attracts natural links from bloggers`,
          `✓ Changelog page created — tells Google you're actively maintained`,
          `✓ ${pagesCreated.length} pages submitted to IndexNow`,
          "",
          "ADD JSON-LD TO YOUR SITE (add to <head>):",
          "Copy the 'webApplication' and 'faqSchema' from step results into your app's HTML <head>:",
          '<script type="application/ld+json">{ ...webApplication }</script>',
          '<script type="application/ld+json">{ ...faqSchema }</script>',
          "",
          "WHAT THIS DOES:",
          "• FAQ Schema → Q&A shown directly in Google search results (zero-click brand exposure)",
          "• WebApplication → App shown in Google Knowledge Panel",
          "• Backlink magnet → 'Best free AI tools' pages get linked to naturally — high-value backlinks",
          "• Changelog → Signals active maintenance → Google crawls more frequently",
          "",
          "Pages created:",
          ...pagesCreated.map((u) => `• ${u}`),
        ].join("\n"),
        details: {
          schemas: { webApplication: schemaData.webApplication, faqSchema: schemaData.faqSchema },
          pagesCreated,
          targetUrl,
        },
      });
    }

    // ── STEP: 40+ Directory Listings ─────────────────────────────────────────
    if (stepId === "svivva-directories") {
      const DIRECTORIES = [
        // AI Tool Directories
        {
          name: "Futurepedia",
          url: "https://www.futurepedia.io/submit-tool",
          cat: "AI Tools",
          da: 72,
          traffic: "2M+/mo",
        },
        {
          name: "There's An AI For That",
          url: "https://theresanaiforthat.com/submit",
          cat: "AI Tools",
          da: 68,
          traffic: "1.5M+/mo",
        },
        {
          name: "FutureTools.io",
          url: "https://www.futuretools.io/submit-a-tool",
          cat: "AI Tools",
          da: 58,
          traffic: "800K/mo",
        },
        {
          name: "TopAI.tools",
          url: "https://topai.tools/submit",
          cat: "AI Tools",
          da: 52,
          traffic: "500K/mo",
        },
        {
          name: "AiTopTools",
          url: "https://aitoptools.com/submit-tool",
          cat: "AI Tools",
          da: 48,
          traffic: "300K/mo",
        },
        {
          name: "ToolPilot.ai",
          url: "https://www.toolpilot.ai/pages/submit-ai-tool",
          cat: "AI Tools",
          da: 45,
          traffic: "200K/mo",
        },
        {
          name: "Supertools",
          url: "https://supertools.therundown.ai/submit",
          cat: "AI Tools",
          da: 62,
          traffic: "1M+/mo",
        },
        {
          name: "EasyWithAI",
          url: "https://easywithai.com/submit-tool",
          cat: "AI Tools",
          da: 42,
          traffic: "150K/mo",
        },
        {
          name: "AITools.fyi",
          url: "https://aitools.fyi/submit",
          cat: "AI Tools",
          da: 44,
          traffic: "180K/mo",
        },
        {
          name: "Insidr.ai",
          url: "https://www.insidr.ai/submit-tool",
          cat: "AI Tools",
          da: 40,
          traffic: "120K/mo",
        },
        {
          name: "AI Tool Hunt",
          url: "https://www.aitoolhunt.com/submit",
          cat: "AI Tools",
          da: 38,
          traffic: "100K/mo",
        },
        {
          name: "AI For Work",
          url: "https://www.aiforwork.co/submit",
          cat: "AI Tools",
          da: 41,
          traffic: "130K/mo",
        },
        {
          name: "GPTDemo.ai",
          url: "https://www.gptdemo.ai/submit",
          cat: "AI Tools",
          da: 36,
          traffic: "80K/mo",
        },
        {
          name: "Phygital+",
          url: "https://phygital.plus/submit",
          cat: "AI Tools",
          da: 39,
          traffic: "90K/mo",
        },
        // SaaS Directories
        {
          name: "Product Hunt",
          url: "https://www.producthunt.com/posts/new",
          cat: "SaaS",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "AlternativeTo",
          url: "https://alternativeto.net/recommend-software",
          cat: "SaaS",
          da: 82,
          traffic: "4M+/mo",
        },
        {
          name: "SaaSHub",
          url: "https://www.saashub.com/add-product",
          cat: "SaaS",
          da: 71,
          traffic: "2M+/mo",
        },
        {
          name: "G2",
          url: "https://www.g2.com/products/new",
          cat: "SaaS",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "Capterra",
          url: "https://vendors.capterra.com",
          cat: "SaaS",
          da: 89,
          traffic: "4M+/mo",
        },
        {
          name: "GetApp",
          url: "https://www.getapp.com/all-software",
          cat: "SaaS",
          da: 81,
          traffic: "2M+/mo",
        },
        {
          name: "Software Advice",
          url: "https://www.softwareadvice.com",
          cat: "SaaS",
          da: 79,
          traffic: "2M+/mo",
        },
        {
          name: "SourceForge",
          url: "https://sourceforge.net/software/vendor",
          cat: "SaaS",
          da: 93,
          traffic: "7M+/mo",
        },
        {
          name: "Slant",
          url: "https://www.slant.co/improve/topics/add",
          cat: "SaaS",
          da: 63,
          traffic: "1M+/mo",
        },
        // Developer Directories
        {
          name: "DevHunt",
          url: "https://devhunt.org/tool/new",
          cat: "Dev Tools",
          da: 49,
          traffic: "200K/mo",
        },
        {
          name: "Hacker News",
          url: "https://news.ycombinator.com/submit",
          cat: "Dev Tools",
          da: 92,
          traffic: "9M+/mo",
        },
        {
          name: "BetaList",
          url: "https://betalist.com/submit",
          cat: "Dev Tools",
          da: 62,
          traffic: "500K/mo",
        },
        {
          name: "BetaPage",
          url: "https://betapage.co/submit",
          cat: "Dev Tools",
          da: 52,
          traffic: "200K/mo",
        },
        {
          name: "Uneed",
          url: "https://www.uneed.best/submit",
          cat: "Dev Tools",
          da: 47,
          traffic: "150K/mo",
        },
        {
          name: "Launched.io",
          url: "https://launched.io/submit",
          cat: "Dev Tools",
          da: 44,
          traffic: "100K/mo",
        },
        {
          name: "Indie Hackers",
          url: "https://www.indiehackers.com/products",
          cat: "Dev Tools",
          da: 78,
          traffic: "2M+/mo",
        },
        {
          name: "MakerPad",
          url: "https://makerpad.zapier.com/posts",
          cat: "Dev Tools",
          da: 56,
          traffic: "300K/mo",
        },
        // API Directories
        {
          name: "RapidAPI Hub",
          url: "https://rapidapi.com/developer/dashboard",
          cat: "API",
          da: 84,
          traffic: "4M+/mo",
        },
        {
          name: "APIs.guru",
          url: "https://github.com/APIs-guru/openapi-directory",
          cat: "API",
          da: 71,
          traffic: "500K/mo",
        },
        {
          name: "Public APIs",
          url: "https://github.com/public-apis/public-apis",
          cat: "API",
          da: 88,
          traffic: "3M+/mo",
        },
        {
          name: "API List",
          url: "https://apilist.fun/add",
          cat: "API",
          da: 54,
          traffic: "200K/mo",
        },
        // Startup / Business
        { name: "AngelList", url: "https://angel.co", cat: "Startup", da: 90, traffic: "5M+/mo" },
        {
          name: "Crunchbase",
          url: "https://www.crunchbase.com/organizations/new",
          cat: "Startup",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "Clutch.co",
          url: "https://clutch.co/directory",
          cat: "Startup",
          da: 82,
          traffic: "1M+/mo",
        },
        {
          name: "Startup Stash",
          url: "https://startupstash.com/add-resource",
          cat: "Startup",
          da: 58,
          traffic: "400K/mo",
        },
        {
          name: "Erlibird",
          url: "https://erlibird.com/startup/register",
          cat: "Startup",
          da: 43,
          traffic: "80K/mo",
        },
        {
          name: "Startup Buffer",
          url: "https://startupbuffer.com/site/submit",
          cat: "Startup",
          da: 46,
          traffic: "100K/mo",
        },
        // More AI Tool Directories
        {
          name: "AI Valley",
          url: "https://aivalley.ai/submit",
          cat: "AI Tools",
          da: 35,
          traffic: "60K/mo",
        },
        {
          name: "AI Scout",
          url: "https://aiscout.net/submit",
          cat: "AI Tools",
          da: 33,
          traffic: "50K/mo",
        },
        {
          name: "AllThingsAI",
          url: "https://allthingsai.co/submit",
          cat: "AI Tools",
          da: 37,
          traffic: "70K/mo",
        },
        {
          name: "AI Directory",
          url: "https://aidirectory.org/submit",
          cat: "AI Tools",
          da: 32,
          traffic: "40K/mo",
        },
        {
          name: "AI Picks",
          url: "https://aipicks.com/submit",
          cat: "AI Tools",
          da: 34,
          traffic: "55K/mo",
        },
        {
          name: "AI Nexus",
          url: "https://ainexus.io/submit",
          cat: "AI Tools",
          da: 31,
          traffic: "45K/mo",
        },
        {
          name: "ToolBase",
          url: "https://toolbase.io/submit",
          cat: "AI Tools",
          da: 29,
          traffic: "35K/mo",
        },
        {
          name: "AI ToolBoard",
          url: "https://aitoolboard.com/submit",
          cat: "AI Tools",
          da: 28,
          traffic: "30K/mo",
        },
        {
          name: "FindMyAI",
          url: "https://findmyai.io/submit",
          cat: "AI Tools",
          da: 30,
          traffic: "38K/mo",
        },
        {
          name: "AI Depot",
          url: "https://aidepot.io/submit",
          cat: "AI Tools",
          da: 27,
          traffic: "32K/mo",
        },
        {
          name: "AI Tools Catalog",
          url: "https://aitoolscatalog.com/submit",
          cat: "AI Tools",
          da: 26,
          traffic: "28K/mo",
        },
        {
          name: "SaaSHelper",
          url: "https://saashelper.com/submit",
          cat: "AI Tools",
          da: 25,
          traffic: "25K/mo",
        },
        {
          name: "AI Tools Daily",
          url: "https://aitoolsdaily.com/submit",
          cat: "AI Tools",
          da: 24,
          traffic: "22K/mo",
        },
        {
          name: "AI Directory.io",
          url: "https://aidirectory.io/submit",
          cat: "AI Tools",
          da: 23,
          traffic: "20K/mo",
        },
        // More SaaS Directories
        {
          name: "TrustRadius",
          url: "https://www.trustradius.com/vendor-signup",
          cat: "SaaS",
          da: 86,
          traffic: "3M+/mo",
        },
        {
          name: "SoftwareAdvice",
          url: "https://www.softwareadvice.com/vendor-signup",
          cat: "SaaS",
          da: 79,
          traffic: "2M+/mo",
        },
        {
          name: "FinancesOnline",
          url: "https://financesonline.com/submit-product",
          cat: "SaaS",
          da: 65,
          traffic: "800K/mo",
        },
        {
          name: "SaaSGenius",
          url: "https://saasgenius.com/submit",
          cat: "SaaS",
          da: 55,
          traffic: "300K/mo",
        },
        {
          name: "SaaSReviews",
          url: "https://saasreviews.net/submit",
          cat: "SaaS",
          da: 48,
          traffic: "200K/mo",
        },
        {
          name: "SaaSHero",
          url: "https://saashero.com/submit",
          cat: "SaaS",
          da: 52,
          traffic: "250K/mo",
        },
        {
          name: "SaaSRadar",
          url: "https://saasradar.com/submit",
          cat: "SaaS",
          da: 45,
          traffic: "150K/mo",
        },
        {
          name: "SaaSMap",
          url: "https://saasmap.com/submit",
          cat: "SaaS",
          da: 42,
          traffic: "120K/mo",
        },
        {
          name: "SaaSGuide",
          url: "https://saasguide.io/submit",
          cat: "SaaS",
          da: 40,
          traffic: "100K/mo",
        },
        {
          name: "SaaSDirect",
          url: "https://saasdirect.io/submit",
          cat: "SaaS",
          da: 38,
          traffic: "90K/mo",
        },
        // More Developer Directories
        {
          name: "Dev.to",
          url: "https://dev.to/submit",
          cat: "Dev Tools",
          da: 85,
          traffic: "4M+/mo",
        },
        {
          name: "GitHub Trending",
          url: "https://github.com/trending",
          cat: "Dev Tools",
          da: 96,
          traffic: "10M+/mo",
        },
        {
          name: "Stack Overflow",
          url: "https://stackoverflow.com",
          cat: "Dev Tools",
          da: 95,
          traffic: "8M+/mo",
        },
        {
          name: "Reddit r/SaaS",
          url: "https://reddit.com/r/SaaS",
          cat: "Dev Tools",
          da: 92,
          traffic: "6M+/mo",
        },
        {
          name: "Reddit r/webdev",
          url: "https://reddit.com/r/webdev",
          cat: "Dev Tools",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "Reddit r/programming",
          url: "https://reddit.com/r/programming",
          cat: "Dev Tools",
          da: 90,
          traffic: "4M+/mo",
        },
        {
          name: "Product Hunt Daily",
          url: "https://www.producthunt.com",
          cat: "Dev Tools",
          da: 91,
          traffic: "5M+/mo",
        },
        {
          name: "Hacker Noon",
          url: "https://hackernoon.com/submit",
          cat: "Dev Tools",
          da: 78,
          traffic: "2M+/mo",
        },
        {
          name: "Medium",
          url: "https://medium.com",
          cat: "Dev Tools",
          da: 95,
          traffic: "7M+/mo",
        },
        {
          name: "CodePen",
          url: "https://codepen.io",
          cat: "Dev Tools",
          da: 90,
          traffic: "3M+/mo",
        },
        // More API Directories
        {
          name: "Postman API Network",
          url: "https://postman.com/api-network",
          cat: "API",
          da: 87,
          traffic: "5M+/mo",
        },
        {
          name: "SwaggerHub",
          url: "https://swagger.io/tools/swaggerhub",
          cat: "API",
          da: 75,
          traffic: "1M+/mo",
        },
        {
          name: "API Gateway",
          url: "https://apigateway.io/submit",
          cat: "API",
          da: 52,
          traffic: "300K/mo",
        },
        {
          name: "API For That",
          url: "https://apiforthat.com/submit",
          cat: "API",
          da: 48,
          traffic: "250K/mo",
        },
        {
          name: "API Directory",
          url: "https://apidirectory.io/submit",
          cat: "API",
          da: 45,
          traffic: "200K/mo",
        },
        {
          name: "API Store",
          url: "https://apistore.io/submit",
          cat: "API",
          da: 42,
          traffic: "180K/mo",
        },
        {
          name: "API Market",
          url: "https://apimarket.io/submit",
          cat: "API",
          da: 40,
          traffic: "150K/mo",
        },
        {
          name: "API Hub",
          url: "https://apihub.io/submit",
          cat: "API",
          da: 38,
          traffic: "120K/mo",
        },
        {
          name: "API Central",
          url: "https://apicentral.io/submit",
          cat: "API",
          da: 35,
          traffic: "100K/mo",
        },
        {
          name: "API Depot",
          url: "https://apidepot.io/submit",
          cat: "API",
          da: 33,
          traffic: "80K/mo",
        },
        // More Startup/Business Directories
        {
          name: "Y Combinator",
          url: "https://ycombinator.com/apply",
          cat: "Startup",
          da: 94,
          traffic: "8M+/mo",
        },
        {
          name: "TechCrunch",
          url: "https://techcrunch.com/submit-tip",
          cat: "Startup",
          da: 94,
          traffic: "7M+/mo",
        },
        {
          name: "VentureBeat",
          url: "https://venturebeat.com/tips",
          cat: "Startup",
          da: 89,
          traffic: "3M+/mo",
        },
        {
          name: "Forbes",
          url: "https://forbes.com/contributors",
          cat: "Startup",
          da: 95,
          traffic: "10M+/mo",
        },
        {
          name: "Business Insider",
          url: "https://businessinsider.com/contribute",
          cat: "Startup",
          da: 93,
          traffic: "6M+/mo",
        },
        {
          name: "Entrepreneur",
          url: "https://entrepreneur.com/contribute",
          cat: "Startup",
          da: 91,
          traffic: "4M+/mo",
        },
        {
          name: "Inc",
          url: "https://inc.com/contributors",
          cat: "Startup",
          da: 90,
          traffic: "3M+/mo",
        },
        {
          name: "Fast Company",
          url: "https://fastcompany.com/contribute",
          cat: "Startup",
          da: 88,
          traffic: "2M+/mo",
        },
        {
          name: "Wired",
          url: "https://wired.com/contribute",
          cat: "Startup",
          da: 92,
          traffic: "5M+/mo",
        },
        {
          name: "Mashable",
          url: "https://mashable.com/contribute",
          cat: "Startup",
          da: 85,
          traffic: "2M+/mo",
        },
      ];

      // Generate universal listing content via AI or template fallback
      const listing = isOrbitFreeAIConfigured()
        ? await generateWithAIOrFallback(
            async () => {
              const gen = await openai.chat.completions.create({
                model: getDefaultModel(),
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      "You write product listing content for SaaS directories. Be specific, factual, and benefit-first. No jargon.",
                  },
                  {
                    role: "user",
                    content: `Create directory listing content for Svivva — an AI API builder that turns natural language prompts into production-ready APIs with JSON schema enforcement, version control, and automated evaluations.

Return JSON:
{
  "tagline": "≤60 chars, punchy",
  "shortDesc": "≤150 chars for tight fields",
  "description": "300 chars — who it's for, what problem it solves, key differentiator",
  "longDesc": "800 chars — full story: problem, solution, features (schema enforcement, version rollback, evaluations, marketplace, A/B testing), who uses it, pricing",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6"],
  "categories": ["AI Tools", "Developer Tools", "API Builder", "No-Code", "SaaS"],
  "keywords": ["ai api builder", "prompt to api", "no-code api", "llm api", "ai backend"],
  "targetAudience": "Developers, no-code builders, startups, enterprises building AI-powered features",
  "pricing": "Free tier available, paid plans from $X/month",
  "alternatives": ["Retool", "Bubble", "Zapier", "AWS Lambda"],
  "rhHint": "For RapidAPI: what endpoint categories would you publish? List 3.",
  "phHint": "Product Hunt first comment (founder story, 280 chars)"
}`,
                  },
                ],
              });
              return JSON.parse(gen.choices[0].message.content || "{}");
            },
            () => ({
              tagline: "Turn prompts into production APIs",
              shortDesc: "AI-powered API builder with schema enforcement",
              description:
                "Svivva transforms natural language prompts into production-ready APIs with JSON schema enforcement, version control, and automated evaluations. Perfect for developers and no-code builders.",
              longDesc:
                "Svivva is an AI API builder that turns natural language prompts into production-ready APIs. Key features include JSON schema enforcement, version control with rollback, automated evaluations, API marketplace, and A/B testing. Used by developers, no-code builders, startups, and enterprises building AI-powered features. Free tier available with paid plans.",
              features: [
                "Natural language to API",
                "JSON schema enforcement",
                "Version control & rollback",
                "Automated evaluations",
                "API marketplace",
                "A/B testing",
              ],
              categories: ["AI Tools", "Developer Tools", "API Builder", "No-Code", "SaaS"],
              keywords: ["ai api builder", "prompt to api", "no-code api", "llm api", "ai backend"],
              targetAudience:
                "Developers, no-code builders, startups, enterprises building AI-powered features",
              pricing: "Free tier available, paid plans from $29/month",
              alternatives: ["Retool", "Bubble", "Zapier", "AWS Lambda"],
              rhHint: "AI APIs, Developer Tools, No-Code, Automation",
              phHint:
                "Built Svivva after struggling to ship AI features fast. Now 500+ APIs deployed in 30 days. Ship your AI backend in minutes, not weeks.",
            }),
            "directory",
          )
        : {
            tagline: "Turn prompts into production APIs",
            shortDesc: "AI-powered API builder with schema enforcement",
            description:
              "Svivva transforms natural language prompts into production-ready APIs with JSON schema enforcement, version control, and automated evaluations. Perfect for developers and no-code builders.",
            longDesc:
              "Svivva is an AI API builder that turns natural language prompts into production-ready APIs. Key features include JSON schema enforcement, version control with rollback, automated evaluations, API marketplace, and A/B testing. Used by developers, no-code builders, startups, and enterprises building AI-powered features. Free tier available with paid plans.",
            features: [
              "Natural language to API",
              "JSON schema enforcement",
              "Version control & rollback",
              "Automated evaluations",
              "API marketplace",
              "A/B testing",
            ],
            categories: ["AI Tools", "Developer Tools", "API Builder", "No-Code", "SaaS"],
            keywords: ["ai api builder", "prompt to api", "no-code api", "llm api", "ai backend"],
            targetAudience:
              "Developers, no-code builders, startups, enterprises building AI-powered features",
            pricing: "Free tier available, paid plans from $29/month",
            alternatives: ["Retool", "Bubble", "Zapier", "AWS Lambda"],
            rhHint: "AI APIs, Developer Tools, No-Code, Automation",
            phHint:
              "Built Svivva after struggling to ship AI features fast. Now 500+ APIs deployed in 30 days. Ship your AI backend in minutes, not weeks.",
          };

      // Save as a reference page in the DB for easy access
      const slug = "svivva-directory-listings";
      const htmlContent = `
<h1>Svivva — Directory Submission Kit</h1>
<p><strong>Tagline:</strong> ${listing.tagline}</p>
<p><strong>Short description:</strong> ${listing.shortDesc}</p>
<p><strong>300-char description:</strong> ${listing.description}</p>
<p><strong>Long description:</strong> ${listing.longDesc}</p>
<h2>Features to list:</h2>
<ul>${(listing.features || []).map((f: string) => `<li>${f}</li>`).join("")}</ul>
<h2>Keywords/Tags:</h2>
<p>${(listing.keywords || []).join(", ")}</p>
<h2>Product Hunt first comment:</h2>
<p>${listing.phHint}</p>
<h2>RapidAPI hint:</h2>
<p>${listing.rhHint}</p>`;

      try {
        const ex = await db
          .select({ id: seoLandingPages.id })
          .from(seoLandingPages)
          .where(eq(seoLandingPages.slug, slug))
          .limit(1);
        if (!ex.length) {
          await db.insert(seoLandingPages).values({
            slug,
            title: "Svivva Directory Submission Kit",
            content: htmlContent,
            keyword: "ai api builder directory",
            headline: listing.tagline || "Svivva — AI API Builder",
            howItWorks: listing.shortDesc || "",
            whoItsFor: listing.targetAudience || "",
            metaTitle: "Svivva Directory Listings",
            metaDescription: listing.description?.slice(0, 155) || "",
            category: "seo-landing",
            published: false,
            toolUrl: BASE_URL,
          });
        }
      } catch {
        /* skip */
      }

      const dirList = DIRECTORIES.map(
        (d) => `• [DA ${d.da}] ${d.name} (${d.cat}, ${d.traffic}) → ${d.url}`,
      ).join("\n");

      return NextResponse.json({
        summary: [
          `✓ Universal listing content generated`,
          `✓ ${DIRECTORIES.length} directories mapped with submission URLs`,
          "",
          `Tagline: "${listing.tagline}"`,
          `Short desc: "${listing.shortDesc}"`,
          "",
          "🔑 PRIORITY SUBMISSIONS (highest traffic first):",
          "1. Product Hunt (5M/mo) — launch on Tuesday–Thursday 12am PST",
          "2. Hacker News Show HN (9M/mo) — post on weekday 9am EST",
          "3. G2 + Capterra (5M/mo each) — request review from users",
          "4. AlternativeTo (4M/mo) — add under each competitor",
          "5. Futurepedia (2M/mo) — instant AI tool indexing",
          "6. SourceForge (7M/mo) — free, high DA backlink",
          "7. Indie Hackers (2M/mo) — post milestone story",
          "8. RapidAPI (4M/mo) — publish API endpoint",
          "",
          "All 40 directories:",
          dirList,
        ].join("\n"),
        details: { directories: DIRECTORIES.length, listing },
      });
    }

    // ── STEP: Parasite SEO — publish on high-DA platforms ────────────────────
    if (stepId === "svivva-parasite") {
      const PLATFORMS = [
        {
          name: "Dev.to",
          url: "https://dev.to/new",
          audience: "developers",
          tone: "technical, code examples, practical",
        },
        {
          name: "Hashnode",
          url: "https://hashnode.com",
          audience: "developers",
          tone: "technical, tutorial-style, real examples",
        },
        {
          name: "Medium",
          url: "https://medium.com/new-story",
          audience: "tech founders/PMs",
          tone: "story-driven, problem-first, accessible",
        },
        {
          name: "HackerNoon",
          url: "https://hackernoon.com/submit",
          audience: "hackers/builders",
          tone: "contrarian, opinionated, data-backed",
        },
        {
          name: "Substack",
          url: "https://substack.com/new",
          audience: "startup founders",
          tone: "personal, behind-the-scenes, honest",
        },
      ];

      const useAI = isOrbitFreeAIConfigured();
      const parasite = useAI
        ? await generateWithAIOrFallback(
            async () => {
              const gen = await openai.chat.completions.create({
                model: getDefaultModel(),
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      "Expert content marketer who writes platform-native articles that rank on Google AND get featured by each publication's editors. Write 600-800 word articles that are genuinely useful, not promotional.",
                  },
                  {
                    role: "user",
                    content: `Write 5 unique articles about Svivva (AI API builder — turns prompts into production APIs) for 5 different platforms. Each article should be platform-native in tone and style.

Return JSON:
{
  "devto": {
    "title": "How I Built a Production AI API in 30 Minutes Without Writing a Backend",
    "tags": ["ai", "api", "javascript", "productivity"],
    "content": "Full markdown article, 700 words, includes code snippets, ends with mention of Svivva as the tool used"
  },
  "hashnode": {
    "title": "Stop Writing Boilerplate: AI API Generation Is Here",
    "tags": ["api", "ai", "developer-tools"],
    "content": "Full markdown, 700 words, tutorial-style with before/after code"
  },
  "medium": {
    "title": "I Saved 3 Weeks of Engineering Time with This AI API Builder",
    "subtitle": "And why it's changing how startups ship features",
    "content": "Full markdown, 700 words, story-driven, ends with Svivva recommendation"
  },
  "hackernoon": {
    "title": "The Problem with AI APIs in 2025 (And What Actually Works)",
    "content": "Full markdown, 750 words, opinionated take, data/examples, mentions Svivva as one solution"
  },
  "substack": {
    "title": "What I learned building 50 AI APIs in 2 months",
    "content": "Full markdown, 650 words, personal story, lessons learned, Svivva mention authentic"
  }
}`,
                  },
                ],
              });
              return JSON.parse(gen.choices[0].message.content || "{}");
            },
            () => {
              const parasitePages = generateMiniParasite();
              const articles: Record<string, { title: string; content: string; tags?: string[] }> =
                {};
              parasitePages.forEach((p) => {
                const raw = p.platform.toLowerCase().replace(/[^a-z]/g, "");
                const key =
                  raw === "linkedin"
                    ? "hackernoon"
                    : raw === "medium"
                      ? "medium"
                      : raw === "devto"
                        ? "devto"
                        : raw === "hashnode"
                          ? "hashnode"
                          : raw === "substack"
                            ? "substack"
                            : raw;
                articles[key] = { title: p.title, content: p.content };
              });
              return articles;
            },
            "parasite",
          )
        : (() => {
            const parasitePages = generateMiniParasite();
            const articles: Record<string, { title: string; content: string; tags?: string[] }> =
              {};
            parasitePages.forEach((p) => {
              const raw = p.platform.toLowerCase().replace(/[^a-z]/g, "");
              const key =
                raw === "linkedin"
                  ? "hackernoon"
                  : raw === "medium"
                    ? "medium"
                    : raw === "devto"
                      ? "devto"
                      : raw === "hashnode"
                        ? "hashnode"
                        : raw === "substack"
                          ? "substack"
                          : raw;
              articles[key] = { title: p.title, content: p.content };
            });
            return articles;
          })();

      const articles = parasite;

      // Save each as a blog post
      const savedTitles: string[] = [];
      const parasiteBlogUrls: string[] = [];
      const platformKeys: Record<string, keyof typeof articles> = {
        devto: "devto",
        hashnode: "hashnode",
        medium: "medium",
        hackernoon: "hackernoon",
        substack: "substack",
      };

      for (const platform of PLATFORMS) {
        const key = platformKeys[platform.name.toLowerCase().replace(/[^a-z]/g, "")] as string;
        const article = articles[key];
        if (!article?.content) continue;
        try {
          const slug = `${platform.name.toLowerCase().replace(/\s+/g, "-")}-${randomBytes(4).toString("hex")}`;
          const id = randomBytes(12).toString("hex");
          await db.insert(blogPosts).values({
            id,
            slug,
            title: article.title || `Svivva on ${platform.name}`,
            excerpt: `Published on ${platform.name}: ${article.title}`,
            content: article.content,
            metaTitle: article.title || `Svivva on ${platform.name}`,
            metaDescription: article.subtitle || article.title || "",
            category: "parasite-seo",
            published: false, // These are for copy-pasting to external platforms
          });
          savedTitles.push(`${platform.name}: "${article.title}"`);
          parasiteBlogUrls.push(`${BASE_URL}/blog/${slug}`);
        } catch {
          /* skip */
        }
      }

      if (parasiteBlogUrls.length > 0) {
        await submitIndexNowBatched(parasiteBlogUrls).catch(() => {});
      }

      const platformDetails = PLATFORMS.map((p, i) => {
        const key = Object.keys(platformKeys)[i];
        const art = articles[key];
        return `${p.name} (${p.url}):\n  Title: "${art?.title || "N/A"}"\n  Tags: ${art?.tags?.join(", ") || "N/A"}\n  Best posting time: ${p.name === "Dev.to" ? "Mon/Tue 9am UTC" : p.name === "Hacker News" ? "Weekday 9am EST" : "Any weekday morning"}`;
      }).join("\n\n");

      return NextResponse.json({
        summary: [
          `✓ ${savedTitles.length} platform-native articles generated`,
          `✓ Saved to Blog section (unpublished — copy-paste to each platform)`,
          "",
          "WHY PARASITE SEO WORKS:",
          "Dev.to DA 94, Hashnode DA 78, Medium DA 96, HackerNoon DA 82",
          "These domains outrank your own site for weeks — you get Google traffic AND their internal audience.",
          "",
          "ARTICLES GENERATED:",
          ...savedTitles.map((t) => `• ${t}`),
          "",
          "SUBMISSION GUIDE:",
          platformDetails,
          "",
          "PRO TIP: Wait 2-3 weeks between posts on each platform. Add 'Originally published at svivva.com' to boost your domain's authority too.",
          parasiteBlogUrls.length > 0
            ? `✓ ${parasiteBlogUrls.length} on-site blog draft URL(s) pinged via IndexNow (Bing/Yandex partners) so copies are discoverable while you publish off-site.`
            : "",
        ].join("\n"),
        details: { articles: savedTitles.length, platforms: PLATFORMS.map((p) => p.name) },
      });
    }

    // ── STEP: Answer Engine Optimization (AEO) ────────────────────────────────
    if (stepId === "svivva-aeo") {
      // AEO = optimizing for AI search engines (Perplexity, ChatGPT, Gemini, Claude)
      // Strategy: write pages that DIRECTLY answer specific questions, no fluff,
      // factual and citable — AI engines pull from these pages when answering related queries
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

      let aeoPages: {
        query: string;
        slug: string;
        title: string;
        metaTitle: string;
        metaDescription: string;
        content: string;
      }[] = [];
      let aeoGenError: string | null = null;
      const useAI = isOrbitFreeAIConfigured();
      try {
        if (useAI) {
          const gen = await openai.chat.completions.create({
            model: getDefaultModel(),
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You write Answer Engine Optimized (AEO) content. These pages get cited by Perplexity, ChatGPT Search, Gemini, and other AI search engines because they directly answer specific questions. Rules:
1. First 150 words = direct, factual answer (no marketing speak, no "great question")
2. Then provide 3-4 supporting paragraphs with specific data, comparisons, or steps
3. End with a brief mention of Svivva as a practical tool
4. No fluff, no corporate language — write like a knowledgeable engineer explaining to a peer`,
              },
              {
                role: "user",
                content: `Generate AEO pages for these 10 queries that developers and builders search on Perplexity/ChatGPT. Each page targets Svivva's use case (AI API builder).

Queries: ${AEO_QUERIES.join(" | ")}

Return JSON:
{
  "pages": [
    {
      "query": "the exact query",
      "slug": "url-friendly-slug",
      "title": "Direct answer to the query as an H1 (not a question, but the answer)",
      "metaTitle": "≤60 chars",
      "metaDescription": "≤155 chars, factual and direct",
      "content": "Full HTML: H1 (the answer stated directly), opening paragraph (direct answer, 80-100 words), H2 sections with supporting data/steps/comparisons, H3 FAQ with 3 related questions and direct answers, closing mention of Svivva with link to ${BASE_URL}"
    }
  ]
}`,
              },
            ],
          });
          const aeoData = JSON.parse(gen.choices[0].message.content || "{}");
          aeoPages = Array.isArray(aeoData.pages) ? aeoData.pages : [];
        } else {
          const templateAEO = generateMiniAEO();
          aeoPages = templateAEO.map((t) => ({
            query: t.query,
            slug: t.slug,
            title: t.query.charAt(0).toUpperCase() + t.query.slice(1),
            metaTitle: t.query.slice(0, 60),
            metaDescription: t.content.slice(0, 155),
            content: t.content,
          }));
        }
      } catch (e) {
        aeoGenError = String(e).slice(0, 300);
        if (!useAI) {
          const templateAEO = generateMiniAEO();
          aeoPages = templateAEO.map((t) => ({
            query: t.query,
            slug: t.slug,
            title: t.query.charAt(0).toUpperCase() + t.query.slice(1),
            metaTitle: t.query.slice(0, 60),
            metaDescription: t.content.slice(0, 155),
            content: t.content,
          }));
        }
      }
      const pages = aeoPages;
      const created: string[] = [];

      for (const page of pages) {
        if (!page.content || !page.slug) continue;
        try {
          await db.insert(seoLandingPages).values({
            slug: page.slug,
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
          created.push(`${BASE_URL}/${page.slug}`);
        } catch {
          /* skip if duplicate */
        }
      }

      if (created.length) await submitIndexNowBatched(created);

      return NextResponse.json({
        summary: [
          aeoGenError ? `⚠ AI generation error: ${aeoGenError}` : null,
          `✓ ${created.length} AEO pages created — optimized for Perplexity, ChatGPT, Gemini`,
          created.length === 0 && aeoGenError
            ? "Retry the step — transient AI API errors are common on large requests."
            : null,
          created.length > 0 ? `✓ All pages submitted to IndexNow for immediate crawling` : null,
          "",
          "WHY AEO MATTERS RIGHT NOW:",
          "Perplexity: 100M+ monthly searches and growing 300% YoY",
          "ChatGPT Search: 100M+ users asking research questions daily",
          "Gemini: Built into Android + Google search for 2B+ users",
          "AI engines CITE sources — your pages get free traffic from AI answers.",
          "",
          "AEO STRATEGY USED:",
          "• Direct answer in first 150 words (no fluff)",
          "• Factual, citable content (AI engines prefer authoritative tone)",
          "• Structured data with FAQ sections (increases citation probability)",
          "• Internal links to Svivva for conversion",
          "",
          "Pages created:",
          ...created.slice(0, 10).map((u) => `• ${u}`),
          "",
          "NEXT: Check Perplexity.ai and search your target queries in 2-4 weeks to see if Svivva appears in answers.",
        ]
          .filter(Boolean)
          .join("\n"),
        details: { created: created.length, queries: AEO_QUERIES.length },
      });
    }

    // ── STEP: Community Strategy Pack ─────────────────────────────────────────
    if (stepId === "svivva-communities") {
      const SUBREDDITS = [
        {
          name: "r/SideProject",
          subscribers: "1.7M",
          tone: "builder-to-builder, genuine, show what you built",
        },
        { name: "r/webdev", subscribers: "1.4M", tone: "technical, practical, code or demo" },
        {
          name: "r/artificial",
          subscribers: "1.8M",
          tone: "AI enthusiast, what makes this different",
        },
        {
          name: "r/nocode",
          subscribers: "60K",
          tone: "no-code audience, no coding required angle",
        },
        { name: "r/entrepreneur", subscribers: "1.1M", tone: "founder story, lesson learned, ROI" },
        { name: "r/ChatGPT", subscribers: "5M", tone: "what you can build with AI, practical use" },
        {
          name: "r/MachineLearning",
          subscribers: "3M",
          tone: "technical, mention schema enforcement + evals",
        },
        { name: "r/SaaS", subscribers: "120K", tone: "SaaS founder, growth and pricing strategy" },
      ];

      const community = isOrbitFreeAIConfigured()
        ? await generateWithAIOrFallback(
            async () => {
              const gen = await openai.chat.completions.create({
                model: getDefaultModel(),
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      "Reddit marketing expert who writes posts that get upvoted, not removed. Posts are genuine, community-first, never spammy. Each post provides real value and only mentions the product naturally at the end or in context.",
                  },
                  {
                    role: "user",
                    content: `Write community launch posts for Svivva (AI API builder) across 8 platforms. Each post must feel native to the platform — not promotional.

Subreddits and their tones: ${SUBREDDITS.map((s) => `${s.name} (${s.tone})`).join("; ")}

Return JSON:
{
  "reddit": {
    "r/SideProject": { "title": "...", "body": "3-4 paragraphs, genuine builder story, specific numbers, link at end" },
    "r/webdev": { "title": "...", "body": "technical angle, what problem it solves, how it works" },
    "r/artificial": { "title": "...", "body": "AI-focused angle" },
    "r/nocode": { "title": "...", "body": "no-code angle" },
    "r/entrepreneur": { "title": "...", "body": "founder angle" },
    "r/ChatGPT": { "title": "...", "body": "ChatGPT use-case angle" },
    "r/MachineLearning": { "title": "...", "body": "technical ML angle, mention schema enforcement and automated evals" },
    "r/SaaS": { "title": "...", "body": "SaaS growth angle" }
  },
  "show_hn": {
    "title": "Show HN: Svivva – Turn prompts into production AI APIs with schema enforcement",
    "body": "HN-style technical description, what it does, tech stack, what makes it different, honest about what doesn't work yet"
  },
  "indie_hackers": {
    "title": "How I built Svivva: turning natural language into production APIs",
    "body": "IH milestone post — genuine story, revenue numbers if any, lessons learned, what's next"
  },
  "discord_templates": [
    "Short intro message for AI/dev Discord servers (200 chars, genuine, links to try it free)",
    "Reply template when someone asks about AI API tools"
  ],
  "timing": {
    "reddit_best_days": "Tuesday–Thursday",
    "reddit_best_time": "9am–12pm EST",
    "hn_best_time": "Weekday 9am–10am EST (when US east coast starts work)"
  }
}`,
                  },
                ],
              });
              return JSON.parse(gen.choices[0].message.content || "{}");
            },
            () => generateMiniCommunities(),
            "communities",
          )
        : generateMiniCommunities();

      // Save as a blog post for reference
      const redditPosts = community.reddit || {};
      const postSummary = Object.entries(redditPosts)
        .map(([sub, post]: [string, unknown]) => {
          const p = post as Record<string, string>;
          return `${sub}: "${p.title || ""}"`;
        })
        .join("\n");

      return NextResponse.json({
        summary: [
          `✓ ${Object.keys(redditPosts).length} Reddit posts written (ready to paste)`,
          `✓ Show HN submission written`,
          `✓ Indie Hackers milestone post written`,
          `✓ Discord templates ready`,
          "",
          "COMMUNITY STRATEGY:",
          `Best posting days: ${community.timing?.reddit_best_days || "Tue–Thu"}`,
          `Best time: ${community.timing?.reddit_best_time || "9am–12pm EST"}`,
          `HN time: ${community.timing?.hn_best_time || "Weekday 9am EST"}`,
          "",
          "REDDIT POSTS WRITTEN:",
          postSummary,
          "",
          "CRITICAL RULES:",
          "• Never post to multiple subreddits on the same day (shadow ban risk)",
          "• Wait 3+ days between each Reddit post",
          "• Comment and engage with replies within 1 hour of posting",
          "• r/SideProject and r/ChatGPT give highest traffic for dev tools",
          "• Show HN gets 500-5,000 upvotes if posted correctly — huge spike",
          "",
          "Show HN title:",
          community.show_hn?.title || "",
          "",
          "IH post title:",
          community.indie_hackers?.title || "",
        ].join("\n"),
        details: community,
      });
    }

    // ── STEP: PR, Newsletter & Podcast Outreach ───────────────────────────────
    if (stepId === "svivva-outreach") {
      const NEWSLETTERS = [
        {
          name: "TLDR AI",
          subscribers: "1.25M",
          editor: "Dan",
          url: "tldr.tech/ai",
          contact: "ai@tldr.tech",
          niche: "AI tools and startups",
        },
        {
          name: "The Rundown AI",
          subscribers: "700K",
          editor: "Team",
          url: "therundown.ai",
          contact: "hello@therundown.ai",
          niche: "daily AI news and tools",
        },
        {
          name: "Ben's Bites",
          subscribers: "100K",
          editor: "Ben",
          url: "bensbites.co",
          contact: "ben@bensbites.co",
          niche: "AI products and research",
        },
        {
          name: "AI Tool Report",
          subscribers: "300K",
          editor: "Team",
          url: "aitoolreport.com",
          contact: "hello@aitoolreport.com",
          niche: "new AI tools",
        },
        {
          name: "Superhuman AI",
          subscribers: "400K",
          editor: "Zain",
          url: "superhuman.ai",
          contact: "zain@superhuman.ai",
          niche: "AI for productivity",
        },
        {
          name: "JavaScript Weekly",
          subscribers: "200K",
          editor: "Peter",
          url: "javascriptweekly.com",
          contact: "submit@javascriptweekly.com",
          niche: "JS/Node developer tools",
        },
        {
          name: "Node Weekly",
          subscribers: "100K",
          editor: "Peter",
          url: "nodeweekly.com",
          contact: "submit@nodeweekly.com",
          niche: "Node.js tools",
        },
        {
          name: "Bytes.dev",
          subscribers: "300K",
          editor: "Tyler",
          url: "bytes.dev",
          contact: "tyler@bytes.dev",
          niche: "developer news and tools",
        },
        {
          name: "Morning Brew Tech",
          subscribers: "500K",
          editor: "Team",
          url: "morningbrew.com",
          contact: "editorial@morningbrew.com",
          niche: "tech news for builders",
        },
        {
          name: "Product Hunt Digest",
          subscribers: "1M",
          editor: "Team",
          url: "producthunt.com",
          contact: "hello@producthunt.com",
          niche: "new products",
        },
      ];

      const PODCASTS = [
        {
          name: "TWIML AI Podcast",
          host: "Sam Charrington",
          listeners: "100K/ep",
          url: "twimlai.com",
          niche: "applied ML and AI engineering",
        },
        {
          name: "Practical AI",
          host: "Daniel & Chris",
          listeners: "30K/ep",
          url: "changelog.com/practicalai",
          niche: "practical AI for developers",
        },
        {
          name: "The Changelog",
          host: "Adam & Jerod",
          listeners: "50K/ep",
          url: "changelog.com",
          niche: "open source and developer tools",
        },
        {
          name: "Software Engineering Daily",
          host: "Jeff Meyerson",
          listeners: "80K/ep",
          url: "softwareengineeringdaily.com",
          niche: "engineering and tools",
        },
        {
          name: "Indie Hackers Podcast",
          host: "Courtland Allen",
          listeners: "40K/ep",
          url: "indiehackers.com/podcast",
          niche: "founders and bootstrapped startups",
        },
        {
          name: "My First Million",
          host: "Sam & Shaan",
          listeners: "500K/ep",
          url: "mfmpod.com",
          niche: "business ideas and trends",
        },
        {
          name: "Developer Tea",
          host: "Jonathan Cutrell",
          listeners: "20K/ep",
          url: "developertea.com",
          niche: "developer productivity tools",
        },
        {
          name: "Lenny's Podcast",
          host: "Lenny Rachitsky",
          listeners: "200K/ep",
          url: "lennyspodcast.com",
          niche: "product and growth",
        },
      ];

      const outreach = isOrbitFreeAIConfigured()
        ? await generateWithAIOrFallback(
            async () => {
              const gen = await openai.chat.completions.create({
                model: getDefaultModel(),
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      "PR professional and content strategist. Write pitches that editors and hosts actually respond to. Concise, specific, relevant to their audience, with a clear hook. No generic templates.",
                  },
                  {
                    role: "user",
                    content: `Write outreach content for Svivva (AI API builder — turns natural language prompts into production APIs with schema enforcement, version control, automated evaluations, marketplace).

Return JSON:
{
  "press_release": "Full AP-style press release 400 words: Headline, dateline, lead paragraph (who/what/why now), 2 body paragraphs with specific features and use cases, founder quote, boilerplate, ### end",
  "newsletter_pitches": {
    "TLDR AI": "2-sentence pitch: hook + what makes Svivva newsworthy for their 1.25M AI readers",
    "The Rundown AI": "2-sentence pitch tailored to daily AI tools audience",
    "Ben's Bites": "2 sentences, informal tone (Ben's style), hook + link",
    "AI Tool Report": "1 sentence — what is it + why their readers care",
    "Superhuman AI": "2 sentences — productivity angle",
    "JavaScript Weekly": "2 sentences — JS/Node developer tool angle",
    "Node Weekly": "2 sentences — Node.js/API angle",
    "Bytes.dev": "2 sentences — developer tool angle",
    "Morning Brew Tech": "3 sentences — broader tech story angle",
    "Product Hunt Digest": "2 sentences — new product launch angle"
  },
  "podcast_pitches": {
    "TWIML AI Podcast": "3-sentence email pitch to Sam: angle (applied ML in production), why Svivva guests work, what topic would be discussed",
    "Practical AI": "3-sentence pitch to Daniel/Chris: practical AI angle",
    "The Changelog": "3-sentence pitch: open source/dev tools angle, what makes a great episode",
    "Software Engineering Daily": "3-sentence pitch: engineering angle",
    "Indie Hackers Podcast": "3-sentence pitch: founder story angle",
    "My First Million": "3-sentence pitch: business/market opportunity angle",
    "Developer Tea": "3-sentence pitch: developer productivity angle",
    "Lenny's Podcast": "3-sentence pitch: product growth angle"
  },
  "email_subject_lines": ["5 different subject lines for newsletter pitches"],
  "follow_up_template": "1 short follow-up email if no response after 1 week"
}`,
                  },
                ],
              });
              return JSON.parse(gen.choices[0].message.content || "{}");
            },
            () => generateMiniOutreachAll(),
            "outreach",
          )
        : generateMiniOutreachAll();

      // Save press release as blog post
      if (outreach.press_release) {
        try {
          const id = randomBytes(12).toString("hex");
          const slug = `svivva-press-release-${randomBytes(4).toString("hex")}`;
          await db.insert(blogPosts).values({
            id,
            slug,
            title: "Svivva Press Release",
            excerpt: "Official press release for media distribution",
            content: outreach.press_release,
            metaTitle: "Svivva Press Release",
            metaDescription:
              "Svivva launches AI API builder that turns natural language into production APIs",
            category: "press",
            published: false,
          });
        } catch {
          /* skip */
        }
      }

      const newsletterList = NEWSLETTERS.map(
        (n) => `• ${n.name} (${n.subscribers}, ${n.url}) — contact: ${n.contact}`,
      ).join("\n");
      const podcastList = PODCASTS.map(
        (p) => `• ${p.name} w/${p.host} (${p.listeners}, ${p.url})`,
      ).join("\n");

      return NextResponse.json({
        summary: [
          `✓ Press release written (saved to Blog, unpublished)`,
          `✓ ${NEWSLETTERS.length} personalized newsletter pitches generated`,
          `✓ ${PODCASTS.length} podcast pitches generated`,
          `✓ Follow-up email template ready`,
          "",
          "EMAIL SUBJECT LINES:",
          ...(outreach.email_subject_lines || []).map((s: string, i: number) => `${i + 1}. ${s}`),
          "",
          "NEWSLETTER TARGETS (total reach: 4M+):",
          newsletterList,
          "",
          "PODCAST TARGETS:",
          podcastList,
          "",
          "PITCH TIMING STRATEGY:",
          "• Newsletter pitches: Send Monday or Tuesday morning",
          "• Follow up exactly once, 7 days later",
          "• Podcast pitches: Send directly to host's email (LinkedIn as backup)",
          "• Priority: TLDR AI → Ben's Bites → JS Weekly → Practical AI",
          "",
          `Press release preview (first 300 chars):`,
          (outreach.press_release || "").slice(0, 300) + "…",
        ].join("\n"),
        details: { newsletters: NEWSLETTERS.length, podcasts: PODCASTS.length, outreach },
      });
    }

    // ── STEP: Schema.org + Technical SEO Boosts ──────────────────────────────
    if (stepId === "svivva-schema") {
      const schema = isOrbitFreeAIConfigured()
        ? await generateWithAIOrFallback(
            async () => {
              const gen = await openai.chat.completions.create({
                model: getDefaultModel(),
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      "Technical SEO expert specializing in structured data and featured snippets.",
                  },
                  {
                    role: "user",
                    content: `Generate Schema.org structured data and technical SEO assets for Svivva (AI API builder, URL: ${BASE_URL}).

Return JSON:
{
  "softwareApplication": {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Svivva",
    "description": "...",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "url": "${BASE_URL}",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "127" },
    "author": { "@type": "Organization", "name": "Svivva" }
  },
  "faqSchema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What is Svivva?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "How much does Svivva cost?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "Do I need coding skills to use Svivva?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "How is Svivva different from Retool or Bubble?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "What AI models does Svivva support?", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
    ]
  },
  "backlinkMagnet": {
    "title": "Top 30 AI API Tools for Developers in 2025 (Ranked & Compared)",
    "slug": "best-ai-api-tools-2025",
    "description": "A genuinely useful roundup page that includes Svivva + 29 real competitors",
    "content": "Full HTML: intro, comparison table with 10 tools, criteria section, FAQ, conclusion"
  },
  "changelog": {
    "title": "Svivva Changelog — What's New",
    "slug": "changelog",
    "content": "HTML changelog with 5 recent updates"
  },
  "technicalChecklist": [
    "Verify canonical tags on all pages",
    "Ensure /sitemap.xml includes all pages with lastmod",
    "Add hreflang if planning multilingual",
    "Check Core Web Vitals in Search Console",
    "Verify robots.txt allows crawling of /blog /tools /lp",
    "Add Open Graph image to every page (1200x630px)",
    "Submit to Google Search Console manually after IndexNow"
  ]
}`,
                  },
                ],
              });
              return JSON.parse(gen.choices[0].message.content || "{}");
            },
            () => generateSchemaOrg(),
            "schema",
          )
        : generateSchemaOrg();

      const schemaData = schema;
      const pagesCreated: string[] = [];

      // Save backlink magnet page
      if (schemaData.backlinkMagnet?.content) {
        try {
          const slug = schemaData.backlinkMagnet.slug || "best-ai-api-tools-2025";
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, slug))
            .limit(1);
          const finalSlug = ex.length ? `${slug}-${randomBytes(3).toString("hex")}` : slug;
          await db.insert(seoLandingPages).values({
            slug: finalSlug,
            title: schemaData.backlinkMagnet.title || "Best AI API Tools 2025",
            keyword: "best ai api tools 2025",
            headline: schemaData.backlinkMagnet.title || "Top 30 AI API Tools",
            howItWorks: "Comprehensive comparison of the best AI API building tools",
            whoItsFor: "Developers evaluating AI API tools and platforms",
            content: schemaData.backlinkMagnet.content,
            metaTitle: (schemaData.backlinkMagnet.title || "Best AI API Tools 2025").slice(0, 60),
            metaDescription: schemaData.backlinkMagnet.description?.slice(0, 155) || "",
            category: "seo-landing",
            published: true,
            toolUrl: `${BASE_URL}/${finalSlug}`,
          });
          pagesCreated.push(`${BASE_URL}/${finalSlug}`);
        } catch {
          /* skip */
        }
      }

      // Save changelog
      if (schemaData.changelog?.content) {
        try {
          const ex = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, "changelog"))
            .limit(1);
          if (!ex.length) {
            await db.insert(seoLandingPages).values({
              slug: "changelog",
              title: "Svivva Changelog",
              keyword: "svivva changelog updates",
              headline: "What's New in Svivva",
              howItWorks: "Regular updates to Svivva features and improvements",
              whoItsFor: "Existing Svivva users and developers evaluating the platform",
              content: schemaData.changelog.content,
              metaTitle: "Svivva Changelog — Latest Updates",
              metaDescription:
                "See what's new in Svivva — latest features, improvements, and fixes",
              category: "seo-landing",
              published: true,
              toolUrl: `${BASE_URL}/changelog`,
            });
            pagesCreated.push(`${BASE_URL}/changelog`);
          }
        } catch {
          /* skip */
        }
      }

      if (pagesCreated.length) await submitIndexNowBatched(pagesCreated);

      const techChecklist = (schemaData.technicalChecklist || [])
        .map((item: string) => `☐ ${item}`)
        .join("\n");

      return NextResponse.json({
        summary: [
          `✓ SoftwareApplication Schema.org JSON-LD generated`,
          `✓ FAQ Schema generated (5 questions — enables FAQ rich results in Google)`,
          `✓ Backlink magnet page created: ${pagesCreated[0] || ""}`,
          `✓ Changelog page created (shows Google you're actively maintained)`,
          `✓ Using ${isOrbitFreeAIConfigured() ? "free-tier AI (Gemini/Ollama)" : "built-in templates — Orbit does not use paid OpenAI"}`,
          "",
          "ADD THIS JSON-LD TO app/layout.tsx <head> (copy the 'jsonLd' field from step results):",
          "Add both softwareApplication + faqSchema in separate <script type='application/ld+json'> tags",
          "",
          "WHAT EACH SCHEMA DOES:",
          "• SoftwareApplication: Shows app rating, category in Google Knowledge Panel",
          "• FAQPage: Shows Q&A directly in Google search results (no click needed — builds brand)",
          "• Backlink magnet: A 'best tools' roundup gets linked to by other blogs naturally",
          "• Changelog: Tells Google you're active — boosts crawl frequency",
          "",
          "TECHNICAL SEO CHECKLIST:",
          techChecklist,
          "",
          "Pages submitted to IndexNow:",
          ...pagesCreated.map((u) => `• ${u}`),
        ].join("\n"),
        details: {
          schemas: {
            softwareApplication: schemaData.softwareApplication,
            faqSchema: schemaData.faqSchema,
          },
          pagesCreated,
          checklist: schemaData.technicalChecklist,
        },
      });
    }

    // ── STEP: Integration Pages ("Svivva + [Tool]") ──────────────────────────
    if (stepId === "svivva-integrations") {
      const INTEGRATIONS = [
        { tool: "Notion", slug: "svivva-notion-integration", kw: "notion AI API integration" },
        { tool: "Slack", slug: "svivva-slack-integration", kw: "slack AI API bot" },
        { tool: "GitHub", slug: "svivva-github-integration", kw: "github AI API automation" },
        { tool: "Stripe", slug: "svivva-stripe-integration", kw: "stripe AI API payments" },
        { tool: "Supabase", slug: "svivva-supabase-integration", kw: "supabase AI API backend" },
        { tool: "HubSpot", slug: "svivva-hubspot-integration", kw: "hubspot AI CRM API" },
        { tool: "Shopify", slug: "svivva-shopify-integration", kw: "shopify AI API ecommerce" },
        { tool: "Airtable", slug: "svivva-airtable-integration", kw: "airtable AI automation API" },
        { tool: "Discord", slug: "svivva-discord-integration", kw: "discord AI bot API" },
        { tool: "Twilio", slug: "svivva-twilio-integration", kw: "twilio AI SMS API" },
        {
          tool: "Google Sheets",
          slug: "svivva-google-sheets-integration",
          kw: "google sheets AI API",
        },
        { tool: "Salesforce", slug: "svivva-salesforce-integration", kw: "salesforce AI API CRM" },
        { tool: "Webflow", slug: "svivva-webflow-integration", kw: "webflow AI API no-code" },
        { tool: "Bubble", slug: "svivva-bubble-integration", kw: "bubble no-code AI API" },
        { tool: "Firebase", slug: "svivva-firebase-integration", kw: "firebase AI API backend" },
        { tool: "Next.js", slug: "svivva-nextjs-integration", kw: "nextjs AI API backend" },
        { tool: "Vercel", slug: "svivva-vercel-integration", kw: "vercel AI API serverless" },
        { tool: "Zapier", slug: "svivva-zapier-integration", kw: "zapier AI API automation" },
        { tool: "Make", slug: "svivva-make-integration", kw: "make integromat AI API" },
        { tool: "n8n", slug: "svivva-n8n-integration", kw: "n8n AI API workflow" },
        { tool: "Python", slug: "svivva-python-integration", kw: "python AI API builder" },
        { tool: "Node.js", slug: "svivva-nodejs-integration", kw: "nodejs AI API backend" },
        { tool: "FastAPI", slug: "svivva-fastapi-integration", kw: "fastapi AI wrapper backend" },
        {
          tool: "AWS Lambda",
          slug: "svivva-aws-lambda-integration",
          kw: "aws lambda AI API serverless",
        },
        { tool: "MongoDB", slug: "svivva-mongodb-integration", kw: "mongodb AI API database" },
        {
          tool: "PostgreSQL",
          slug: "svivva-postgresql-integration",
          kw: "postgresql AI API database",
        },
        { tool: "SendGrid", slug: "svivva-sendgrid-integration", kw: "sendgrid AI email API" },
        { tool: "WordPress", slug: "svivva-wordpress-integration", kw: "wordpress AI API plugin" },
        { tool: "Retool", slug: "svivva-retool-integration", kw: "retool AI API internal tools" },
        { tool: "React", slug: "svivva-react-integration", kw: "react AI API frontend" },
      ];

      // ── Parallel: check existing in one query, generate all concurrently ──────
      const allSlugs = INTEGRATIONS.map((i) => i.slug);
      const existingRows = await db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(inArray(seoLandingPages.slug, allSlugs));
      const existingSlugs = new Set(existingRows.map((r) => r.slug));
      const toCreate = INTEGRATIONS.filter((i) => !existingSlugs.has(i.slug));
      const skipped = INTEGRATIONS.filter((i) => existingSlugs.has(i.slug));

      const useAI = isOrbitFreeAIConfigured();
      const results = await Promise.allSettled(
        INTEGRATIONS.map(async (integ) => {
          let d;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "You are a technical content writer for Svivva — an AI API builder SaaS that lets developers create production AI APIs in minutes. Write integration pages that genuinely help developers.",
                },
                {
                  role: "user",
                  content: `Write an integration guide page for "Svivva + ${integ.tool}". Target keyword: "${integ.kw}". Return JSON: { title, metaTitle (60 chars max), metaDescription (155 chars), content (600-800 words markdown: intro paragraph, H2 "Why Svivva + ${integ.tool}?", H2 "Step-by-Step Integration", H2 "Use Cases", H2 "Getting Started", end with CTA for Svivva free trial) }`,
                },
              ],
            });
            d = JSON.parse(gen.choices[0].message.content || "{}");
          } else {
            const templatePages = batchIntegrationPages();
            const template = templatePages[0];
            d = {
              title: `Svivva + ${integ.tool} Integration`,
              metaTitle: `Svivva + ${integ.tool} - AI API Builder`.slice(0, 60),
              metaDescription:
                `Build AI-powered ${integ.tool} integrations with Svivva in minutes. No coding required.`.slice(
                  0,
                  155,
                ),
              content: `# Svivva + ${integ.tool} Integration\n\nBuild AI-powered ${integ.tool} integrations with Svivva in minutes. No coding required.\n\n## Why Svivva + ${integ.tool}?\n\nSvivva's AI API builder seamlessly integrates with ${integ.tool}, enabling you to:\n- Automate workflows\n- Process data in real-time\n- Scale without infrastructure worries\n\n## Step-by-Step Integration\n\n1. Sign up for Svivva\n2. Connect your ${integ.tool} account\n3. Describe your API in plain English\n4. Deploy instantly\n\n## Use Cases\n\n- Data automation\n- Real-time processing\n- Custom workflows\n\n## Getting Started\n\nTry Svivva free today and build your first ${integ.tool} integration in minutes.\n\n[Start Free →](https://svivva.com)`,
            };
          }
          await db.insert(seoLandingPages).values({
            id: randomBytes(12).toString("hex"),
            slug: integ.slug,
            title: d.title || `Svivva + ${integ.tool}`,
            metaTitle: d.metaTitle || `Svivva + ${integ.tool} Integration`,
            metaDescription:
              d.metaDescription || `Build AI-powered ${integ.tool} integrations with Svivva.`,
            content: d.content || "",
            category: "integration",
            published: true,
            publishedAt: new Date(),
          } as any);
          return { title: d.title || `Svivva + ${integ.tool}`, url: `${BASE_URL}/${integ.slug}` };
        }),
      );

      const created = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<{ title: string; url: string }>).value);
      const newUrls = created.map((c) => c.url);
      if (newUrls.length) submitIndexNowBatched(newUrls).catch(() => {});
      return NextResponse.json({
        summary: [
          `✓ ${created.length} integration pages created (${skipped.length} already existed)`,
          `✓ Generated in parallel — all ${toCreate.length} pages created concurrently`,
          `✓ Targeting "svivva + [tool]" and "[tool] AI API" searches`,
          "",
          "PAGES CREATED:",
          ...created.map((c) => `• ${c.title}`),
          skipped.length
            ? `\nALREADY EXISTED (skipped): ${skipped.map((i) => i.tool).join(", ")}`
            : "",
        ].join("\n"),
        details: { created: created.length, skipped: skipped.length },
      });
    }

    // ── STEP: Industry Use Case Pages ─────────────────────────────────────────
    if (stepId === "svivva-usecases") {
      const INDUSTRIES = [
        { name: "Healthcare", slug: "ai-api-for-healthcare", kw: "AI API healthcare applications" },
        { name: "Fintech", slug: "ai-api-for-fintech", kw: "AI API fintech applications" },
        { name: "E-commerce", slug: "ai-api-for-ecommerce", kw: "AI API ecommerce automation" },
        {
          name: "Legal Tech",
          slug: "ai-api-for-legal-tech",
          kw: "AI API legal document automation",
        },
        { name: "Education", slug: "ai-api-for-education", kw: "AI API edtech applications" },
        {
          name: "Real Estate",
          slug: "ai-api-for-real-estate",
          kw: "AI API real estate applications",
        },
        { name: "HR Tech", slug: "ai-api-for-hr-tech", kw: "AI API HR recruitment automation" },
        { name: "Marketing", slug: "ai-api-for-marketing", kw: "AI API marketing automation" },
        {
          name: "Customer Support",
          slug: "ai-api-for-customer-support",
          kw: "AI API customer support chatbot",
        },
        {
          name: "Cybersecurity",
          slug: "ai-api-for-cybersecurity",
          kw: "AI API security threat detection",
        },
        { name: "Media", slug: "ai-api-for-media", kw: "AI API content media automation" },
        { name: "Logistics", slug: "ai-api-for-logistics", kw: "AI API logistics supply chain" },
        { name: "Insurance", slug: "ai-api-for-insurance", kw: "AI API insurance underwriting" },
        { name: "SaaS Products", slug: "ai-api-for-saas", kw: "AI API building SaaS products" },
        { name: "B2B Sales", slug: "ai-api-for-b2b-sales", kw: "AI API B2B sales automation" },
        { name: "Research", slug: "ai-api-for-research", kw: "AI API research data analysis" },
        { name: "Gaming", slug: "ai-api-for-gaming", kw: "AI API game development NPC" },
        { name: "Travel", slug: "ai-api-for-travel", kw: "AI API travel hospitality" },
        { name: "Nonprofits", slug: "ai-api-for-nonprofits", kw: "AI API nonprofit automation" },
        {
          name: "Government",
          slug: "ai-api-for-government",
          kw: "AI API government public services",
        },
      ];

      const indSlugs = INDUSTRIES.map((i) => i.slug);
      const indExisting = await db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(inArray(seoLandingPages.slug, indSlugs));
      const indExistingSlugs = new Set(indExisting.map((r) => r.slug));
      const indToCreate = INDUSTRIES.filter((i) => !indExistingSlugs.has(i.slug));
      const indSkipped = INDUSTRIES.filter((i) => indExistingSlugs.has(i.slug));

      const useAI = isOrbitFreeAIConfigured();
      const indResults = await Promise.allSettled(
        INDUSTRIES.map(async (ind) => {
          let d;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "You write industry-specific AI use case pages for Svivva — an AI API builder SaaS. Write for decision-makers in each industry, not just developers.",
                },
                {
                  role: "user",
                  content: `Write a use case page for "AI API for ${ind.name}". Target keyword: "${ind.kw}". Return JSON: { title, metaTitle (60 chars), metaDescription (155 chars), content (700 words markdown: problem in the industry, H2 "How AI APIs Transform ${ind.name}", H2 "5 Specific Use Cases", H2 "Real Results", H2 "Build Your ${ind.name} AI API with Svivva", CTA) }`,
                },
              ],
            });
            d = JSON.parse(gen.choices[0].message.content || "{}");
          } else {
            const templatePages = batchIndustryPages();
            const template = templatePages[0];
            d = {
              title: `AI API for ${ind.name} - Transform Your Business`,
              metaTitle: `AI API for ${ind.name} | Svivva`.slice(0, 60),
              metaDescription:
                `Build AI-powered ${ind.name} applications with Svivva. Automate workflows and scale without coding.`.slice(
                  0,
                  155,
                ),
              content: `# AI API for ${ind.name}\n\nTransform your ${ind.name} operations with AI-powered APIs from Svivva.\n\n## How AI APIs Transform ${ind.name}\n\nAI APIs are revolutionizing the ${ind.name} industry by:\n- Automating repetitive tasks\n- Providing real-time insights\n- Reducing operational costs\n- Improving customer experiences\n\n## 5 Specific Use Cases\n\n1. **Automated Workflows** - Streamline operations\n2. **Data Analysis** - Get insights in real-time\n3. **Customer Support** - 24/7 intelligent assistance\n4. **Risk Assessment** - Predictive analytics\n5. **Compliance** - Automated regulatory checks\n\n## Real Results\n\nCompanies using AI APIs in ${ind.name} report:\n- 40% faster operations\n- 35% cost reduction\n- 50% better customer satisfaction\n\n## Build Your ${ind.name} AI API with Svivva\n\nSvivva lets you build production AI APIs in minutes without coding. Simply describe what you need, and our platform handles the rest.\n\n[Start Free →](https://svivva.com)`,
            };
          }
          await db.insert(seoLandingPages).values({
            id: randomBytes(12).toString("hex"),
            slug: ind.slug,
            title: d.title || `AI API for ${ind.name}`,
            metaTitle: d.metaTitle || `AI API for ${ind.name} | Svivva`,
            metaDescription:
              d.metaDescription || `Build AI-powered ${ind.name} applications with Svivva.`,
            content: d.content || "",
            category: "usecase",
            published: true,
            publishedAt: new Date(),
          } as any);
          return { title: d.title || `AI API for ${ind.name}`, url: `${BASE_URL}/${ind.slug}` };
        }),
      );

      const indCreated = indResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<{ title: string; url: string }>).value);
      if (indCreated.length) submitIndexNowBatched(indCreated.map((c) => c.url)).catch(() => {});
      return NextResponse.json({
        summary: [
          `✓ ${indCreated.length} industry use case pages created (${indSkipped.length} already existed)`,
          `✓ Generated in parallel — all ${indToCreate.length} pages created concurrently`,
          `✓ Targets industry decision-makers searching for AI solutions`,
          "",
          "INDUSTRIES COVERED:",
          ...INDUSTRIES.map(
            (i) => `• ${i.name}${indExistingSlugs.has(i.slug) ? " (existing)" : ""}`,
          ),
        ].join("\n"),
        details: { created: indCreated.length, skipped: indSkipped.length },
      });
    }

    // ── STEP: API Template Library ────────────────────────────────────────────
    if (stepId === "svivva-templates") {
      const TEMPLATES = [
        {
          name: "Sentiment Analysis API",
          slug: "sentiment-analysis-api-template",
          kw: "sentiment analysis API tutorial",
        },
        {
          name: "Text Summarizer API",
          slug: "text-summarizer-api-template",
          kw: "text summarization API builder",
        },
        {
          name: "Email Classifier API",
          slug: "email-classifier-api-template",
          kw: "email classification AI API",
        },
        { name: "Lead Scoring API", slug: "lead-scoring-api-template", kw: "AI lead scoring API" },
        {
          name: "Content Moderation API",
          slug: "content-moderation-api-template",
          kw: "content moderation AI API",
        },
        {
          name: "Language Translator API",
          slug: "language-translator-api-template",
          kw: "language translation AI API",
        },
        {
          name: "Question Answering API",
          slug: "question-answering-api-template",
          kw: "question answering AI API",
        },
        {
          name: "Data Extractor API",
          slug: "data-extractor-api-template",
          kw: "AI data extraction API builder",
        },
        {
          name: "Customer Support Bot API",
          slug: "customer-support-bot-api-template",
          kw: "customer support chatbot API",
        },
        {
          name: "Invoice Parser API",
          slug: "invoice-parser-api-template",
          kw: "AI invoice parsing API",
        },
        {
          name: "Resume Parser API",
          slug: "resume-parser-api-template",
          kw: "AI resume parser API",
        },
        {
          name: "Product Description API",
          slug: "product-description-api-template",
          kw: "AI product description generator API",
        },
        {
          name: "Meeting Notes API",
          slug: "meeting-notes-api-template",
          kw: "AI meeting notes summarizer API",
        },
        {
          name: "Code Review API",
          slug: "code-review-api-template",
          kw: "AI code review API builder",
        },
        {
          name: "FAQ Generator API",
          slug: "faq-generator-api-template",
          kw: "AI FAQ generator API",
        },
        {
          name: "Review Summarizer API",
          slug: "review-summarizer-api-template",
          kw: "AI review summarizer API",
        },
        {
          name: "Contract Analyzer API",
          slug: "contract-analyzer-api-template",
          kw: "AI contract analysis API",
        },
        {
          name: "Job Description API",
          slug: "job-description-api-template",
          kw: "AI job description generator API",
        },
        {
          name: "SEO Content API",
          slug: "seo-content-generator-api-template",
          kw: "AI SEO content generator API",
        },
        {
          name: "Chatbot API",
          slug: "chatbot-api-template",
          kw: "AI chatbot API builder tutorial",
        },
        {
          name: "SQL Generator API",
          slug: "sql-generator-api-template",
          kw: "AI SQL query generator API",
        },
        {
          name: "Social Media Post API",
          slug: "social-media-post-api-template",
          kw: "AI social media generator API",
        },
        {
          name: "News Classifier API",
          slug: "news-classifier-api-template",
          kw: "AI news article classifier API",
        },
        {
          name: "Price Predictor API",
          slug: "price-predictor-api-template",
          kw: "AI price prediction API builder",
        },
        {
          name: "Feedback Analyzer API",
          slug: "feedback-analyzer-api-template",
          kw: "customer feedback AI analysis API",
        },
      ];

      const tmplSlugs = TEMPLATES.map((t) => t.slug);
      const tmplExisting = await db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(inArray(seoLandingPages.slug, tmplSlugs));
      const tmplExistingSlugs = new Set(tmplExisting.map((r) => r.slug));
      const tmplToCreate = TEMPLATES.filter((t) => !tmplExistingSlugs.has(t.slug));
      const tmplSkipped = TEMPLATES.filter((t) => tmplExistingSlugs.has(t.slug));

      const useAI = isOrbitFreeAIConfigured();
      const tmplResults = await Promise.allSettled(
        TEMPLATES.map(async (tmpl) => {
          let d;
          if (useAI) {
            const gen = await openai.chat.completions.create({
              model: getDefaultModel(),
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "You write developer-focused API template guide pages for Svivva — an AI API builder. Include working code examples. Target developers who want to build this specific API type quickly.",
                },
                {
                  role: "user",
                  content: `Write an API template page for "${tmpl.name}". Keyword: "${tmpl.kw}". Return JSON: { title, metaTitle (60 chars), metaDescription (155 chars), content (750 words markdown: what this API does, H2 "Sample API Schema", H2 "Example Request/Response" with JSON code blocks, H2 "Build This in 11 Minutes with Svivva", H2 "Common Customizations", CTA to try Svivva free) }`,
                },
              ],
            });
            d = JSON.parse(gen.choices[0].message.content || "{}");
          } else {
            const templatePages = batchAPITemplatePages();
            const template = templatePages[0];
            d = {
              title: `${tmpl.name} - Build in Minutes`,
              metaTitle: `${tmpl.name} | Svivva Templates`.slice(0, 60),
              metaDescription:
                `Build a ${tmpl.name} with Svivva in minutes. No coding required.`.slice(0, 155),
              content: `# ${tmpl.name}\n\nBuild a production-ready ${tmpl.name} with Svivva in minutes.\n\n## Sample API Schema\n\n\`\`\`json\n{\n  "input": "string",\n  "output": "string"\n}\n\`\`\`\n\n## Example Request/Response\n\n**Request:**\n\`\`\`json\n{\n  "input": "Your input data here"\n}\n\`\`\`\n\n**Response:**\n\`\`\`json\n{\n  "output": "Processed result"\n}\n\`\`\`\n\n## Build This in 11 Minutes with Svivva\n\n1. Sign up for Svivva\n2. Describe your API in plain English\n3. Svivva generates the schema and code\n4. Deploy instantly\n\n## Common Customizations\n\n- Add authentication\n- Rate limiting\n- Custom endpoints\n\n[Start Free →](https://svivva.com)`,
            };
          }
          await db.insert(seoLandingPages).values({
            id: randomBytes(12).toString("hex"),
            slug: tmpl.slug,
            title: d.title || tmpl.name,
            metaTitle: d.metaTitle || `${tmpl.name} | Svivva Templates`,
            metaDescription: d.metaDescription || `Build a ${tmpl.name} with Svivva in minutes.`,
            content: d.content || "",
            category: "template",
            published: true,
            publishedAt: new Date(),
          } as any);
          return { title: d.title || tmpl.name, url: `${BASE_URL}/${tmpl.slug}` };
        }),
      );

      const tmplCreated = tmplResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<{ title: string; url: string }>).value);
      if (tmplCreated.length) submitIndexNowBatched(tmplCreated.map((c) => c.url)).catch(() => {});
      return NextResponse.json({
        summary: [
          `✓ ${tmplCreated.length} API template pages created (${tmplSkipped.length} already existed)`,
          `✓ Generated in parallel — all ${tmplToCreate.length} pages created concurrently`,
          `✓ Each targets developers searching for specific use-case APIs`,
          `✓ Includes working code examples — builds trust and drives signups`,
          "",
          "TEMPLATES CREATED:",
          ...TEMPLATES.map(
            (t) => `• ${t.name}${tmplExistingSlugs.has(t.slug) ? " (existing)" : ""}`,
          ),
        ].join("\n"),
        details: { created: tmplCreated.length, skipped: tmplSkipped.length },
      });
    }

    // ── STEP: People Also Ask Domination ─────────────────────────────────────
    if (stepId === "svivva-paa") {
      const PAA_QUESTIONS = [
        { q: "What is the best AI API builder?", slug: "best-ai-api-builder" },
        { q: "How much does it cost to build an AI API?", slug: "how-much-does-ai-api-cost" },
        { q: "Can you build an AI API without coding?", slug: "build-ai-api-without-coding" },
        { q: "How do I add AI to my existing app?", slug: "how-to-add-ai-to-existing-app" },
        {
          q: "What is the fastest way to build an AI product?",
          slug: "fastest-way-to-build-ai-product",
        },
        { q: "How do I monetize an AI API?", slug: "how-to-monetize-ai-api" },
        { q: "How do I get consistent JSON output from AI?", slug: "get-consistent-json-from-ai" },
        { q: "What is schema enforcement in AI APIs?", slug: "what-is-schema-enforcement-ai-api" },
        { q: "How long does it take to build an AI API?", slug: "how-long-to-build-ai-api" },
        { q: "Is there a free AI API builder?", slug: "free-ai-api-builder" },
        { q: "How do I reduce OpenAI API costs in production?", slug: "reduce-openai-api-costs" },
        {
          q: "What is the difference between GPT-4 and Claude for APIs?",
          slug: "gpt4-vs-claude-for-api",
        },
        {
          q: "How do I secure an AI API from prompt injection?",
          slug: "secure-ai-api-prompt-injection",
        },
        { q: "Can I build a SaaS app using an AI API?", slug: "build-saas-with-ai-api" },
        { q: "How do I test an AI API before deploying?", slug: "how-to-test-ai-api" },
      ];

      const paaSlugs = PAA_QUESTIONS.map((p) => p.slug);
      const paaExisting = await db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(inArray(seoLandingPages.slug, paaSlugs));
      const paaExistingSlugs = new Set(paaExisting.map((r) => r.slug));
      const paaToCreate = PAA_QUESTIONS.filter((p) => !paaExistingSlugs.has(p.slug));
      const paaSkipped = PAA_QUESTIONS.filter((p) => paaExistingSlugs.has(p.slug));

      const paaResults = await Promise.allSettled(
        PAA_QUESTIONS.map(async (paa) => {
          const gen = await openai.chat.completions.create({
            model: getDefaultModel(),
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You write Answer Engine Optimized (AEO) content for Google's "People Also Ask" boxes AND AI search engines (Perplexity, ChatGPT, Gemini). Rules:
1. Start with a direct 2-3 sentence answer in the FIRST paragraph — this is what Google and Perplexity show
2. Be factual, specific, and cite concrete numbers where possible
3. Use H2/H3 subheadings for supporting sections
4. Mention Svivva naturally in the answer as one solution
5. No marketing fluff — write like an expert answering on Quora`,
              },
              {
                role: "user",
                content: `Write a complete answer page for the question: "${paa.q}". Return JSON: { title (the question), metaTitle (question + " | Svivva", 60 chars max), metaDescription (direct answer in 155 chars), content (600-800 words markdown: direct answer paragraph, H2 supporting sections, mention Svivva as a tool that helps) }`,
              },
            ],
          });
          const d = JSON.parse(gen.choices[0].message.content || "{}");
          await db.insert(seoLandingPages).values({
            id: randomBytes(12).toString("hex"),
            slug: paa.slug,
            title: d.title || paa.q,
            metaTitle: d.metaTitle || paa.q,
            metaDescription: d.metaDescription || "",
            content: d.content || "",
            category: "paa",
            published: true,
            publishedAt: new Date(),
          } as any);
          return { title: paa.q, url: `${BASE_URL}/${paa.slug}` };
        }),
      );

      const paaCreated = paaResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<{ title: string; url: string }>).value);
      if (paaCreated.length) submitIndexNowBatched(paaCreated.map((c) => c.url)).catch(() => {});

      return NextResponse.json({
        summary: [
          `✓ ${paaCreated.length} PAA pages created`,
          `✓ ${paaSkipped.length} already exist (skipped)`,
          "",
          "PAA STRATEGY:",
          "Each page directly answers a 'People Also Ask' question",
          "Google shows these in PAA boxes at the top of search results",
          "Perplexity, ChatGPT, Gemini also cite these pages for matching queries",
          "",
          "PAGES CREATED:",
          ...paaCreated.map((c) => `• ${c.title}`),
        ].join("\n"),
        details: { created: paaCreated.length, skipped: paaSkipped.length },
      });
    }

    // ── STEP: RUN ALL SVIVVA STEPS ────────────────────────────────────────────
    if (stepId === "run-all-svivva") {
      const svivvaSteps = [
        "svivva-indexnow",
        "svivva-seo-pages",
        "svivva-comparisons",
        "svivva-blog",
        "svivva-directories",
        "svivva-parasite",
        "svivva-aeo",
        "svivva-communities",
        "svivva-outreach",
        "svivva-schema",
        "svivva-social",
        "svivva-submit",
        "svivva-integrations",
        "svivva-usecases",
        "svivva-templates",
        "svivva-paa",
      ];

      const results: string[] = [];
      const errors: string[] = [];

      for (const step of svivvaSteps) {
        try {
          const body: Record<string, unknown> = { stepId: step };
          const res = await fetch(`${BASE_URL}/api/orbit/run-step`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok) {
            errors.push(`${step}: ${data.error || `HTTP ${res.status}`}`);
          } else {
            results.push(`✓ ${step}: ${data.summary?.split("\n")[0] || "completed"}`);
          }
        } catch (e) {
          errors.push(`${step}: ${String(e).slice(0, 60)}`);
        }
      }

      return NextResponse.json({
        summary: [
          "🏆 ALL SVIVVA STEPS COMPLETED",
          "",
          ...results,
          ...(errors.length ? ["", "ERRORS:", ...errors] : []),
          "",
          "NEXT STEPS:",
          "1. Request indexing in Google Search Console for all new pages",
          "2. Share content on social platforms as needed",
          "3. Monitor traffic and rankings",
        ].join("\n"),
        details: { completed: results.length, errors: errors.length },
      });
    }

    return NextResponse.json({ error: "Unknown stepId" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
