import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { fineTuneJobs, fineTuneDeployments, trainingExamples, projectVersions } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createFineTuneSchema = z.object({
  name: z.string().min(1, "Job name is required"),
  baseModel: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]).default("gpt-4o-mini"),
  epochs: z.number().min(1).max(10).default(3),
});

const updateFineTuneSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  action: z.enum(["cancel", "deploy", "undeploy"]),
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

    const jobs = await db
      .select()
      .from(fineTuneJobs)
      .where(eq(fineTuneJobs.projectId, id))
      .orderBy(desc(fineTuneJobs.createdAt));

    const jobsWithDeployments = await Promise.all(
      jobs.map(async (job) => {
        const deployments = await db
          .select()
          .from(fineTuneDeployments)
          .where(eq(fineTuneDeployments.jobId, job.id));
        return { ...job, deployments };
      })
    );

    const trainingCount = await db
      .select()
      .from(trainingExamples)
      .innerJoin(projectVersions, eq(trainingExamples.versionId, projectVersions.id))
      .where(eq(projectVersions.projectId, id));

    return NextResponse.json({
      jobs: jobsWithDeployments,
      trainingExamplesCount: trainingCount.length,
      minRequiredExamples: 10,
    });
  } catch (error) {
    console.error("Error fetching fine-tune jobs:", error);
    return NextResponse.json({ error: "Failed to fetch fine-tune jobs" }, { status: 500 });
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
    const parsed = createFineTuneSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, baseModel, epochs } = parsed.data;

    const examplesResult = await db
      .select({ trainingExamples })
      .from(trainingExamples)
      .innerJoin(projectVersions, eq(trainingExamples.versionId, projectVersions.id))
      .where(eq(projectVersions.projectId, id));
    const examples = examplesResult.map(r => r.trainingExamples);

    if (examples.length < 10) {
      return NextResponse.json(
        { error: `Need at least 10 training examples. You have ${examples.length}.` },
        { status: 400 }
      );
    }

    const estimatedCost = Math.round(examples.length * 0.008 * epochs * 100);

    const [job] = await db
      .insert(fineTuneJobs)
      .values({
        id: nanoid(),
        projectId: id,
        userId: user.id,
        name,
        baseModel,
        status: "pending",
        epochs,
        estimatedCost,
      })
      .returning();

    return NextResponse.json({
      ...job,
      trainingExamplesCount: examples.length,
      message: "Fine-tune job created. It will start processing shortly.",
    });
  } catch (error) {
    console.error("Error creating fine-tune job:", error);
    return NextResponse.json({ error: "Failed to create fine-tune job" }, { status: 500 });
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
    const parsed = updateFineTuneSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { jobId, action } = parsed.data;

    const [job] = await db
      .select()
      .from(fineTuneJobs)
      .where(
        and(
          eq(fineTuneJobs.id, jobId),
          eq(fineTuneJobs.projectId, id)
        )
      );

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (!["pending", "running"].includes(job.status)) {
        return NextResponse.json({ error: "Can only cancel pending or running jobs" }, { status: 400 });
      }
      
      const [updated] = await db
        .update(fineTuneJobs)
        .set({ status: "cancelled" })
        .where(eq(fineTuneJobs.id, jobId))
        .returning();
      
      return NextResponse.json(updated);
    }

    if (action === "deploy") {
      if (job.status !== "completed" || !job.fineTunedModel) {
        return NextResponse.json({ error: "Job must be completed with a model" }, { status: 400 });
      }

      await db
        .update(fineTuneDeployments)
        .set({ isActive: false })
        .where(eq(fineTuneDeployments.projectId, id));

      const [deployment] = await db
        .insert(fineTuneDeployments)
        .values({
          id: nanoid(),
          jobId,
          projectId: id,
          isActive: true,
        })
        .returning();

      return NextResponse.json(deployment);
    }

    if (action === "undeploy") {
      await db
        .update(fineTuneDeployments)
        .set({ isActive: false })
        .where(
          and(
            eq(fineTuneDeployments.jobId, jobId),
            eq(fineTuneDeployments.projectId, id)
          )
        );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating fine-tune job:", error);
    return NextResponse.json({ error: "Failed to update fine-tune job" }, { status: 500 });
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
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    await db.delete(fineTuneJobs).where(
      and(
        eq(fineTuneJobs.id, jobId),
        eq(fineTuneJobs.projectId, id)
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fine-tune job:", error);
    return NextResponse.json({ error: "Failed to delete fine-tune job" }, { status: 500 });
  }
}
