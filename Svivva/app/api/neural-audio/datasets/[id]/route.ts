import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audioDatasets, audioDatasetItems } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [dataset] = await db
      .select()
      .from(audioDatasets)
      .where(eq(audioDatasets.id, id));

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(audioDatasetItems)
      .where(eq(audioDatasetItems.datasetId, id))
      .orderBy(desc(audioDatasetItems.createdAt));

    return NextResponse.json({ ...dataset, items });
  } catch (error) {
    console.error("Error fetching dataset:", error);
    return NextResponse.json({ error: "Failed to fetch dataset" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(audioDatasets)
      .where(eq(audioDatasets.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(audioDatasets)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(audioDatasets.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating dataset:", error);
    return NextResponse.json({ error: "Failed to update dataset" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(audioDatasets)
      .where(eq(audioDatasets.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    await db.delete(audioDatasets).where(eq(audioDatasets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    return NextResponse.json({ error: "Failed to delete dataset" }, { status: 500 });
  }
}
