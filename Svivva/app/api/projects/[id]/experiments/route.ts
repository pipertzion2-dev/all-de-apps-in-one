import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { promptExperiments, experimentVariants, projectVersions } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createExperimentSchema = z.object({
  name: z.string().min(1, "Experiment name is required"),
  description: z.string().optional(),
  versionIds: z.array(z.string()).min(2, "At least 2 version IDs required"),
  trafficWeights: z.array(z.number()).optional(),
  autoPromote: z.boolean().default(false),
  minSampleSize: z.number().min(1).default(100),
});

const updateExperimentSchema = z.object({
  experimentId: z.string().min(1, "Experiment ID is required"),
  action: z.enum(["start", "stop", "declare_winner"]),
  winnerVersionId: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const experiments = await db
      .select()
      .from(promptExperiments)
      .where(eq(promptExperiments.projectId, id))
      .orderBy(desc(promptExperiments.createdAt));

    const experimentsWithVariants = await Promise.all(
      experiments.map(async (exp) => {
        const variants = await db
          .select({
            id: experimentVariants.id,
            versionId: experimentVariants.versionId,
            name: experimentVariants.name,
            trafficWeight: experimentVariants.trafficWeight,
            impressions: experimentVariants.impressions,
            conversions: experimentVariants.conversions,
            avgLatencyMs: experimentVariants.avgLatencyMs,
            errorRate: experimentVariants.errorRate,
          })
          .from(experimentVariants)
          .where(eq(experimentVariants.experimentId, exp.id));

        return { ...exp, variants };
      }),
    );

    return NextResponse.json(experimentsWithVariants);
  } catch (error) {
    console.error("Error fetching experiments:", error);
    return NextResponse.json({ error: "Failed to fetch experiments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const parsed = createExperimentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, description, versionIds, trafficWeights, autoPromote, minSampleSize } =
      parsed.data;

    const versions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, id));

    const versionMap = new Map(versions.map((v) => [v.id, v]));
    const invalidVersions = versionIds.filter((vid) => !versionMap.has(vid));

    if (invalidVersions.length > 0) {
      return NextResponse.json({ error: "Invalid version IDs" }, { status: 400 });
    }

    const weights = trafficWeights || versionIds.map(() => Math.floor(100 / versionIds.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    if (totalWeight !== 100) {
      return NextResponse.json({ error: "Traffic weights must sum to 100" }, { status: 400 });
    }

    const [experiment] = await db
      .insert(promptExperiments)
      .values({
        id: nanoid(),
        projectId: id,
        name,
        description: description || null,
        status: "draft",
        autoPromote,
        minSampleSize,
      })
      .returning();

    const variantRecords = await Promise.all(
      versionIds.map(async (versionId, index) => {
        const version = versionMap.get(versionId)!;
        const [variant] = await db
          .insert(experimentVariants)
          .values({
            id: nanoid(),
            experimentId: experiment.id,
            versionId,
            name: `Variant ${String.fromCharCode(65 + index)}`,
            trafficWeight: weights[index],
          })
          .returning();
        return variant;
      }),
    );

    return NextResponse.json({
      ...experiment,
      variants: variantRecords,
    });
  } catch (error) {
    console.error("Error creating experiment:", error);
    return NextResponse.json({ error: "Failed to create experiment" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const parsed = updateExperimentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { experimentId, action, winnerVersionId } = parsed.data;

    const [experiment] = await db
      .select()
      .from(promptExperiments)
      .where(and(eq(promptExperiments.id, experimentId), eq(promptExperiments.projectId, id)));

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (action === "start") {
      if (experiment.status !== "draft") {
        return NextResponse.json({ error: "Can only start draft experiments" }, { status: 400 });
      }
      updateData.status = "running";
      updateData.startedAt = new Date();
    } else if (action === "stop") {
      if (experiment.status !== "running") {
        return NextResponse.json({ error: "Can only stop running experiments" }, { status: 400 });
      }
      updateData.status = "paused";
    } else if (action === "declare_winner") {
      if (!winnerVersionId) {
        return NextResponse.json({ error: "Winner version ID required" }, { status: 400 });
      }
      updateData.status = "completed";
      updateData.winnerVersionId = winnerVersionId;
      updateData.endedAt = new Date();
    }

    const [updated] = await db
      .update(promptExperiments)
      .set(updateData)
      .where(eq(promptExperiments.id, experimentId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating experiment:", error);
    return NextResponse.json({ error: "Failed to update experiment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get("experimentId");

    if (!experimentId) {
      return NextResponse.json({ error: "Experiment ID required" }, { status: 400 });
    }

    await db
      .delete(promptExperiments)
      .where(and(eq(promptExperiments.id, experimentId), eq(promptExperiments.projectId, id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting experiment:", error);
    return NextResponse.json({ error: "Failed to delete experiment" }, { status: 500 });
  }
}
