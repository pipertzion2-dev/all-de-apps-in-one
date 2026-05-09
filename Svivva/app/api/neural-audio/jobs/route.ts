import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralTrainingJobs } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    let jobs;
    if (ownerId) {
      jobs = await db
        .select()
        .from(neuralTrainingJobs)
        .where(eq(neuralTrainingJobs.ownerId, ownerId))
        .orderBy(desc(neuralTrainingJobs.createdAt));
    } else {
      jobs = await db.select().from(neuralTrainingJobs).orderBy(desc(neuralTrainingJobs.createdAt));
    }

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error listing jobs:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, datasetId, ownerId, epochs, learningRate, batchSize } = body;

    if (!modelId || !datasetId || !ownerId) {
      return NextResponse.json(
        { error: "modelId, datasetId, and ownerId are required" },
        { status: 400 },
      );
    }

    const id = uuidv4();

    const [job] = await db
      .insert(neuralTrainingJobs)
      .values({
        id,
        modelId,
        datasetId,
        ownerId,
        status: "queued",
        progress: 0,
        epochs: epochs || 100,
        learningRate: learningRate || "0.0001",
        batchSize: batchSize || 8,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
