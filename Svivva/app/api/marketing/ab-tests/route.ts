import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingAbTests } from "@/lib/marketing/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const tests = await db.select().from(marketingAbTests).orderBy(desc(marketingAbTests.createdAt));
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch A/B tests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, hypothesis, variants, targetMetric } = body;
    if (!name || !variants || variants.length < 2) {
      return NextResponse.json({ error: "name and at least 2 variants are required" }, { status: 400 });
    }
    const normalizedVariants = variants.map((v: any) => ({
      ...v,
      id: v.id ?? crypto.randomUUID(),
      conversions: 0,
      impressions: 0,
      traffic: v.traffic ?? Math.floor(100 / variants.length),
    }));
    const [test] = await db
      .insert(marketingAbTests)
      .values({ name, description, hypothesis, variants: normalizedVariants, targetMetric: targetMetric ?? "conversion_rate" })
      .returning();
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create A/B test" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, winnerVariant, variants } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const [test] = await db
      .update(marketingAbTests)
      .set({ status, winnerVariant, variants, updatedAt: new Date() })
      .where(eq(marketingAbTests.id, id))
      .returning();
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 });
  }
}
