import { generateRecommendationsForProject } from "./recommendation-engine";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { listDistributionJobsForProject } from "../distribution/distribution-repository";
import { listIndexRecordsForProject } from "../indexing/index-repository";
import { emitDistributionOutcome, emitIndexStatusChange } from "./emit-outcomes";

export type ProcessAnalyticsResult = {
  backfilledEvents: number;
  recommendations: Awaited<ReturnType<typeof generateRecommendationsForProject>>;
};

/** Backfill events from existing jobs/records, then run recommendation engine. */
export async function processProjectAnalytics(
  projectId: string,
  userId: string,
): Promise<ProcessAnalyticsResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  let backfilledEvents = 0;

  const jobs = await listDistributionJobsForProject(projectId);
  for (const job of jobs) {
    if (["succeeded", "failed", "ready_for_manual"].includes(job.status)) {
      await emitDistributionOutcome(job);
      backfilledEvents += 1;
    }
  }

  const indexRecords = await listIndexRecordsForProject(projectId);
  for (const record of indexRecords) {
    if (["submitted", "crawl_detected", "indexed", "failed", "not_indexed"].includes(record.status)) {
      await emitIndexStatusChange(record);
      backfilledEvents += 1;
    }
  }

  const recommendations = await generateRecommendationsForProject(projectId, userId);

  return { backfilledEvents, recommendations };
}
