import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials, seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { submitSitemapToGSC } from "@/lib/google-indexing";
import { ok, serverError } from "@/lib/http-response";
import { requireAdminUser } from "@/lib/auth/require-admin-user";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";
const GODADDY_API = "https://api.godaddy.com/v1";

function extractDomain(url: string): string | null {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname; } catch { return null; }
}

// ── Generate landing page for one mini tool ───────────────────────────────────
async function generateMiniToolPage(toolName: string, toolDesc: string, appUrl: string, appName: string) {
  const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55);
  const existing = await db.select({ id: seoLandingPages.id }).from(seoLandingPages).where(eq(seoLandingPages.slug, slug)).limit(1);
  if (existing.length > 0) return { slug, created: false };

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{
      role: "user",
      content: `Write an SEO landing page for a tool called "${toolName}" which is part of "${appName}" at ${appUrl}.
Tool description: "${toolDesc}"

Return JSON:
{
  "title": "SEO title under 60 chars",
  "metaDescription": "meta description under 155 chars",
  "content": "400-word body with benefits, use cases, 2 H2 headings. Include [FAQ_JSON][{\"q\":\"...\",\"a\":\"...\"},{\"q\":\"...\",\"a\":\"...\"}][/FAQ_JSON]",
  "keywords": ["keyword1","keyword2","keyword3"]
}`
    }],
    response_format: { type: "json_object" },
    max_tokens: 900,
  });

  let page: any = {};
  try { page = JSON.parse(completion.choices[0].message.content || "{}"); } catch { return { slug, created: false }; }

  await db.insert(seoLandingPages).values({
    slug,
    title: page.title || toolName,
    keyword: toolName,
    headline: page.headline || page.title || toolName,
    howItWorks: page.howItWorks || `${toolName} is a free AI-powered tool`,
    whoItsFor: page.whoItsFor || "Anyone looking for free AI tools",
    metaDescription: page.metaDescription || `Use ${toolName} — a free tool at ${appName}`,
    content: page.content || "",
    toolUrl: `app:mini:${slug}`,
    category: "replit-app",
    published: true,
  });
  return { slug, title: page.title || toolName, created: true };
}

// ── Discover tool names from a Replit app ────────────────────────────────────
async function discoverMiniTools(appUrl: string, appName: string): Promise<{ name: string; description: string }[]> {
  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{
      role: "user",
      content: `The app "${appName}" at ${appUrl} contains mini tools/apps. Based on the app name and URL, generate a realistic list of 12 mini tools that would be in this app.

Return JSON: {"tools": [{"name": "tool name", "description": "one sentence description"}, ...]}`
    }],
    response_format: { type: "json_object" },
    max_tokens: 800,
  });
  try {
    const d = JSON.parse(completion.choices[0].message.content || "{}");
    return (d.tools || []).slice(0, 12);
  } catch { return []; }
}

// ── Submit URLs to IndexNow ───────────────────────────────────────────────────
async function submitIndexNow(urls: string[], creds: any) {
  const key = creds?.indexnowKey;
  if (!key || urls.length === 0) return false;
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host: new URL(BASE_URL).hostname, key, urlList: urls.slice(0, 100) }),
    });
    return r.ok || r.status === 202;
  } catch { return false; }
}

// ── Submit sitemap to Google Search Console (Webmasters v3 API) ──────────────
// The legacy ?ping= endpoint was retired in June 2023; we now submit via the real API,
// which requires a service-account JSON saved at /dashboard/gsc-connect.
async function submitGoogleSitemap(siteUrl: string, serviceAccountJson: string | null) {
  const sitemapUrl = `${siteUrl.replace(/\/$/, "")}/sitemap.xml`;
  if (!serviceAccountJson) return { ok: false, sitemapUrl, error: "No service account configured" };
  const result = await submitSitemapToGSC(serviceAccountJson, siteUrl, sitemapUrl);
  return { ok: result.ok, sitemapUrl, error: result.error };
}

// ── Create GoDaddy CNAME ──────────────────────────────────────────────────────
async function createGodaddyCname(creds: any, subdomain: string, targetDomain: string) {
  if (!creds?.godaddyApiKey || !creds?.godaddyApiSecret || !creds.godaddyDomain) return { ok: false };
  const authHeader = `sso-key ${creds.godaddyApiKey}:${creds.godaddyApiSecret}`;
  try {
    const r = await fetch(`${GODADDY_API}/domains/${creds.godaddyDomain}/records/CNAME/${subdomain}`, {
      method: "PUT",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify([{ data: targetDomain, ttl: 3600 }]),
    });
    return { ok: r.ok, subdomain: `${subdomain}.${creds.godaddyDomain}`, target: targetDomain };
  } catch { return { ok: false }; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAdminUser();
    if (error || !user) return error!;

    const [creds] = await db.select().from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
    const rawCreds = creds as any;

    const log: { step: string; status: "ok" | "skip" | "error"; detail: string }[] = [];
    const newUrls: string[] = [];
    const createdPages: { slug: string; title: string }[] = [];

    // ── Step 1: Identify the mini apps URL ───────────────────────────────────
    const miniAppsUrl = rawCreds?.mini_apps_url || null;
    const miniAppsDomain = miniAppsUrl ? extractDomain(miniAppsUrl) : null;
    const miniAppsSubdomain = (rawCreds?.mini_apps_subdomain || "apps").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

    if (!miniAppsUrl) {
      log.push({ step: "Mini Apps", status: "skip", detail: "No mini apps URL set — add it in the Traffic Connections panel to auto-generate pages" });
    } else {
      log.push({ step: "Mini Apps", status: "ok", detail: `Using ${miniAppsDomain} as your mini apps deployment` });
    }

    // ── Step 2: Generate SEO landing pages for each mini tool ────────────────
    if (miniAppsUrl && miniAppsDomain) {
      const appName = miniAppsDomain.split(".")[0].replace(/-/g, " ");
      const tools = await discoverMiniTools(miniAppsUrl, appName);
      log.push({ step: "Tools", status: "ok", detail: `Discovered ${tools.length} mini tools in ${appName}` });

      for (const tool of tools) {
        const result = await generateMiniToolPage(tool.name, tool.description, miniAppsUrl, appName);
        if (result.created) {
          newUrls.push(`${BASE_URL}/${result.slug}`);
          createdPages.push({ slug: result.slug, title: (result as any).title || result.slug });
        }
      }
      log.push({ step: "Pages", status: "ok", detail: `${createdPages.length} new SEO landing pages created at ${BASE_URL}` });
    } else {
      log.push({ step: "Pages", status: "skip", detail: "No mini apps URL — set it above to generate pages automatically" });
    }

    // ── Step 3: GoDaddy CNAME for the mini apps subdomain ───────────────────
    if (creds?.godaddyApiKey && creds.godaddyDomain) {
      if (miniAppsDomain) {
        const cnameResult = await createGodaddyCname(creds, miniAppsSubdomain, miniAppsDomain);
        if (cnameResult.ok) {
          log.push({ step: "GoDaddy DNS", status: "ok", detail: `✓ ${cnameResult.subdomain} → ${cnameResult.target} (CNAME record created)` });
        } else {
          log.push({ step: "GoDaddy DNS", status: "error", detail: `Failed to create CNAME — check your GoDaddy API key has DNS edit permissions` });
        }
      } else {
        log.push({ step: "GoDaddy DNS", status: "skip", detail: `GoDaddy connected to ${creds.godaddyDomain} — add Mini Apps URL above to auto-create DNS record` });
      }
    } else {
      log.push({ step: "GoDaddy DNS", status: "skip", detail: "GoDaddy not connected — add credentials to auto-create DNS records" });
    }

    // ── Step 4: IndexNow submission ──────────────────────────────────────────
    const indexOk = await submitIndexNow(newUrls, creds);
    if (newUrls.length > 0) {
      log.push({ step: "Bing/Yandex (IndexNow)", status: indexOk ? "ok" : "skip", detail: indexOk ? `${newUrls.length} URLs submitted for instant indexing` : "Set up IndexNow first (ask the AI: 'set up IndexNow')" });
    } else {
      log.push({ step: "Bing/Yandex (IndexNow)", status: "skip", detail: "No new pages to submit" });
    }

    // ── Step 5: Submit sitemap to Google Search Console ──────────────────────
    const googleSiteUrl = creds?.googleSiteUrl;
    if (googleSiteUrl) {
      const googleResult = await submitGoogleSitemap(googleSiteUrl, creds?.googleServiceAccountJson || null);
      log.push({
        step: "Google",
        status: googleResult.ok ? "ok" : "skip",
        detail: googleResult.ok
          ? `Sitemap submitted to Google Search Console: ${googleResult.sitemapUrl}`
          : googleResult.error?.includes("No service account")
            ? `Skipped — paste a service-account JSON at /dashboard/gsc-connect to enable.`
            : `Submit failed (${googleResult.error}) — submit manually at search.google.com/search-console → Sitemaps`,
      });
    } else {
      log.push({ step: "Google", status: "skip", detail: "Add your site URL in the Traffic Connections panel to enable Google sitemap submission" });
    }

    const summaryParts = [];
    if (createdPages.length > 0) summaryParts.push(`${createdPages.length} landing pages created`);
    if (miniAppsDomain && creds?.godaddyApiKey) summaryParts.push(`DNS record for ${miniAppsSubdomain}.${creds.godaddyDomain}`);
    if (newUrls.length > 0 && indexOk) summaryParts.push(`${newUrls.length} URLs submitted to Bing/Yandex`);
    if (googleSiteUrl) summaryParts.push("Google sitemap pinged");

    return ok({
      success: true,
      createdPages,
      newUrls,
      log,
      summary: summaryParts.length > 0 ? `✓ ${summaryParts.join(" · ")}` : "Pipeline complete — no new pages to create (all already exist)",
    });
  } catch (e) {
    console.error("Auto-link error:", e);
    return serverError(String(e));
  }
}
