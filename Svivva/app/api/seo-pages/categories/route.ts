import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { pageCategories } from "@/lib/schema";

export async function GET() {
  try {
    const categories = await db.select().from(pageCategories);
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [category] = await db.insert(pageCategories).values(body).returning();
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
