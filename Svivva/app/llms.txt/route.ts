import { db } from "@/lib/db";
import { blogPosts, seoLandingPages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * /llms.txt — the GEO (Generative Engine Optimization) manifest.
 * Tells AI crawlers (ChatGPT, Perplexity, Claude, Google AI Overviews) what
 * ZZAI is and which pages to cite. A growing, free traffic source in 2026.
 * Spec: https://llmstxt.org
 */
export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");

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
  lines.push("# ZZAI");
  lines.push("");
  lines.push(
    "> ZZAI turns plain-English prompts into deployable, callable APIs — add AI to any app without building or hosting a backend. It also publishes a large library of free AI tools and cyber-security mini-apps that solve one job each, with no signup required.",
  );
  lines.push("");
  lines.push(
    "ZZAI is built for indie hackers, developers, and founders who want to ship AI features fast. Free tools are top-of-funnel; the core product (prompt-to-API / AI API builder) is the paid platform.",
  );
  lines.push("");
  lines.push("## Core pages");
  lines.push(`- [ZZAI home](${base}): Build and deploy AI APIs from a prompt.`);
  lines.push(`- [AI Tools Hub](${base}/ai-tools-hub): Free AI utilities for developers.`);
  lines.push(
    `- [Cyber-Security Mini Apps](${base}/cyber-security-mini-apps): Free security scanners and checkers.`,
  );
  lines.push(`- [All Tools](${base}/tools): The full free tool directory.`);
  lines.push(`- [Blog](${base}/blog): Guides on APIs, AI, and SEO.`);
  lines.push(`- [Orbit](${base}/orbit): Growth + indexing autopilot.`);
  lines.push(`- [Seeds](${base}/seeds): PDF or YouTube transcript → many apps.`);
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

  lines.push("## Contact");
  lines.push(`- [Contact](${base}/contact)`);
  lines.push(`- [Docs](${base}/docs)`);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
