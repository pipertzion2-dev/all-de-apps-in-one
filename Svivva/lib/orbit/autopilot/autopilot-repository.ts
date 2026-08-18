import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { orbitAutopilotRuns, type OrbitAutopilotRun } from "@/lib/orbit/schema";
import type { AutopilotActionRecord } from "./autopilot-types";

export async function createAutopilotRun(input: {
  orbitProjectId: string;
  userId: string;
  status?: string;
}): Promise<OrbitAutopilotRun> {
  const [row] = await db
    .insert(orbitAutopilotRuns)
    .values({
      orbitProjectId: input.orbitProjectId,
      userId: input.userId,
      status: input.status || "running",
    })
    .returning();
  return row;
}

export async function completeAutopilotRun(
  runId: string,
  input: {
    status: string;
    recommendationsSeen: number;
    recommendationsApplied: number;
    recommendationsSkipped: number;
    actions: AutopilotActionRecord[];
    errorMessage?: string;
  },
): Promise<OrbitAutopilotRun | undefined> {
  const [row] = await db
    .update(orbitAutopilotRuns)
    .set({
      status: input.status,
      recommendationsSeen: input.recommendationsSeen,
      recommendationsApplied: input.recommendationsApplied,
      recommendationsSkipped: input.recommendationsSkipped,
      actions: input.actions,
      errorMessage: input.errorMessage,
      completedAt: new Date(),
    })
    .where(eq(orbitAutopilotRuns.id, runId))
    .returning();
  return row;
}

export async function getLatestAutopilotRun(
  projectId: string,
): Promise<OrbitAutopilotRun | undefined> {
  const [row] = await db
    .select()
    .from(orbitAutopilotRuns)
    .where(eq(orbitAutopilotRuns.orbitProjectId, projectId))
    .orderBy(desc(orbitAutopilotRuns.createdAt))
    .limit(1);
  return row;
}

export async function listAutopilotRuns(
  projectId: string,
  limit = 10,
): Promise<OrbitAutopilotRun[]> {
  return db
    .select()
    .from(orbitAutopilotRuns)
    .where(eq(orbitAutopilotRuns.orbitProjectId, projectId))
    .orderBy(desc(orbitAutopilotRuns.createdAt))
    .limit(limit);
}
