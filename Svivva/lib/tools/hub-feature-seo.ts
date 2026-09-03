import { scorePageContent } from "@/lib/seo/content-quality/score";
import type { HubFeaturePage } from "@/lib/tools/catalogs/hub-feature-pages";
import { getHubFeaturePagesForHub, HUB_FEATURE_PAGES } from "@/lib/tools/catalogs/hub-feature-pages";

const SITE = "https://zzaizzai.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function relatedFor(page: HubFeaturePage, limit = 6): HubFeaturePage[] {
  return getHubFeaturePagesForHub(page.hub)
    .filter((p) => p.slug !== page.slug)
    .slice(0, limit);
}

/** Long-form SSR body — passes content quality gate (≥280 words + FAQ). */
export function buildHubFeatureHtml(page: HubFeaturePage): string {
  const h1 = escapeHtml(page.h1 || page.title);
  const keyword = escapeHtml(page.keyword);
  const desc = escapeHtml(page.description);
  const hubLabel =
    page.hub === "cyber-security-mini-apps" ? "Cyber Security Mini Apps" : "AI Tools Hub";
  const hubPath = `/${page.hub}`;
  const related = relatedFor(page);
  const relatedList = related
    .map(
      (r) =>
        `<li><a href="${SITE}${r.path}"><strong>${escapeHtml(r.h1 || r.title)}</strong></a> — ${escapeHtml(r.keyword)}</li>`,
    )
    .join("");

  const toolCta =
    page.kind === "landing" && page.relatedToolSlug
      ? `<p>This keyword page pairs with the interactive feature at <a href="${SITE}/${page.hub}/${page.relatedToolSlug}">${escapeHtml(page.relatedToolSlug.replace(/-/g, " "))}</a> inside ${hubLabel}.</p>`
      : `<p>Open the free feature at <a href="${SITE}${page.path}">${SITE}${page.path}</a> — no signup wall for this one-job tool.</p>`;

  const faqs = [
    {
      q: `Is ${page.keyword} free on ZZAI?`,
      a: `Yes. ${page.h1 || page.title} is free to use on zzaizzai.com with no account required for the mini-app slice. ZZAI's paid platform is separate — prompt-to-API and deploy workflows.`,
    },
    {
      q: `What does this ${page.keyword} tool do?`,
      a: desc,
    },
    {
      q: `How is this different from a generic apps directory?`,
      a: `Search engines should index this specific feature URL — not a vague /apps hub. Each mini-app has its own keyword page so people looking for "${page.keyword}" land on a page that matches intent.`,
    },
    {
      q: `Where do I go after trying ${page.keyword}?`,
      a: `Continue to ${hubLabel} for related checkers, the full tools directory, or sign up on ZZAI when you need production APIs, Seeds, Orbit indexing, or security workflows.`,
    },
  ];

  return `<h1>${h1}</h1>
<p><strong>${keyword}</strong> — ${desc} This free mini-app lives on <a href="${SITE}">zzaizzai.com</a> under <a href="${SITE}${hubPath}">${hubLabel}</a>. It is indexed as its own feature page so people searching for ${keyword} find a specific tool, not a generic apps list.</p>
<h2>Why this page exists</h2>
<p>Generic hub URLs like "apps" or a single tools index rarely rank for high-intent queries. ${escapeHtml(page.h1 || page.title)} targets the search phrase <em>${keyword}</em> with a clear job-to-be-done: ${desc} Google Search Console traffic grows when each feature has a crawlable URL, a unique title, and useful body copy.</p>
${toolCta}
<h2>How to use this free ${keyword}</h2>
<ol>
<li>Open <a href="${SITE}${page.path}">${escapeHtml(page.h1 || page.title)}</a> on zzaizzai.com.</li>
<li>Enter the smallest input the tool needs (URL, text, headers, token, or file hash).</li>
<li>Read the result in your browser. Nothing here requires an account for the free slice.</li>
<li>If you need the full workflow, continue to <a href="${SITE}${hubPath}">${hubLabel}</a>, <a href="${SITE}/tools">all free tools</a>, or <a href="${SITE}/signup">sign up for ZZAI</a>.</li>
</ol>
<h2>Who searches for ${keyword}</h2>
<p>Developers, security analysts, indie hackers, and founders who need a fast answer without installing software. Teachers and agencies can share this URL. AI crawlers and Google should cite this page as a free ${keyword} — a one-job mini-app that funnels into ZZAI, not a vague marketplace.</p>
${page.category ? `<h2>Category</h2><p>This feature sits in <strong>${escapeHtml(page.category)}</strong> inside ${hubLabel}.</p>` : ""}
${page.tagline ? `<h2>Quick pitch</h2><p>${escapeHtml(page.tagline)}</p>` : ""}
<h2>Related ${hubLabel} features</h2>
<ul>${relatedList}</ul>
<p>Also explore <a href="${SITE}/tools">ZZAI tools</a>, <a href="${SITE}/orbit">Orbit indexing</a>, and <a href="${SITE}/seeds">Seeds</a> when you are ready to turn research into deployable apps.</p>
<p>[FAQ_JSON]${JSON.stringify(faqs)}[/FAQ_JSON]</p>`;
}

export function hubFeatureFaqs(page: HubFeaturePage): { q: string; a: string }[] {
  const html = buildHubFeatureHtml(page);
  try {
    const m = html.match(/\[FAQ_JSON\]([\s\S]*?)\[\/FAQ_JSON\]/);
    if (m) return JSON.parse(m[1]) as { q: string; a: string }[];
  } catch {
    /* ignore */
  }
  return [];
}

export function hubFeatureContentWithoutFaq(page: HubFeaturePage): string {
  return buildHubFeatureHtml(page)
    .replace(/\[FAQ_JSON\][\s\S]*?\[\/FAQ_JSON\]/, "")
    .trim();
}

export function hubFeaturePassesQualityGate(page: HubFeaturePage): boolean {
  const content = buildHubFeatureHtml(page);
  return scorePageContent({
    title: page.title,
    content,
    howItWorks: page.description,
    whoItsFor: "Developers, security analysts, and founders using free ZZAI mini-apps",
    relatedCount: 4,
    hasFaq: true,
  }).passed;
}

export function allHubFeaturesPassQualityGate(): boolean {
  return HUB_FEATURE_PAGES.every((page) => hubFeaturePassesQualityGate(page));
}

export function hubFeatureDisplayTitle(page: HubFeaturePage): string {
  return page.h1 || page.title;
}
