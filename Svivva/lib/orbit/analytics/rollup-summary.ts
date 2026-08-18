import { listEventsForProject, countEventsByType } from "./event-repository";
import { countOpenRecommendations } from "./recommendation-repository";
import { listIndexRecordsForProject } from "../indexing/index-repository";
import type { AnalyticsSummary } from "./event-types";

export async function buildAnalyticsSummary(
  projectId: string,
  opts: { sinceDays?: number } = {},
): Promise<AnalyticsSummary> {
  const sinceDays = opts.sinceDays ?? 30;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const events = await listEventsForProject(projectId, { limit: 5000, since });
  const byEventType = await countEventsByType(projectId, since);

  const bySource: Record<string, number> = {};
  for (const e of events) {
    bySource[e.source] = (bySource[e.source] || 0) + 1;
  }

  const indexRecords = await listIndexRecordsForProject(projectId);
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const stuckSubmitted = indexRecords.filter(
    (r) =>
      r.status === "submitted" &&
      r.submittedAt &&
      new Date(r.submittedAt).getTime() < threeDaysAgo,
  ).length;

  return {
    projectId,
    totalEvents: events.length,
    byEventType,
    bySource,
    distribution: {
      succeeded: byEventType.distribution_succeeded || 0,
      failed: byEventType.distribution_failed || 0,
      manualReady: byEventType.distribution_manual_ready || 0,
    },
    indexing: {
      submitted: byEventType.index_submitted || 0,
      indexed: byEventType.index_indexed || 0,
      failed: byEventType.index_failed || 0,
      stuckSubmitted,
    },
    content: {
      validationPassed: byEventType.content_validation_passed || 0,
      validationFailed: byEventType.content_validation_failed || 0,
    },
    openRecommendations: await countOpenRecommendations(projectId),
  };
}
