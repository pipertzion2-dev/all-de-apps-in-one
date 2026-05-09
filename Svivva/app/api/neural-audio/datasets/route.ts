import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audioDatasets } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    let datasets;
    if (ownerId) {
      datasets = await db
        .select()
        .from(audioDatasets)
        .where(eq(audioDatasets.ownerId, ownerId))
        .orderBy(desc(audioDatasets.createdAt));
    } else {
      datasets = await db.select().from(audioDatasets).orderBy(desc(audioDatasets.createdAt));
    }

    return NextResponse.json(datasets);
  } catch (error) {
    console.error("Error listing datasets:", error);
    return NextResponse.json({ error: "Failed to list datasets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, genre, ownerId } = body;

    if (!name || !description || !genre) {
      return NextResponse.json(
        { error: "name, description, and genre are required" },
        { status: 400 },
      );
    }

    const id = uuidv4();
    const now = new Date();

    const [dataset] = await db
      .insert(audioDatasets)
      .values({
        id,
        ownerId: ownerId || "anonymous",
        name,
        description,
        genre,
        status: "draft",
        totalItems: 0,
        totalDurationSec: 0,
        validationStatus: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(dataset, { status: 201 });
  } catch (error) {
    console.error("Error creating dataset:", error);
    return NextResponse.json({ error: "Failed to create dataset" }, { status: 500 });
  }
}
