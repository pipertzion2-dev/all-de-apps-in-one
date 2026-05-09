import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { seoKeywords } from "@/lib/schema";
import { eq } from "drizzle-orm";

const VALID_INTENTS = ["high", "medium", "low"];
const VALID_STATUSES = ["planned", "writing", "published"];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [keyword] = await db.select().from(seoKeywords).where(eq(seoKeywords.id, id));

    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(keyword);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch keyword" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.keyword === "string") updates.keyword = body.keyword.trim();
    if (typeof body.searchVolume === "number")
      updates.searchVolume = Math.max(0, Math.round(body.searchVolume));
    if (body.intent && VALID_INTENTS.includes(body.intent)) updates.intent = body.intent;
    if (body.status && VALID_STATUSES.includes(body.status)) updates.status = body.status;
    if (body.assignedPage !== undefined)
      updates.assignedPage = typeof body.assignedPage === "string" ? body.assignedPage : null;
    if (body.assignedArticle !== undefined)
      updates.assignedArticle =
        typeof body.assignedArticle === "string" ? body.assignedArticle : null;
    if (body.notes !== undefined)
      updates.notes = typeof body.notes === "string" ? body.notes : null;

    const [updated] = await db
      .update(seoKeywords)
      .set(updates)
      .where(eq(seoKeywords.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(seoKeywords).where(eq(seoKeywords.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 });
  }
}
