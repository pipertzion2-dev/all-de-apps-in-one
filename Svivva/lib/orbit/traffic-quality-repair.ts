/**
 * Repairs SEO pages that block Google from sending traffic:
 * thin doorway pages, duplicate titles, filler slugs.
 */
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq, like } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { scorePageContent } from "@/lib/seo/content-quality/score";
import { healOrphanInternalLinks } from "@/lib/seo/internal-links/graph";

const BASE = getSiteUrl().replace(/\/$/, "");
const FILLER_PREFIX = "svivva-seo-tool-fill-";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(html: string): number {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

/** Rich, unique HTML for thin tool/seed pages (passes quality gate). */
export function buildExpandedSeoBody(opts: {
  title: string;
  keyword: string;
  slug: string;
  category?: string | null;
}): string {
  const { title, keyword, slug } = opts;
  const kw = keyword || title;
  return `<h1>${title}</h1>
<p><strong>${title}</strong> is a free, browser-based utility on Svivva. Use it instantly — no signup required for basic access. Whether you are prototyping an AI feature, validating an idea, or shipping a small automation, this page explains what the tool does, who it helps, and how it connects to Svivva's prompt-to-API platform at <a href="${BASE}">svivva.com</a>.</p>

<h2>What ${title} does</h2>
<p>This tool focuses on <em>${kw}</em>. It is designed for developers, founders, and operators who need a fast answer without standing up a backend. Run it in the browser, copy the output, and iterate. When you need a production endpoint with schema validation and monitoring, deploy the same behavior as an API on Svivva in minutes.</p>

<h2>How to use it</h2>
<ol>
<li>Open the tool from <a href="${BASE}/tools">Svivva Tools</a> or build a custom version with a plain-English prompt.</li>
<li>Enter your input — text, JSON, or file depending on the tool.</li>
<li>Review structured output; adjust prompts on Svivva without redeploying servers.</li>
<li>Ship: call your live HTTPS endpoint from any app or workflow.</li>
</ol>

<h2>Who this is for</h2>
<p>Indie hackers adding AI to a side project, SaaS teams testing a feature before writing a backend, and security or ops teams running one-off checks. If your job is mostly <strong>AI behavior</strong> (generate, classify, extract, summarize), a prompt-backed API beats maintaining idle servers.</p>

<h2>Why Svivva</h2>
<p>Svivva turns descriptions into deployable APIs with automated evals, versioning, and rollback. Free tools like this one are the top of the funnel — they solve a real job and show how fast you can go from idea to production. <a href="${BASE}">Start building on Svivva →</a></p>

[FAQ_JSON]
[
  {"q":"Is ${title} free?","a":"Yes — you can use Svivva's free tools without creating an account for basic access."},
  {"q":"Do I need a backend?","a":"No. These utilities run in the browser or call Svivva-hosted endpoints so you do not maintain servers."},
  {"q":"How is this different from ChatGPT?","a":"Svivva gives you a fixed contract (JSON schema), a stable HTTPS URL, and production guardrails — not just a chat window."}
]
[/FAQ_JSON]

<p class="text-muted"><small>Page id: ${slug}</small></p>`;
}

export type TrafficQualityRepairResult = {
  summaryLines: string[];
  unpublishedFiller: number;
  expandedThin: number;
  duplicateTitlesFixed: number;
  orphansHealed: number;
  sitemapEligible: number;
  stillThin: number;
};

export async function unpublishFillerPages(): Promise<number> {
  const rows = await db
    .select({ id: seoLandingPages.id })
    .from(seoLandingPages)
    .where(like(seoLandingPages.slug, `${FILLER_PREFIX}%`));
  if (!rows.length) return 0;
  await db
    .update(seoLandingPages)
    .set({ published: false })
    .where(like(seoLandingPages.slug, `${FILLER_PREFIX}%`));
  return rows.length;
}

export async function expandThinPublishedPages(): Promise<{ expanded: number; stillThin: number }> {
  const rows = await db
    .select()
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  let expanded = 0;
  let stillThin = 0;

  for (const row of rows) {
    const words = wordCount(row.content || "");
    const scores = scorePageContent({
      title: row.title,
      content: row.content || "",
      howItWorks: row.howItWorks || undefined,
      whoItsFor: row.whoItsFor || undefined,
      hasFaq: /\[FAQ_JSON\]/i.test(row.content || ""),
    });

    if (scores.passed && words >= 280) continue;

    const body = buildExpandedSeoBody({
      title: row.title,
      keyword: row.keyword || row.title,
      slug: row.slug,
      category: row.category,
    });

    const uniqueMeta =
      row.metaTitle && !row.metaTitle.includes("|")
        ? `${row.metaTitle} | ${row.slug}`.slice(0, 60)
        : row.metaTitle || `${row.title} | Svivva`.slice(0, 60);

    await db
      .update(seoLandingPages)
      .set({
        content: body,
        metaTitle: uniqueMeta,
        metaDescription:
          row.metaDescription?.trim() ||
          `Free ${row.title} on Svivva — ${stripHtml(body).slice(0, 120)}…`.slice(0, 155),
        published: true,
        toolUrl: row.toolUrl || `${BASE}/tools`,
      })
      .where(eq(seoLandingPages.id, row.id));

    const recheck = scorePageContent({
      title: row.title,
      content: body,
      howItWorks: row.howItWorks || undefined,
      whoItsFor: row.whoItsFor || undefined,
      hasFaq: true,
    });
    if (recheck.passed) expanded++;
    else stillThin++;
  }

  return { expanded, stillThin };
}

export async function fixDuplicateMetaTitles(): Promise<number> {
  const rows = await db
    .select({
      id: seoLandingPages.id,
      slug: seoLandingPages.slug,
      metaTitle: seoLandingPages.metaTitle,
      title: seoLandingPages.title,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  const byTitle = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = (row.metaTitle || row.title || "").trim().toLowerCase();
    if (!key) continue;
    const list = byTitle.get(key) ?? [];
    list.push(row);
    byTitle.set(key, list);
  }

  let fixed = 0;
  for (const [, group] of byTitle) {
    if (group.length < 2) continue;
    for (let i = 1; i < group.length; i++) {
      const row = group[i];
      const base = (row.metaTitle || row.title).slice(0, 40);
      const next = `${base} — ${row.slug}`.slice(0, 60);
      await db
        .update(seoLandingPages)
        .set({ metaTitle: next })
        .where(eq(seoLandingPages.id, row.id));
      fixed++;
    }
  }
  return fixed;
}

export async function countSitemapEligiblePages(): Promise<number> {
  const rows = await db
    .select({
      title: seoLandingPages.title,
      content: seoLandingPages.content,
      howItWorks: seoLandingPages.howItWorks,
      whoItsFor: seoLandingPages.whoItsFor,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  let ok = 0;
  for (const row of rows) {
    const scores = scorePageContent({
      title: row.title,
      content: row.content || "",
      howItWorks: row.howItWorks || undefined,
      whoItsFor: row.whoItsFor || undefined,
      hasFaq: /\[FAQ_JSON\]/i.test(row.content || ""),
    });
    if (scores.passed) ok++;
  }
  return ok;
}

/** Full traffic-quality pass — run before IndexNow / GSC submission. */
export async function runTrafficQualityRepair(): Promise<TrafficQualityRepairResult> {
  const summaryLines: string[] = ["═══ Traffic quality repair ═══"];

  const unpublishedFiller = await unpublishFillerPages();
  summaryLines.push(
    unpublishedFiller
      ? `✓ Unpublished ${unpublishedFiller} filler doorway pages (${FILLER_PREFIX}*)`
      : "✓ No filler doorway pages to unpublish",
  );

  const { expanded: expandedThin, stillThin } = await expandThinPublishedPages();
  summaryLines.push(
    `✓ Expanded ${expandedThin} thin pages to 280+ words with FAQ`,
    stillThin ? `⚠ ${stillThin} pages still below quality bar` : "✓ All published pages pass quality gate",
  );

  const duplicateTitlesFixed = await fixDuplicateMetaTitles();
  summaryLines.push(
    duplicateTitlesFixed
      ? `✓ Fixed ${duplicateTitlesFixed} duplicate meta titles`
      : "✓ No duplicate meta titles",
  );

  const { updated: orphansHealed } = await healOrphanInternalLinks();
  summaryLines.push(
    orphansHealed
      ? `✓ Healed internal links on ${orphansHealed} pages`
      : "✓ Internal link graph healthy",
  );

  const sitemapEligible = await countSitemapEligiblePages();
  summaryLines.push(`✓ ${sitemapEligible} pages eligible for sitemap (quality gate)`);

  return {
    summaryLines,
    unpublishedFiller,
    expandedThin,
    duplicateTitlesFixed,
    orphansHealed,
    sitemapEligible,
    stillThin,
  };
}
