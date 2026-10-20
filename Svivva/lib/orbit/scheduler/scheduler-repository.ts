import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { orbitSchedulerRuns, type OrbitSchedulerRun } from "@/lib/orbit/schema";
import type { SchedulerProjectResult } from "./scheduler-types";

export async function createSchedulerRun(): Promise<OrbitSchedulerRun> {
  const [row] = await db
    .insert(orbitSchedulerRuns)
    .values({ status: "running" })
    .returning();
  return row;
}

export async function completeSchedulerRun(
  runId: string,
  input: {
    status: string;
    projectsSeen: number;
    projectsProcessed: number;
    indexRecheck: Record<string, unknown>;
    distribution: Record<string, unknown>;
    projectResults: SchedulerProjectResult[];
    errorMessage?: string;
  },
): Promise<OrbitSchedulerRun | undefined> {
  const [row] = await db
    .update(orbitSchedulerRuns)
    .set({
      status: input.status,
      projectsSeen: input.projectsSeen,
      projectsProcessed: input.projectsProcessed,
      indexRecheck: input.indexRecheck,
      distribution: input.distribution,
      projectResults: input.projectResults,
      errorMessage: input.errorMessage,
      completedAt: new Date(),
    })
    .where(eq(orbitSchedulerRuns.id, runId))
    .returning();
  return row;
}

export async function getLatestSchedulerRun(): Promise<OrbitSchedulerRun | undefined> {
  const [row] = await db
    .select()
    .from(orbitSchedulerRuns)
    .orderBy(desc(orbitSchedulerRuns.createdAt))
    .limit(1);
  return row;
}
