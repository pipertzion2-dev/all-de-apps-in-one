import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { seoLandingPages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let pages;
    if (category && category !== "all") {
      pages = await db
        .select()
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, category))
        .orderBy(desc(seoLandingPages.createdAt));
    } else {
      pages = await db
        .select()
        .from(seoLandingPages)
        .orderBy(desc(seoLandingPages.createdAt));
    }

    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [page] = await db.insert(seoLandingPages).values(body).returning();
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
