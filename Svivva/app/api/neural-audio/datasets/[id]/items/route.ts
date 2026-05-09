import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audioDatasets, audioDatasetItems } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const items = await db
      .select()
      .from(audioDatasetItems)
      .where(eq(audioDatasetItems.datasetId, id))
      .orderBy(desc(audioDatasetItems.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error listing dataset items:", error);
    return NextResponse.json({ error: "Failed to list dataset items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fileName, durationSec, bpm, key, genre, instrument, mood, tags } = body;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const [dataset] = await db.select().from(audioDatasets).where(eq(audioDatasets.id, id));

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const itemId = uuidv4();

    const [item] = await db
      .insert(audioDatasetItems)
      .values({
        id: itemId,
        datasetId: id,
        fileName,
        durationSec: durationSec || null,
        bpm: bpm || null,
        key: key || null,
        genre: genre || null,
        instrument: instrument || null,
        mood: mood || null,
        tags: tags || null,
        createdAt: new Date(),
      })
      .returning();

    await db
      .update(audioDatasets)
      .set({
        totalItems: sql`${audioDatasets.totalItems} + 1`,
        totalDurationSec: sql`${audioDatasets.totalDurationSec} + ${durationSec || 0}`,
        updatedAt: new Date(),
      })
      .where(eq(audioDatasets.id, id));

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error adding dataset item:", error);
    return NextResponse.json({ error: "Failed to add dataset item" }, { status: 500 });
  }
}
