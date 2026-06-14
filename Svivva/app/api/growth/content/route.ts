import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { growthContent } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type ProductKey = "svivva" | "clutety" | "clutter" | "mini_apps";

type ProductInfo = {
  name: string;
  tagline: string;
  url: string;
  description: string;
  audience: string;
  competitors: string[];
  keywords: string[];
};

function getProducts(): Record<ProductKey, ProductInfo> {
  const base = getSiteUrl();
  return {
    svivva: {
      name: "Svivva",
      tagline: "From seed to symphony",
      url: base,
      description:
        "From seed to symphony — Svivva is one workspace for teams to describe intent, ship with guardrails, and grow without babysitting infrastructure.",
      audience: "developers, entrepreneurs, SaaS builders, non-technical founders",
      competitors: ["Zapier", "Make (Integromat)", "Bubble", "n8n", "Retool", "Langchain"],
      keywords: [
        "AI backend builder",
        "no-code AI",
        "GPT API wrapper",
        "AI automation",
        "build AI product",
      ],
    },
    clutety: {
      name: "Clutety",
      tagline: "Feed filtering & protection — embedded in Svivva",
      url: `${base}/clutety`,
      description:
        "Clutety blocks unwanted content on YouTube and other social feeds, using the Pyracrypt-grade UI embedded in Svivva. Same platform, same domain.",
      audience: "parents, creators, privacy-conscious users, mobile-first users",
      competitors: ["YouTube Kids", "BlockSite", "Freedom", "Screen Time"],
      keywords: [
        "block youtube content",
        "feed filter app",
        "social media blocker",
        "parental feed controls",
        "clutety svivva",
      ],
    },
    clutter: {
      name: "Clutety",
      tagline: "Feed filtering & protection — embedded in Svivva",
      url: `${base}/clutety`,
      description:
        "Clutety blocks unwanted content on feeds (YouTube, etc.) — embedded in Svivva with the Pyracrypt UI.",
      audience: "parents, creators, privacy-conscious users",
      competitors: ["YouTube Kids", "BlockSite", "Freedom"],
      keywords: ["feed filter", "block youtube", "clutety"],
    },
    mini_apps: {
      name: "Svivva Mini Apps",
      tagline: "50+ free AI micro-tools built on the Svivva platform",
      url: `${base}/tools`,
      description:
        "A growing collection of free AI-powered micro-tools for specific use cases — each built in minutes using Svivva's AI API builder.",
      audience: "general public, people searching for free AI tools",
      competitors: ["Free AI tools on various websites", "ChatGPT free tier"],
      keywords: ["free AI tools", "AI micro tools", "AI generator", "free AI app"],
    },
  };
}

const CONTENT_PROMPTS: Record<string, (p: ProductInfo) => string> = {
  tweet_thread: (p) => `Write a compelling Twitter/X thread (8-10 tweets) about ${p.name}. 
Product: ${p.description}
Target audience: ${p.audience}
URL: ${p.url}

Rules:
- Start with a hook that stops the scroll (bold claim or surprising fact)
- Each tweet max 280 chars, numbered (1/8, 2/8, etc.)
- Include specific benefits, not vague claims
- End with a clear CTA to visit ${p.url}
- Use line breaks for readability
- Include 2-3 relevant hashtags in the last tweet only

Format: Return ONLY the tweets, one per line, numbered.`,

  reddit_post: (p) => `Write a genuine, non-spammy Reddit post introducing ${p.name}.
Product: ${p.description}
Target audience: ${p.audience}
URL: ${p.url}

Rules:
- Write as a builder sharing their work (not marketing copy)
- Include the story/struggle that led to building it
- Be specific about what it does and what problem it solves
- Acknowledge limitations honestly (builds trust)
- Include a question to spark discussion
- Suggest subreddits in a comment: ${p.audience.includes("developer") ? "r/SaaS, r/webdev, r/artificial" : "r/privacy, r/artificial, r/tools"}
- Keep under 400 words

Format: Return Title on first line, then blank line, then body.`,

  linkedin_post: (p) => `Write a LinkedIn post introducing ${p.name} for professional reach.
Product: ${p.description}
Target audience: ${p.audience}
URL: ${p.url}

Rules:
- Professional but personal tone
- Start with a 1-2 line hook (no "I'm excited to announce...")
- Include a mini story or insight about the problem it solves
- Use short paragraphs (1-3 lines each) for mobile readability
- End with a genuine question to drive comments
- Include 5 relevant hashtags
- 200-300 words max`,

  producthunt_copy: (p) => `Write a complete Product Hunt launch kit for ${p.name}.
Product: ${p.description}
URL: ${p.url}

Provide ALL of these, clearly labeled:
1. TAGLINE (60 chars max, punchy, specific)
2. DESCRIPTION (260 chars, what it does + key benefit)
3. FIRST COMMENT (400 words — personal story, what you built, who it's for, what makes it different, early access offer)
4. TOPICS (5 relevant PH topics to select)
5. HUNTER NOTE (what to say when asking people to support you)`,

  blog_outline: (
    p,
  ) => `Create a detailed SEO blog post outline for ${p.name} targeting high-intent keywords.
Product: ${p.description}
Keywords to target: ${p.keywords.join(", ")}
Competitors: ${p.competitors.join(", ")}

Provide:
1. TITLE (with primary keyword, under 60 chars)
2. META DESCRIPTION (155 chars)
3. OUTLINE with H2/H3 headers
4. KEY POINTS for each section (2-3 bullets)
5. INTERNAL LINK SUGGESTIONS
6. CALL TO ACTION for end of post

Make it genuinely useful content, not just promotional. 1500-2000 word target.`,

  press_release: (p) => `Write a professional press release for ${p.name} launch/milestone.
Product: ${p.description}
URL: ${p.url}

Format as a proper press release:
- HEADLINE (newsy, specific, not hype)
- SUBHEADLINE
- DATELINE (City, Date)
- BODY: Lead paragraph (who, what, when, where, why), 2-3 body paragraphs with quotes from "founder", boilerplate about the company
- CONTACT INFO placeholder
- ### end marker

Keep it factual, newsworthy. Avoid superlatives. 400-500 words.`,

  aeo_content: (p) => `Create Answer Engine Optimization (AEO) content for ${p.name}.
This content is specifically formatted to be cited by AI search engines (Perplexity, ChatGPT, Gemini, Claude) when users ask related questions.

Product: ${p.description}
Keywords: ${p.keywords.join(", ")}

Create:
1. FAQ SECTION (10 questions users ask + comprehensive answers, each 50-150 words)
   - Include exact question phrases people search
   - Each answer should be self-contained and factual
   - Format: Q: ... A: ...

2. DEFINITION BLURB (2-3 sentences defining the category/product for AI to cite)

3. COMPARISON SNIPPET (vs top 3 competitors, factual, structured)

4. HOW-IT-WORKS (numbered steps, clear and concise)

Note: This content goes in FAQ sections or dedicated knowledge pages on the website.`,

  competitor_comparison: (
    p,
  ) => `Write SEO-optimized comparison content for "${p.name} vs competitors".
Product: ${p.description}
Competitors: ${p.competitors.join(", ")}

Create comparison content for the TOP 3 competitors:
For each competitor, write a complete comparison page outline:
1. PAGE TITLE (e.g., "Svivva vs Zapier: Which is Better for Shipping AI Features in 2026?")
2. SUMMARY (2-3 sentence verdict)
3. COMPARISON TABLE (5-7 features, who wins each)
4. WHEN TO CHOOSE ${p.name.toUpperCase()} (3-4 specific use cases)
5. WHEN TO CHOOSE COMPETITOR (be honest — builds trust)
6. FINAL VERDICT

Make it balanced and genuinely useful. Users searching "[competitor] alternative" should find this helpful.`,

  podcast_pitch: (p) => `Write 3 personalized podcast pitch emails for ${p.name}.
Product: ${p.description}
Founder: "Zion Piper, founder of ${p.name}"
URL: ${p.url}

Create pitches for these podcast types:
1. AI/TECH PODCAST (e.g., Lex Fridman, TWIML, Practical AI)
2. ENTREPRENEUR/STARTUP PODCAST (e.g., How I Built This, Indie Hackers)
3. DEVELOPER PODCAST (e.g., Syntax.fm, Software Engineering Daily)

For each pitch:
- Subject line (compelling, personal, specific)
- 3-paragraph body: Hook about the topic, why it's relevant to THEIR audience, what you bring
- Keep under 200 words
- Sound human, not like a template`,

  github_seo: (p) => `Create GitHub-optimized content to drive traffic to ${p.name}.
Product: ${p.description}
URL: ${p.url}

Create:
1. AWESOME LIST ENTRY (format for awesome-lists — name, description, category suggestion)

2. GITHUB GIST CONTENT — A useful code snippet/tutorial that:
   - Solves a real developer problem related to ${p.keywords[0]}
   - Naturally mentions ${p.name} as the tool used
   - Is genuinely helpful (not just an ad)
   - Includes a "Built with" line linking to ${p.url}

3. GITHUB REPO DESCRIPTION — If you created an open-source companion tool:
   - Name, description, README intro, topics/tags to add

Developer searches on GitHub drive significant traffic back to linked tools.`,

  email_newsletter: (p) => `Write a weekly email newsletter for ${p.name} users and subscribers.
Product: ${p.description}

Create a complete newsletter:
SUBJECT LINE (A/B test — provide 2 options)
PREVIEW TEXT (90 chars)

BODY:
- Opener (1-2 paragraphs — personal, conversational)
- FEATURE HIGHLIGHT (what's new or notable this week)
- TIP OF THE WEEK (actionable advice related to the product category)
- USE CASE SPOTLIGHT (mini case study or creative way someone might use the product)
- CTA (soft, helpful)
- SIGN-OFF

Keep the whole thing under 500 words. Write like a founder talking to early users, not a marketing department.`,
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { product, contentType } = await req.json();

  const productData = getProducts()[product as ProductKey];
  if (!productData) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  const promptFn = CONTENT_PROMPTS[contentType];
  if (!promptFn) return NextResponse.json({ error: "Invalid content type" }, { status: 400 });

  const prompt = promptFn(productData);

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an expert growth marketer and copywriter specializing in SaaS, AI tools, and developer products. Write content that is genuine, specific, and actually useful — not generic marketing fluff. Every piece of content should feel like it was written by the actual founder who deeply understands the product and its users.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  const content = completion.choices[0].message.content || "";
  const titles: Record<string, string> = {
    tweet_thread: "Twitter/X Thread",
    reddit_post: "Reddit Post",
    linkedin_post: "LinkedIn Post",
    producthunt_copy: "Product Hunt Launch Kit",
    blog_outline: "Blog Post Outline",
    press_release: "Press Release",
    aeo_content: "AEO Content (AI Search)",
    competitor_comparison: "Competitor Comparison Pages",
    podcast_pitch: "Podcast Pitch Emails",
    github_seo: "GitHub SEO Content",
    email_newsletter: "Email Newsletter",
  };

  await db
    .insert(growthContent)
    .values({ product, contentType, title: titles[contentType] || contentType, content });

  return NextResponse.json({ content, title: titles[contentType] || contentType });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!(await hasAdminAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const product = req.nextUrl.searchParams.get("product");
  const rows = await db
    .select()
    .from(growthContent)
    .where(product ? eq(growthContent.product, product) : undefined)
    .orderBy(desc(growthContent.createdAt))
    .limit(50);

  return NextResponse.json({ items: rows });
}
