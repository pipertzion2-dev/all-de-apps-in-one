import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { generateJson, getMarketingModel } from "@/lib/orbit/ai-client";
import { isAnyAiProviderAvailable } from "@/lib/llm/openai";
import { db } from "@/lib/db";
import { blogPosts, seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type KeywordIdea = {
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  difficulty: "low" | "medium" | "high";
  rationale: string;
  contentType: "blog" | "seo-landing" | "comparison";
  titleSuggestion: string;
  outline: string[];
};

const PRODUCT_CONTEXT = `Svivva is a platform offering free AI tools and cyber-security mini-apps that
funnel traffic to a main SaaS (AI API builder / prompt-to-API). Audience: indie hackers,
developers, founders, and security-curious builders. Mini-apps are standalone tools that
drive traffic to the main product.`;

/**
 * POST — research new keyword + blog/landing opportunities.
 * Uses the configured model (upgrade via ORBIT_AI_MODEL for stronger research).
 * Body: { count?: number, focus?: string }
 */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAnyAiProviderAvailable()) {
    return NextResponse.json(
      { error: "No AI provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY." },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { count?: number; focus?: string };
  const count = Math.min(Math.max(body.count ?? 12, 1), 30);

  // Show the model what already exists so it proposes genuinely new angles.
  let existing: string[] = [];
  try {
    const posts = await db
      .select({ title: blogPosts.title })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    const pages = await db
      .select({ keyword: seoLandingPages.keyword })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    existing = [
      ...posts.map((p) => p.title),
      ...pages.map((p) => p.keyword),
    ].slice(0, 120);
  } catch {
    /* db optional */
  }

  const prompt = `${PRODUCT_CONTEXT}

${body.focus ? `Focus area for this batch: ${body.focus}\n` : ""}
Existing content (do NOT repeat these — find fresh, non-overlapping opportunities):
${existing.length ? existing.map((t) => `- ${t}`).join("\n") : "(none yet)"}

Propose ${count} high-traffic, low-competition keyword opportunities that would realistically
rank and send qualified traffic to Svivva's tools and main SaaS. Favor long-tail, intent-rich
queries and topics that connect the mini-apps to the main product.

Return ONLY a JSON array, each item:
{
  "keyword": "the target search query",
  "intent": "informational|commercial|transactional|navigational",
  "difficulty": "low|medium|high",
  "rationale": "why this can rank and convert (1 sentence)",
  "contentType": "blog|seo-landing|comparison",
  "titleSuggestion": "compelling SEO title under 60 chars",
  "outline": ["H2 section 1", "H2 section 2", "H2 section 3", "H2 section 4"]
}`;

  try {
    const ideas = await generateJson<KeywordIdea[]>(prompt, { maxTokens: 3000 });
    const list = Array.isArray(ideas) ? ideas : [];
    return NextResponse.json({
      ok: true,
      model: getMarketingModel(),
      count: list.length,
      ideas: list,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Research failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }
}
