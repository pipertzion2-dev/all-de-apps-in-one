import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralModels } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    let models;
    if (ownerId) {
      models = await db
        .select()
        .from(neuralModels)
        .where(eq(neuralModels.ownerId, ownerId))
        .orderBy(desc(neuralModels.createdAt));
    } else {
      models = await db.select().from(neuralModels).orderBy(desc(neuralModels.createdAt));
    }

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error listing models:", error);
    return NextResponse.json({ error: "Failed to list models" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, modelType, baseModel, description, params, ownerId } = body;

    if (!name || !modelType) {
      return NextResponse.json({ error: "name and modelType are required" }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date();

    const [model] = await db
      .insert(neuralModels)
      .values({
        id,
        ownerId: ownerId || "anonymous",
        name,
        modelType,
        baseModel: baseModel || null,
        description: description || null,
        params: params || null,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 });
  }
}
