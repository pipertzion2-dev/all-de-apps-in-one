import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";

const requestSchema = z.object({
  action: z.enum(["marketing-plan", "landing-page", "social-posts"]),
  appName: z.string().min(1).max(200),
  appDescription: z.string().min(1).max(2000),
  targetAudience: z.string().max(500).optional().default(""),
});

function safeParse(raw: string | null | undefined, fallback: Record<string, unknown> = {}) {
  try {
    return JSON.parse(raw || "{}") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { action, appName, appDescription, targetAudience } = parsed.data;

    if (action === "marketing-plan") {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert app marketing strategist. Generate actionable marketing plans for indie developers and small teams launching apps. Be specific, creative, and practical.",
          },
          {
            role: "user",
            content: `Create a marketing launch plan for this app:
Name: ${appName}
Description: ${appDescription}
Target Audience: ${targetAudience || "General users"}

Return JSON: {
  "tagline": "catchy one-liner for the app",
  "valueProps": ["3 key value propositions"],
  "channels": [{ "name": "channel name", "strategy": "specific strategy", "priority": "high|medium|low" }],
  "launchChecklist": ["ordered list of 8-10 launch steps"],
  "contentIdeas": [{ "type": "blog|social|video|email", "title": "content title", "description": "brief description" }],
  "miniAppIdeas": [{ "name": "mini app name", "description": "what it does", "purpose": "how it helps market the main app" }]
}`,
          },
        ],
      });

      const raw = safeParse(completion.choices[0].message.content);
      const plan = {
        tagline: raw.tagline || "",
        valueProps: Array.isArray(raw.valueProps) ? raw.valueProps : [],
        channels: Array.isArray(raw.channels) ? raw.channels : [],
        launchChecklist: Array.isArray(raw.launchChecklist) ? raw.launchChecklist : [],
        contentIdeas: Array.isArray(raw.contentIdeas) ? raw.contentIdeas : [],
        miniAppIdeas: Array.isArray(raw.miniAppIdeas) ? raw.miniAppIdeas : [],
      };
      return NextResponse.json({ plan });
    }

    if (action === "landing-page") {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a landing page copywriter. Generate complete, conversion-optimized landing page content. Write real copy, not placeholder text.",
          },
          {
            role: "user",
            content: `Generate landing page content for:
App: ${appName}
Description: ${appDescription}
Audience: ${targetAudience || "General users"}

Return JSON: {
  "heroHeadline": "main headline",
  "heroSubheadline": "supporting text",
  "ctaText": "call to action button text",
  "features": [{ "title": "feature", "description": "brief desc", "icon": "emoji" }],
  "socialProofHeadline": "trust section headline",
  "testimonials": [{ "quote": "fictional but realistic quote", "author": "Name", "role": "Title" }],
  "faqItems": [{ "question": "q", "answer": "a" }],
  "footerCta": "final call to action text"
}`,
          },
        ],
      });

      const raw = safeParse(completion.choices[0].message.content);
      const page = {
        heroHeadline: raw.heroHeadline || appName,
        heroSubheadline: raw.heroSubheadline || "",
        ctaText: raw.ctaText || "Get Started",
        features: Array.isArray(raw.features) ? raw.features : [],
        socialProofHeadline: raw.socialProofHeadline || "",
        testimonials: Array.isArray(raw.testimonials) ? raw.testimonials : [],
        faqItems: Array.isArray(raw.faqItems) ? raw.faqItems : [],
        footerCta: raw.footerCta || "",
      };
      return NextResponse.json({ page });
    }

    if (action === "social-posts") {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a social media expert. Generate engaging, platform-specific posts that drive awareness and signups. Write in an authentic, non-corporate voice.",
          },
          {
            role: "user",
            content: `Generate social media launch posts for:
App: ${appName}
Description: ${appDescription}
Audience: ${targetAudience || "General users"}

Return JSON: {
  "posts": [
    { "platform": "twitter", "content": "tweet text (max 280 chars)", "hashtags": ["tag1"] },
    { "platform": "twitter", "content": "thread opener tweet", "hashtags": ["tag1"] },
    { "platform": "linkedin", "content": "linkedin post (2-3 paragraphs)", "hashtags": ["tag1"] },
    { "platform": "reddit", "title": "post title", "content": "post body for r/SideProject or similar", "subreddit": "suggested subreddit" },
    { "platform": "producthunt", "tagline": "short tagline", "content": "product hunt description" }
  ]
}`,
          },
        ],
      });

      const raw = safeParse(completion.choices[0].message.content);
      const posts = Array.isArray(raw.posts) ? raw.posts : [];
      return NextResponse.json({ posts });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("launch-studio error:", e);
    return NextResponse.json({ error: "An internal error occurred. Please try again." }, { status: 500 });
  }
}
