import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { blogPosts } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");

    const conditions = [eq(blogPosts.published, true)];
    if (category && category !== "all") {
      conditions.push(eq(blogPosts.category, category));
    }

    const posts = await db
      .select()
      .from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));

    const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [post] = await db.insert(blogPosts).values(body).returning();
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
