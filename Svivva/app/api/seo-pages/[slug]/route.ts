import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [page] = await db
      .select()
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, slug))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const [updated] = await db
      .update(seoLandingPages)
      .set(body)
      .where(eq(seoLandingPages.slug, slug))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await db.delete(seoLandingPages).where(eq(seoLandingPages.slug, slug));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
