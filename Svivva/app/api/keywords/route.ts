import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { seoKeywords } from "@/lib/schema";
import { desc } from "drizzle-orm";

const VALID_INTENTS = ["high", "medium", "low"];
const VALID_STATUSES = ["planned", "writing", "published"];

export async function GET() {
  try {
    const keywords = await db.select().from(seoKeywords).orderBy(desc(seoKeywords.createdAt));

    return NextResponse.json(keywords);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.keyword || typeof body.keyword !== "string" || !body.keyword.trim()) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const values = {
      keyword: body.keyword.trim(),
      searchVolume:
        typeof body.searchVolume === "number" ? Math.max(0, Math.round(body.searchVolume)) : 0,
      intent: VALID_INTENTS.includes(body.intent) ? body.intent : "medium",
      status: VALID_STATUSES.includes(body.status) ? body.status : "planned",
      assignedPage: typeof body.assignedPage === "string" ? body.assignedPage : null,
      assignedArticle: typeof body.assignedArticle === "string" ? body.assignedArticle : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    };

    const [keyword] = await db.insert(seoKeywords).values(values).returning();
    return NextResponse.json(keyword, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 });
  }
}
