import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/access";
import { getSvivvaProductProfile } from "@/lib/orbit/product-profile";
import { getPublicSiteUrl } from "@/lib/site-url-public";
import { generateText } from "@/lib/orbit/ai-client";

const PROMPTS: Record<string, (p: ReturnType<typeof getSvivvaProductProfile>, site: string) => string> = {
  "showhn": (p) =>
    `Write a Show HN post for ${p.name} — "${p.tagline}". Format: title then body (3-5 paragraphs). Be direct, honest, and founder-to-founder. Explain what it does, the problem it solves, how it was built, and invite feedback. No hype. Max 400 words.`,

  "producthunt": (p) =>
    `Write a Product Hunt launch for ${p.name}.
Output exactly:
TAGLINE: (max 60 chars, punchy benefit-led)
DESCRIPTION: (200-300 words, benefits-first, 3 short paragraphs)
FIRST_COMMENT: (friendly founder intro, 80-100 words)`,

  "indiehackers": (p) =>
    `Write an Indie Hackers product page pitch for ${p.name} — "${p.tagline}".
Include: what it does, who it's for, how it makes money, the story behind it. Tone: honest, builder-to-builder. 200-250 words.`,

  "newsletter-pitch": (p) =>
    `Write 3 short cold-pitch emails to AI newsletter editors (TLDR AI, Ben's Bites, The Rundown AI) for ${p.name}.
Each email: 3-4 sentences max, subject line + body. Personalise to each publication's style. Mention: ${p.shortDescription}. Include site URL: ${p.url}`,

  "podcast-pitch": (p) =>
    `Write 2 podcast pitch emails for ${p.name} targeting AI/startup podcasts.
Format: subject line + 4-sentence body. Pitch angle: founder story + product. Site: ${p.url}. Keep it personal and specific.`,

  "devto-article": (p) =>
    `Write a Dev.to technical article for ${p.name}.
Title: "How I Built a Production AI API in 10 Minutes with ${p.name}"
Length: ~600 words. Structure: intro → problem → solution → code example (pseudocode ok) → results → CTA. Tone: practical, dev-focused.`,

  "hashnode-article": (p) =>
    `Write a Hashnode article for ${p.name}.
Title: "${p.tagline}"
700 words. Structure: hook → problem → how ${p.name} solves it → quick start → conclusion with CTA. Audience: developers and technical founders.`,

  "medium-article": (p) =>
    `Write a Medium article for ${p.name}.
Title: "Stop Writing Boilerplate: ${p.tagline}"
600 words. Narrative style. Audience: founders and technical PMs. End with a link to ${p.url}.`,

  "twitter-thread": (p) =>
    `Write a Twitter/X launch thread for ${p.name} (10 tweets).
Tweet 1: Hook. Tweet 2-8: One insight/feature per tweet. Tweet 9: Social proof or story. Tweet 10: CTA with link ${p.url}.
Format each tweet as: [1/10] text`,

  "reddit-post": (p) =>
    `Write a Reddit post for r/SideProject announcing ${p.name}.
Title + post body (200 words max). Honest, not salesy. Mention what it does, how you built it, what feedback you want. Include ${p.url}.`,

  "directory-listing": (p) =>
    `Write a tool directory listing for ${p.name}.
Output:
NAME: ${p.name}
TAGLINE: (max 60 chars)
SHORT_DESCRIPTION: (150 chars max)
LONG_DESCRIPTION: (300 words, benefits-first, ends with URL ${p.url})
CATEGORY: ${p.category}
KEYWORDS: (10 comma-separated)`,

  "gsc-sitemap": (_p, site) =>
    `Provide step-by-step instructions to submit a sitemap in Google Search Console for ${site}/sitemap.xml. Include: where to find the Sitemaps section, exact steps, and what success looks like. Keep it under 150 words.`,

  "gsc-indexing": (_p, site) =>
    `List the 10 most important pages on ${site} to request Google indexing for in Google Search Console, with a brief reason for each. Format as a numbered list.`,

  "schema-jsonld": (p, site) =>
    `Generate a complete Schema.org JSON-LD script tag for ${p.name} (${site}). Include: SoftwareApplication, Organization, WebSite schemas. Use real data from the product profile. Output only the <script type="application/ld+json">...</script> block.`,

  "welcome-email": (p) =>
    `Write a welcome email for new ${p.name} subscribers.
Subject line + 3-paragraph body. Warm, personal, founder voice. Explain what they'll receive, what ${p.name} does, and how to get started. End with a CTA. 150 words max.`,

  "press-release": (p, site) =>
    `Write a press release for the launch of ${p.name}.
Format: headline, dateline, intro paragraph, 2 body paragraphs, quote from founder, boilerplate, contact info.
Headline: "${p.name} Launches ${p.tagline}"
Site: ${site}. 350-400 words. Newswire style.`,

  "powered-by-badge": (p, site) =>
    `Generate HTML + CSS for a small "Powered by ${p.name}" badge widget to embed in other apps.
Requirements: dark + light mode, links to ${site}, small (max 160px wide), looks professional.
Output the full self-contained HTML snippet.`,
};

export async function GET(request: NextRequest) {
  const allowed = await isOrbitAdminAllowed();
  if (!allowed) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const type = request.nextUrl.searchParams.get("type");
  if (!type) return NextResponse.json({ error: "Missing type param" }, { status: 400 });

  const promptFn = PROMPTS[type];
  if (!promptFn) return NextResponse.json({ error: `Unknown task type: ${type}` }, { status: 400 });

  const profile = getSvivvaProductProfile();
  const siteUrl = getPublicSiteUrl();
  const prompt = promptFn(profile, siteUrl);

  try {
    const content = await generateText(prompt, { maxTokens: 800 });
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-task-content error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
