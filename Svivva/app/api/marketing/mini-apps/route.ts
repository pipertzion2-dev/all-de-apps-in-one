import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, seedCredentials } from "@/lib/schema";
import { eq, like, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { submitUrlsToGoogleIndexingApi } from "@/lib/google-indexing";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { randomBytes } from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

async function getCredentials() {
  try {
    const rows = await db.execute(
      sql`SELECT indexnow_key, google_service_account_json FROM seed_credentials LIMIT 1`,
    );
    const row = (rows as any)[0];
    return {
      indexnowKey: row?.indexnow_key || null,
      serviceAccountJson: row?.google_service_account_json || null,
    };
  } catch {
    return { indexnowKey: null, serviceAccountJson: null };
  }
}

async function googleIndexingSubmit(urls: string[], serviceAccountJson: string | null) {
  if (!serviceAccountJson || !urls.length) return { submitted: 0, errors: [] };
  try {
    return await submitUrlsToGoogleIndexingApi(serviceAccountJson, urls);
  } catch {
    return { submitted: 0, errors: ["Service account error"] };
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const pages = await db
      .select({
        id: seoLandingPages.id,
        slug: seoLandingPages.slug,
        title: seoLandingPages.title,
        toolUrl: seoLandingPages.toolUrl,
        metaDescription: seoLandingPages.metaDescription,
        relatedSlugs: seoLandingPages.relatedSlugs,
      })
      .from(seoLandingPages)
      .where(like(seoLandingPages.toolUrl, "replit:%"));

    return NextResponse.json({ pages, total: pages.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    // ── AI DISCOVER APPS ──────────────────────────────────────────────────────
    if (action === "ai-discover-apps") {
      const { appName, appUrl, appDescription, count = 50 } = body;
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert at breaking down a large SaaS platform into distinct, marketable micro-tools for SEO. Each tool should feel like a standalone product.",
          },
          {
            role: "user",
            content: `App: "${appName}" at ${appUrl}. Description: "${appDescription}"\n\nBreak this into ${count} distinct mini-apps, tools, or features. Return JSON: { apps: [{ name: string (2-4 words), path: string (/tools/slug), description: string (1-2 sentences, who it's for and what it does) }] }`,
          },
        ],
      });
      const { apps = [] } = JSON.parse(completion.choices[0].message.content || "{}");
      return NextResponse.json({ apps });
    }

    // ── GENERATE PAGES BATCH ─────────────────────────────────────────────────
    if (action === "generate-pages-batch") {
      const { apps, replId, replTitle, replUrl, batchStart = 0, batchSize = 5 } = body;
      if (!apps?.length || !replId)
        return NextResponse.json({ error: "apps and replId required" }, { status: 400 });

      const { indexnowKey, serviceAccountJson } = await getCredentials();

      // Get all existing slugs from this replId for cross-linking
      const existingPages = await db
        .select({ slug: seoLandingPages.slug, title: seoLandingPages.title })
        .from(seoLandingPages)
        .where(like(seoLandingPages.toolUrl, `replit:${replId}:%`));

      const batch = apps.slice(batchStart, batchStart + batchSize);
      const created: { name: string; slug: string; url: string; ok: boolean; error?: string }[] =
        [];
      const newUrls: string[] = [];
      const newSlugs: { slug: string; title: string }[] = [];

      for (const app of batch) {
        try {
          const baseSlug = app.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 55);
          const existing = await db
            .select({ id: seoLandingPages.id })
            .from(seoLandingPages)
            .where(eq(seoLandingPages.slug, baseSlug))
            .limit(1);
          const slug = existing.length ? `${baseSlug}-${randomBytes(2).toString("hex")}` : baseSlug;
          const subKey = `replit:${replId}:sub:${baseSlug}`;

          // Pick 4 related slugs from existing pages (excluding self)
          const related = [...existingPages, ...newSlugs]
            .filter((p) => p.slug !== slug)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4)
            .map((p) => p.slug);

          const gen = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You are an expert SEO copywriter for "${replTitle || "a creative SaaS platform"}". Write conversion-optimized content for individual tool landing pages. Always include real, specific benefits and FAQ questions that people actually Google.`,
              },
              {
                role: "user",
                content: `Write a complete landing page for the tool: "${app.name}"
Description: "${app.description}"
Part of: ${replTitle} (${replUrl})

Return JSON with these exact keys:
{
  "metaTitle": "max 60 chars, includes tool name + main keyword",
  "metaDescription": "max 155 chars, action-oriented",
  "headline": "punchy H1, max 10 words, starts with a verb or power word",
  "subheadline": "supporting line that explains the value proposition, max 20 words",
  "content": "2 paragraphs HTML. Para 1: the problem this solves. Para 2: how ${app.name} fixes it specifically.",
  "benefits": ["3 short, specific benefit strings, each under 15 words"],
  "howItWorks": "2 short paragraphs explaining the step-by-step process",
  "whoItsFor": "2 short paragraphs describing the ideal user and their use case",
  "faq": [
    {"q": "real question someone would Google about this tool", "a": "concise 2-3 sentence answer"},
    {"q": "another real search query", "a": "answer"},
    {"q": "pricing or comparison question", "a": "answer"},
    {"q": "how-to question", "a": "answer"},
    {"q": "best use case question", "a": "answer"}
  ]
}`,
              },
            ],
          });

          const data = JSON.parse(gen.choices[0].message.content || "{}");
          const faqBlock = data.faq?.length
            ? `\n[FAQ_JSON]${JSON.stringify(data.faq)}[/FAQ_JSON]`
            : "";

          const fullContent = `<p>${data.content || app.description}</p>${faqBlock}`;

          await db.insert(seoLandingPages).values({
            slug,
            keyword: app.name,
            title: data.metaTitle || app.name,
            headline: data.headline || app.name,
            subheadline: data.subheadline || app.description,
            content: fullContent,
            benefits: data.benefits || [],
            howItWorks: data.howItWorks || "",
            whoItsFor: data.whoItsFor || "",
            relatedSlugs: related,
            category: "seed-marketing",
            toolUrl: subKey,
            metaTitle: data.metaTitle || app.name,
            metaDescription: data.metaDescription || app.description,
            published: true,
          });

          // Also register in replit_sub_apps if table exists
          try {
            await db.execute(sql`
              INSERT INTO replit_sub_apps (user_id, parent_repl_id, parent_repl_title, sub_app_name, sub_app_description, sub_app_path, sub_app_url)
              VALUES (${user.id}, ${replId}, ${replTitle || ""}, ${app.name}, ${app.description}, ${app.path || "/" + slug}, ${replUrl + (app.path || "/" + slug)})
              ON CONFLICT DO NOTHING
            `);
          } catch {}

          const pageUrl = `${BASE_URL}/${slug}`;
          newUrls.push(pageUrl);
          newSlugs.push({ slug, title: data.metaTitle || app.name });
          created.push({ name: app.name, slug, url: pageUrl, ok: true });
        } catch (e) {
          created.push({
            name: app.name,
            slug: "",
            url: "",
            ok: false,
            error: (e as Error).message.slice(0, 100),
          });
        }
      }

      // Back-fill relatedSlugs for pages generated in this batch
      if (newSlugs.length > 1) {
        for (const { slug } of newSlugs) {
          const relatedForThis = newSlugs
            .filter((s) => s.slug !== slug)
            .slice(0, 4)
            .map((s) => s.slug);
          if (relatedForThis.length > 0) {
            await db.execute(
              sql`UPDATE seo_landing_pages SET related_slugs = ${relatedForThis} WHERE slug = ${slug}`,
            );
          }
        }
      }

      // Submit to IndexNow + Google Indexing API in parallel
      const [indexnow, googleIndexing] = await Promise.all([
        indexnowKey && newUrls.length
          ? submitIndexNowBatched(newUrls, {
              indexnowKey,
              updateMatchingCredentialRows: false,
            }).then((r) => ({ submitted: r.ok, count: r.submittedCount }))
          : Promise.resolve({ submitted: false, count: 0 }),
        googleIndexingSubmit(newUrls, serviceAccountJson),
      ]);

      const remaining = Math.max(0, apps.length - (batchStart + batchSize));
      return NextResponse.json({
        created,
        indexnow,
        googleIndexing,
        batchStart,
        batchEnd: batchStart + batchSize,
        remaining,
        totalApps: apps.length,
      });
    }

    // ── GENERATE COMPARISON PAGES ─────────────────────────────────────────────
    if (action === "generate-comparison-pages") {
      const {
        apps,
        replId,
        replTitle,
        replUrl,
        competitors = ["GarageBand", "FL Studio", "Ableton", "Logic Pro"],
      } = body;
      if (!apps?.length || !replId)
        return NextResponse.json({ error: "apps and replId required" }, { status: 400 });

      const { indexnowKey, serviceAccountJson } = await getCredentials();

      // Pick top 10 apps for comparison pages (one comparison per tool)
      const topApps = apps.slice(0, 10);
      const created: { name: string; slug: string; url: string; ok: boolean }[] = [];
      const newUrls: string[] = [];

      for (const app of topApps) {
        const competitor = competitors[Math.floor(Math.random() * competitors.length)];
        const compSlug = `${app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-vs-${competitor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        const existing = await db
          .select({ id: seoLandingPages.id })
          .from(seoLandingPages)
          .where(eq(seoLandingPages.slug, compSlug))
          .limit(1);
        if (existing.length > 0) continue;

        try {
          const gen = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "SEO expert writing comparison landing pages. Be balanced but naturally favor the featured tool.",
              },
              {
                role: "user",
                content: `Write a "${app.name} vs ${competitor}" comparison page. ${app.name} is part of ${replTitle} at ${replUrl}. ${app.description}

Return JSON: {
  "metaTitle": "${app.name} vs ${competitor} (${new Date().getFullYear()}) | Svivva",
  "metaDescription": "max 155 chars comparison summary",
  "headline": "${app.name} vs ${competitor}: Which Is Better?",
  "subheadline": "20-word answer",
  "content": "3 paragraphs HTML comparing features, ease of use, and pricing. Position ${app.name} as the better choice for AI-first workflows.",
  "benefits": ["3 reasons ${app.name} wins for AI use cases"],
  "howItWorks": "How to switch from ${competitor} to ${app.name}",
  "whoItsFor": "Who should choose ${app.name} over ${competitor}",
  "faq": [
    {"q": "Is ${app.name} better than ${competitor}?", "a": "2-sentence answer"},
    {"q": "Can I import my ${competitor} projects into ${app.name}?", "a": "answer"},
    {"q": "What does ${app.name} do that ${competitor} cannot?", "a": "answer"}
  ]
}`,
              },
            ],
          });

          const data = JSON.parse(gen.choices[0].message.content || "{}");
          const faqBlock = data.faq?.length
            ? `\n[FAQ_JSON]${JSON.stringify(data.faq)}[/FAQ_JSON]`
            : "";

          await db.insert(seoLandingPages).values({
            slug: compSlug,
            keyword: `${app.name} vs ${competitor}`,
            title: data.metaTitle || `${app.name} vs ${competitor}`,
            headline: data.headline || `${app.name} vs ${competitor}`,
            subheadline: data.subheadline || "",
            content: `<p>${data.content || ""}</p>${faqBlock}`,
            benefits: data.benefits || [],
            howItWorks: data.howItWorks || "",
            whoItsFor: data.whoItsFor || "",
            relatedSlugs: [],
            category: "seed-marketing",
            toolUrl: `replit:${replId}:comparison:${compSlug}`,
            metaTitle: data.metaTitle || "",
            metaDescription: data.metaDescription || "",
            published: true,
          });

          const url = `${BASE_URL}/${compSlug}`;
          newUrls.push(url);
          created.push({ name: `${app.name} vs ${competitor}`, slug: compSlug, url, ok: true });
        } catch (e) {
          created.push({ name: `${app.name} vs ${competitor}`, slug: "", url: "", ok: false });
        }
      }

      const [indexnow, googleIndexing] = await Promise.all([
        indexnowKey && newUrls.length
          ? submitIndexNowBatched(newUrls, {
              indexnowKey,
              updateMatchingCredentialRows: false,
            }).then((r) => ({ submitted: r.ok, count: r.submittedCount }))
          : Promise.resolve({ submitted: false, count: 0 }),
        googleIndexingSubmit(newUrls, serviceAccountJson),
      ]);

      return NextResponse.json({ created, indexnow, googleIndexing, total: created.length });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (action === "delete-all-mini-app-pages") {
      const { replId } = body;
      await db.delete(seoLandingPages).where(like(seoLandingPages.toolUrl, `replit:${replId}:%`));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("mini-apps error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
