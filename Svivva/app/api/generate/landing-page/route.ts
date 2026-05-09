import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { seoLandingPages, seoKeywords } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, slug: providedSlug, keywordId } = body;

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    let slug =
      providedSlug ||
      keyword
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existing = await db
      .select({ id: seoLandingPages.id })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, slug))
      .limit(1);
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert writing landing pages for Svivva, an AI-powered platform that lets users build production-ready AI APIs from natural language prompts. Generate compelling, SEO-optimized landing page content.",
        },
        {
          role: "user",
          content: `Generate a landing page for the keyword: "${keyword}". Return JSON with these fields: title, headline, subheadline, content (2-3 paragraphs about the problem this solves), benefits (array of 3 strings), howItWorks (paragraph), whoItsFor (paragraph), faq (array of {q, a} objects, 4-5 items), metaTitle (under 60 chars), metaDescription (under 160 chars).`,
        },
      ],
    });

    const generated = JSON.parse(completion.choices[0].message.content || "{}");

    let contentWithFaq = generated.content || "";
    if (generated.faq && Array.isArray(generated.faq) && generated.faq.length > 0) {
      contentWithFaq += `\n\n[FAQ_JSON]${JSON.stringify(generated.faq)}[/FAQ_JSON]`;
    }

    const [page] = await db
      .insert(seoLandingPages)
      .values({
        slug,
        keyword,
        title: generated.title,
        headline: generated.headline,
        subheadline: generated.subheadline,
        content: contentWithFaq,
        benefits: generated.benefits || [],
        howItWorks: generated.howItWorks,
        whoItsFor: generated.whoItsFor,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        published: true,
        category: "seo-landing",
      })
      .returning();

    if (keywordId) {
      await db
        .update(seoKeywords)
        .set({ assignedPage: slug, status: "published", updatedAt: new Date() })
        .where(eq(seoKeywords.id, keywordId));
    }

    return NextResponse.json({ ...page, faq: generated.faq }, { status: 201 });
  } catch (error) {
    console.error("Landing page generation error:", error);
    return NextResponse.json({ error: "Failed to generate landing page" }, { status: 500 });
  }
}
