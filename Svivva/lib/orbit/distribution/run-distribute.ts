import {
  getOrbitContentAssetById,
  updateContentAssetPublishStatus,
} from "@/lib/orbit/content/content-repository";
import type { ProcessDistributionInput, ProcessDistributionResult } from "./distribution-types";
import {
  completeDistributionJob,
  getDistributionJobById,
  getJobsByIds,
  listPendingDistributionJobs,
  markJobRunning,
} from "./distribution-repository";
import { publishToProvider } from "./distribution-providers";
import {
  canRetryJob,
  computeRetryScheduledAt,
  nextStatusForRetry,
  statusAfterPublish,
} from "./distribution-state-machine";
import type { OrbitDistributionStatus } from "../graph-constants";
import { emitDistributionOutcome } from "../analytics/emit-outcomes";

async function finishDistributionJob(jobId: string, status: OrbitDistributionStatus) {
  const job = await getDistributionJobById(jobId);
  if (job) await emitDistributionOutcome(job);
}

export async function runDistributionJob(
  jobId: string,
): Promise<ProcessDistributionResult["jobs"][0]> {
  const job = await getDistributionJobById(jobId);
  if (!job) throw new Error("Distribution job not found");

  if (job.status !== "pending" && job.status !== "failed") {
    return {
      id: job.id,
      status: job.status as OrbitDistributionStatus,
      externalUrl: job.externalUrl ?? undefined,
      error: job.errorMessage ?? undefined,
    };
  }

  const running = await markJobRunning(jobId);
  if (!running) {
    const current = await getDistributionJobById(jobId);
    return {
      id: jobId,
      status: (current?.status || "pending") as OrbitDistributionStatus,
    };
  }

  const asset = await getOrbitContentAssetById(job.contentAssetId);
  if (!asset) {
    await completeDistributionJob(jobId, {
      status: "failed",
      errorMessage: "Content asset not found",
    });
    return { id: jobId, status: "failed", error: "Content asset not found" };
  }

  await updateContentAssetPublishStatus(asset.id, "publishing");

  const publishResult = await publishToProvider(
    job.provider as Parameters<typeof publishToProvider>[0],
    asset,
  );

  const terminalStatus = statusAfterPublish(publishResult.ok, publishResult.manualReady);

  if (terminalStatus === "succeeded") {
    await completeDistributionJob(jobId, {
      status: "succeeded",
      externalId: publishResult.externalId,
      externalUrl: publishResult.externalUrl,
      responsePayload: { publishResult },
    });
    await updateContentAssetPublishStatus(asset.id, "published", {
      publishedUrl: publishResult.externalUrl,
      publishedBy: "orbit-distribution",
    });
    await finishDistributionJob(jobId, "succeeded");
    return {
      id: jobId,
      status: "succeeded",
      externalUrl: publishResult.externalUrl,
    };
  }

  if (terminalStatus === "ready_for_manual") {
    await completeDistributionJob(jobId, {
      status: "ready_for_manual",
      errorMessage: publishResult.error,
      responsePayload: { publishResult, copyText: publishResult.copyText },
    });
    await updateContentAssetPublishStatus(asset.id, "ready_for_manual");
    await finishDistributionJob(jobId, "ready_for_manual");
    return {
      id: jobId,
      status: "ready_for_manual",
      error: publishResult.error,
    };
  }

  const newRetryCount = job.retryCount + 1;
  if (canRetryJob("failed", job.retryCount, job.maxRetries)) {
    const retryStatus = nextStatusForRetry(newRetryCount, job.maxRetries);
    await completeDistributionJob(jobId, {
      status: retryStatus,
      errorMessage: publishResult.error,
      responsePayload: { publishResult },
      retryCount: newRetryCount,
      scheduledAt: computeRetryScheduledAt(newRetryCount),
    });
    await updateContentAssetPublishStatus(asset.id, "scheduled");
    if (retryStatus === "failed") await finishDistributionJob(jobId, "failed");
    return {
      id: jobId,
      status: retryStatus,
      error: publishResult.error,
    };
  }

  await completeDistributionJob(jobId, {
    status: "failed",
    errorMessage: publishResult.error,
    responsePayload: { publishResult },
    retryCount: newRetryCount,
  });
  await updateContentAssetPublishStatus(asset.id, "failed");
  await finishDistributionJob(jobId, "failed");
  return {
    id: jobId,
    status: "failed",
    error: publishResult.error,
  };
}

export async function processDistributionQueue(
  input: ProcessDistributionInput = {},
): Promise<ProcessDistributionResult> {
  const jobs = input.jobIds?.length
    ? await getJobsByIds(input.jobIds)
    : await listPendingDistributionJobs(input.limit ?? 10);

  const pendingJobs = jobs.filter((j) => j.status === "pending");

  const result: ProcessDistributionResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    manualReady: 0,
    jobs: [],
  };

  for (const job of pendingJobs) {
    result.processed += 1;
    const outcome = await runDistributionJob(job.id);
    result.jobs.push(outcome);
    if (outcome.status === "succeeded") result.succeeded += 1;
    else if (outcome.status === "ready_for_manual") result.manualReady += 1;
    else if (outcome.status === "failed") result.failed += 1;
  }

  return result;
}

export async function getProjectDistributionStatus(projectId: string, userId: string) {
  const { getOrbitProjectById } = await import("@/lib/orbit/ingest");
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const { getDistributionSummary, listDistributionJobsForProject } =
    await import("./distribution-repository");
  const summary = await getDistributionSummary(projectId);
  const jobs = await listDistributionJobsForProject(projectId);
  return { projectId, ...summary, jobs };
}
