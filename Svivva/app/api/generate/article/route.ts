import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { blogPosts, seoKeywords } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, keywordId } = body;

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const keywordTag = keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an SEO content writer for Svivva, an AI-powered platform for building production-ready APIs from prompts. Write comprehensive, helpful blog articles that rank well on Google.",
        },
        {
          role: "user",
          content: `Write a full blog article for the keyword: "${keyword}". Return JSON with these fields: title, slug (url-friendly), excerpt (1-2 sentences), content (full markdown article with: introduction, step-by-step guide with ## headings, practical examples, a section on how Svivva solves the problem, and a CTA paragraph), metaTitle, metaDescription.`,
        },
      ],
    });

    const generated = JSON.parse(completion.choices[0].message.content || "{}");

    const [post] = await db.insert(blogPosts).values({
      slug: generated.slug,
      title: generated.title,
      excerpt: generated.excerpt,
      content: generated.content,
      author: "Svivva Team",
      category: "guides",
      tags: ["ai", keywordTag],
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      published: true,
      publishedAt: new Date(),
    }).returning();

    if (keywordId) {
      await db
        .update(seoKeywords)
        .set({ assignedArticle: generated.slug, status: "published", updatedAt: new Date() })
        .where(eq(seoKeywords.id, keywordId));
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Article generation error:", error);
    return NextResponse.json({ error: "Failed to generate article" }, { status: 500 });
  }
}
