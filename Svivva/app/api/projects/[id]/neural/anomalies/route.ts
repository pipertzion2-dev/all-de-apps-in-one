import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neuralAnomalies, usageLogs } from "@/lib/schema";
import { projectRepository } from "@/lib/repositories";
import { detectAnomalies } from "@/lib/llm/neural";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const anomalies = await db
      .select()
      .from(neuralAnomalies)
      .where(eq(neuralAnomalies.projectId, id))
      .orderBy(desc(neuralAnomalies.createdAt))
      .limit(20);
    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    return NextResponse.json({ error: "Failed to fetch anomalies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { failures: manualFailures } = body;

    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let failureRecords = manualFailures || [];

    if (failureRecords.length === 0) {
      const logs = await db
        .select()
        .from(usageLogs)
        .where(and(eq(usageLogs.projectId, id), eq(usageLogs.status, "error")))
        .orderBy(desc(usageLogs.createdAt))
        .limit(50);

      failureRecords = logs.map((log) => ({
        input: (log.input as string) || "",
        error: (log.error as string) || "",
        output: log.output as Record<string, unknown> | undefined,
        latencyMs: log.latencyMs,
        timestamp: log.createdAt?.toISOString(),
      }));
    }

    if (failureRecords.length === 0) {
      return NextResponse.json({
        anomalies: [],
        summary: "No failure records found to analyze. Your API is running cleanly.",
      });
    }

    const result = await detectAnomalies(failureRecords, project.systemPrompt, project.name);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Detection failed" }, { status: 422 });
    }

    const insertedAnomalies = [];
    for (const anomaly of result.anomalies || []) {
      const anomalyId = uuidv4();
      const [inserted] = await db
        .insert(neuralAnomalies)
        .values({
          id: anomalyId,
          projectId: id,
          signalType: anomaly.signalType,
          severity: anomaly.severity,
          title: anomaly.title,
          description: anomaly.description,
          pattern: anomaly.pattern,
          recommendations: anomaly.recommendations,
        })
        .returning();
      insertedAnomalies.push(inserted);
    }

    return NextResponse.json(
      {
        anomalies: insertedAnomalies,
        summary: result.summary,
        analyzedCount: failureRecords.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return NextResponse.json({ error: "Failed to detect anomalies" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { anomalyId, resolved } = body;

    if (!anomalyId) {
      return NextResponse.json({ error: "anomalyId is required" }, { status: 400 });
    }

    await db
      .update(neuralAnomalies)
      .set({ resolved: resolved ?? true })
      .where(eq(neuralAnomalies.id, anomalyId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating anomaly:", error);
    return NextResponse.json({ error: "Failed to update anomaly" }, { status: 500 });
  }
}
