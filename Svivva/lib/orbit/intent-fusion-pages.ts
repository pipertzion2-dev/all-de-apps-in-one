/**
 * Intent Fusion Matrix (IFM) — programmatic SEO bridge pages pairing unrelated tool families.
 * Each fusion page targets a long-tail keyword and links to related tools + ZZAI core.
 */
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { scorePageContent } from "@/lib/seo/content-quality/score";

const BASE = getSiteUrl().replace(/\/$/, "");

export type FusionPair = {
  slug: string;
  title: string;
  keyword: string;
  toolA: string;
  toolB: string;
  fusionConcept: string;
  category: string;
};

/** Curated fusion pairings — expand weekly via Orbit AI or manual curation. */
export const FUSION_PAIRS: FusionPair[] = [
  {
    slug: "embedded-device-risk-scorer",
    title: "Embedded Device Risk Scorer",
    keyword: "embedded device security risk assessment tool",
    toolA: "CVSS Calculator",
    toolB: "Hardware Compliance Checker",
    fusionConcept: "Score firmware and hardware exposure in one pass",
    category: "Cybersecurity × Hardware",
  },
  {
    slug: "llm-contract-hardening-tool",
    title: "LLM Contract Hardening Tool",
    keyword: "llm api schema validation security",
    toolA: "Prompt Security Scanner",
    toolB: "JSON Schema Linter",
    fusionConcept: "Harden AI outputs with schema + prompt guardrails",
    category: "Prompt Engineering × Compliance",
  },
  {
    slug: "hybrid-hardware-concept-to-bom",
    title: "Hybrid Hardware Concept-to-BOM",
    keyword: "hardware prototype bill of materials generator",
    toolA: "Cross-Domain Idea Hybridizer",
    toolB: "BOM Generator",
    fusionConcept: "Turn hybrid concepts into shippable BOMs",
    category: "Research × Hardware",
  },
  {
    slug: "ai-resume-api-for-engineers",
    title: "AI Resume API for Software Engineers",
    keyword: "resume builder api for software engineers",
    toolA: "Resume Parser",
    toolB: "AI API Builder",
    fusionConcept: "Parse and generate engineer resumes via API",
    category: "Product × Developer Tools",
  },
  {
    slug: "invoice-pdf-compress-merge",
    title: "Invoice PDF Compress & Merge",
    keyword: "compress and merge invoice pdf free",
    toolA: "PDF Compressor",
    toolB: "PDF Merger",
    fusionConcept: "Prepare invoice PDFs for email and accounting",
    category: "Finance × Document Tools",
  },
  {
    slug: "security-scan-to-api",
    title: "Security Scan to API",
    keyword: "automate security scan results api",
    toolA: "Vulnerability Scanner",
    toolB: "Prompt-to-API Builder",
    fusionConcept: "Turn scan findings into monitored API endpoints",
    category: "Cybersecurity × AI Platform",
  },
  {
    slug: "youtube-caption-seo-optimizer",
    title: "YouTube Caption SEO Optimizer",
    keyword: "youtube caption seo optimization tool",
    toolA: "YouTube Caption Preview",
    toolB: "SEO Meta Generator",
    fusionConcept: "Optimize captions and meta for search discovery",
    category: "Content × SEO",
  },
  {
    slug: "api-cost-control-dashboard",
    title: "API Cost Control Dashboard",
    keyword: "ai api cost monitoring dashboard",
    toolA: "Token Usage Estimator",
    toolB: "API Analytics",
    fusionConcept: "Forecast and cap LLM spend before invoices spike",
    category: "FinOps × AI Platform",
  },
  {
    slug: "prompt-to-invoice-generator",
    title: "Prompt-to-Invoice Generator",
    keyword: "free ai invoice generator api",
    toolA: "Invoice Generator",
    toolB: "AI API Builder",
    fusionConcept: "Generate invoices from natural language prompts",
    category: "Finance × AI Platform",
  },
  {
    slug: "json-schema-api-validator",
    title: "JSON Schema API Validator",
    keyword: "json schema api validation tool free",
    toolA: "JSON Schema Linter",
    toolB: "API Validator",
    fusionConcept: "Validate request/response contracts before deploy",
    category: "Developer Tools × Compliance",
  },
];

function buildFusionContent(pair: FusionPair): string {
  const { title, toolA, toolB, fusionConcept, keyword } = pair;
  return `<h1>${title}</h1>
<p><strong>${title}</strong> combines ${toolA} and ${toolB} into one workflow: ${fusionConcept}. This fusion page targets <em>${keyword}</em> and routes qualified traffic to free tools on ZZAI and the prompt-to-API platform at <a href="${BASE}">zzaizzai.com</a>.</p>

<h2>Why this fusion exists</h2>
<p>Searchers looking for "${keyword}" often need both utilities in one session. Instead of bouncing between unrelated tabs, this page explains the combined job-to-be-done and links to live tools you can run immediately.</p>

<h2>How it works</h2>
<ol>
<li>Start with <strong>${toolA}</strong> — run the first step in your browser at <a href="${BASE}/tools">ZZAI Tools</a>.</li>
<li>Continue with <strong>${toolB}</strong> — pass output forward without exporting to spreadsheets.</li>
<li>When you need a production endpoint, deploy the same behavior as an API on ZZAI in minutes.</li>
</ol>

<h2>Who this is for</h2>
<p>Developers, founders, and operators who search for practical "${keyword}" solutions and want a clear path from free tool to production API.</p>

<h2>Related tools</h2>
<ul>
<li><a href="${BASE}/tools">Browse all ZZAI tools</a></li>
<li><a href="${BASE}/ai-tools-hub">AI Tools Hub</a></li>
<li><a href="${BASE}/cyber-security-mini-apps">Cyber Security Mini-Apps</a></li>
</ul>

[FAQ_JSON]
[
  {"q":"Is ${title} free?","a":"Yes — ZZAI free tools work without signup for basic access."},
  {"q":"What is Intent Fusion?","a":"Intent Fusion pairs two tool families into one landing page that matches how people actually search."},
  {"q":"Can I deploy this as an API?","a":"Yes — use ZZAI to turn the workflow into a hosted HTTPS endpoint with schema validation."}
]
[/FAQ_JSON]

<p class="text-muted"><small>Fusion category: ${pair.category}</small></p>`;
}

async function insertFusionPage(pair: FusionPair): Promise<boolean> {
  const content = buildFusionContent(pair);
  const metaTitle = `${pair.title} — Free Online Tool | ZZAI`.slice(0, 60);
  const metaDescription =
    `${pair.fusionConcept}. Free ${pair.keyword} tool — traffic to zzaizzai.com.`.slice(0, 155);

  const quality = scorePageContent({
    title: pair.title,
    content,
    howItWorks: pair.fusionConcept,
    whoItsFor: "Developers and teams building with AI on ZZAI",
    hasFaq: true,
  });
  if (!quality.passed) return false;

  const existing = await db
    .select({ id: seoLandingPages.id })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.slug, pair.slug))
    .limit(1);
  if (existing.length) return false;

  await db.insert(seoLandingPages).values({
    slug: pair.slug,
    title: pair.title,
    keyword: pair.keyword,
    headline: pair.title,
    howItWorks: pair.fusionConcept,
    whoItsFor: "Developers and teams building with AI on ZZAI",
    content,
    metaTitle,
    metaDescription,
    category: "fusion",
    published: true,
    toolUrl: `${BASE}/${pair.slug}`,
  });
  return true;
}

/** Create up to `max` fusion landing pages that do not yet exist. */
export async function generateIntentFusionPages(max = 5): Promise<{
  created: number;
  slugs: string[];
  skipped: number;
}> {
  const slugs: string[] = [];
  let skipped = 0;

  for (const pair of FUSION_PAIRS) {
    if (slugs.length >= max) break;
    const inserted = await insertFusionPage(pair);
    if (inserted) slugs.push(pair.slug);
    else skipped++;
  }

  return { created: slugs.length, slugs, skipped };
}
