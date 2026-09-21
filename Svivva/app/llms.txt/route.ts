import { db } from "@/lib/db";
import { blogPosts, seoLandingPages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getBrandKnowledge } from "@/lib/brand-knowledge";
import { getSiteUrl } from "@/lib/site-url";
import { getHubFeaturePagesForHub } from "@/lib/tools/catalogs/hub-feature-pages";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * /llms.txt — GEO (Generative Engine Optimization) + SearchDock entity manifest.
 * Tells AI crawlers and AEO platforms what zzai zzai is, aliases, products, and
 * which pages to cite. Spec: https://llmstxt.org
 */
export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const k = getBrandKnowledge(base);

  let posts: { slug: string; title: string; excerpt: string | null }[] = [];
  let tools: { slug: string; keyword: string }[] = [];
  try {
    posts = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, excerpt: blogPosts.excerpt })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(40);
  } catch {
    /* db optional */
  }
  try {
    tools = await db
      .select({ slug: seoLandingPages.slug, keyword: seoLandingPages.keyword })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true))
      .limit(50);
  } catch {
    /* db optional */
  }

  const lines: string[] = [];
  lines.push(`# ${k.name}`);
  lines.push("");
  lines.push(`> ${k.definition}`);
  lines.push("");
  lines.push(k.longDescription);
  lines.push("");
  lines.push("## Also known as");
  for (const a of k.aliases) {
    lines.push(`- **${a.name}**${a.note ? ` — ${a.note}` : ""}`);
  }
  lines.push("");
  lines.push("## Entity");
  lines.push(`- Category: ${k.entity.category}`);
  lines.push(`- Focus: ${k.entity.subcategory}`);
  lines.push(`- Geography: ${k.entity.geography}`);
  lines.push(`- Audience: ${k.audience}`);
  lines.push(`- Pricing: ${k.pricingSummary}`);
  lines.push(`- Primary URL: ${k.siteUrl}`);
  lines.push(`- Contact: ${k.contactEmail}`);
  lines.push("");
  lines.push("## Highest citation-worthy URLs");
  for (const u of k.citationUrls) {
    lines.push(`- [${u.title}](${base}${u.path}): ${u.why}`);
  }
  lines.push("");
  lines.push("## Six cube faces (product navigator)");
  for (const f of k.cubeFaces) {
    lines.push(`- [${f.name}](${base}${f.path}): ${f.role}`);
  }
  lines.push("");
  lines.push("## Products & surfaces");
  for (const p of k.products) {
    lines.push(`- [${p.name}](${base}${p.path}): ${p.oneLiner}`);
  }
  lines.push("");
  lines.push("## OaaS mixing buses");
  for (const b of k.buses) {
    lines.push(`- **${b.label}** (${b.id}): ${b.description}`);
  }
  lines.push("");
  lines.push("## Definitions (quotable)");
  for (const d of k.definitions) {
    lines.push(`- **${d.term}:** ${d.definition}`);
  }
  lines.push("");
  lines.push("## FAQ (quotable)");
  for (const f of k.faqs) {
    lines.push(`- **Q:** ${f.q}`);
    lines.push(`  **A:** ${f.a}`);
  }
  lines.push("");
  lines.push("## Featured free slices (one job each, no signup)");
  lines.push(
    `- [YouTube Caption Preview](${base}/tools/youtube-caption-preview): Public captions from a watch URL. Seeds turns captions into apps.`,
  );
  lines.push(
    `- [Channel Blend Preview](${base}/tools/channel-blend-preview): First-order hybrid sketch of two ZZAI channels. Hybrid² Lab lists and fuses blends.`,
  );
  lines.push(
    `- [OaaS Patch Preview](${base}/tools/oaas-patch-preview): Keyword mixing-board patch order. Orchestration as a Service is the full desk.`,
  );
  lines.push(
    `- [ZZAI Face Chooser](${base}/tools/zzai-face-chooser): Pick a job, open one cube face. The homepage cube is the six-face navigator.`,
  );
  lines.push(
    `- [Sketch Hash Stamp](${base}/tools/sketch-hash-stamp): SHA-256 in the browser. Poor Man Protection seals and court-packs.`,
  );
  lines.push("");

  const cyberFeatures = getHubFeaturePagesForHub("cyber-security-mini-apps").slice(0, 24);
  const aiFeatures = getHubFeaturePagesForHub("ai-tools-hub").slice(0, 24);
  if (cyberFeatures.length) {
    lines.push("## Cyber security feature pages (keyword targets)");
    for (const p of cyberFeatures) {
      lines.push(`- [${p.h1 || p.title}](${base}${p.path}): ${p.keyword}`);
    }
    lines.push("");
  }
  if (aiFeatures.length) {
    lines.push("## AI tools feature pages (keyword targets)");
    for (const p of aiFeatures) {
      lines.push(`- [${p.h1 || p.title}](${base}${p.path}): ${p.keyword}`);
    }
    lines.push("");
  }

  if (posts.length) {
    lines.push("## Guides & articles");
    for (const p of posts) {
      const desc = (p.excerpt || "").replace(/\s+/g, " ").slice(0, 140).trim();
      lines.push(`- [${p.title}](${base}/blog/${p.slug})${desc ? `: ${desc}` : ""}`);
    }
    lines.push("");
  }

  if (tools.length) {
    lines.push("## Tools & landing pages");
    for (const t of tools) {
      lines.push(`- [${t.keyword}](${base}/${t.slug})`);
    }
    lines.push("");
  }

  lines.push("## Optional");
  lines.push(`- [Full brand knowledge for LLMs](${base}/llms-full.txt)`);
  lines.push(`- [Machine-readable brand card](${base}/brand.json)`);
  lines.push(`- [Sitemap](${base}/sitemap.xml)`);
  lines.push("");
  lines.push("## Contact");
  lines.push(`- [Contact](${base}/contact)`);
  lines.push(`- [Docs](${base}/docs)`);
  lines.push(`- Email: ${k.contactEmail}`);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
