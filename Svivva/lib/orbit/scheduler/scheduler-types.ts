import type { OrbitSchedulerConfig } from "../graph-constants";
import { DEFAULT_SCHEDULER_CONFIG } from "../graph-constants";

export type SchedulerProjectResult = {
  projectId: string;
  projectName: string;
  userId: string;
  analytics?: Record<string, unknown>;
  autopilot?: Record<string, unknown>;
  externalSignals?: Record<string, unknown>;
  ifm?: Record<string, unknown>;
  error?: string;
};

export type SchedulerRunResult = {
  runId: string;
  status: "completed" | "failed";
  projectsSeen: number;
  projectsProcessed: number;
  indexRecheck: Record<string, unknown>;
  distribution: Record<string, unknown>;
  projectResults: SchedulerProjectResult[];
  routeResults?: Array<Record<string, unknown>>;
  errorMessage?: string;
};

export function parseSchedulerConfig(
  metadata: Record<string, unknown> | null | undefined,
): OrbitSchedulerConfig {
  const raw = metadata?.scheduler;
  if (!raw || typeof raw !== "object") return {};
  return raw as OrbitSchedulerConfig;
}

export function mergeSchedulerConfig(
  metadata: Record<string, unknown> | null | undefined,
): Required<Pick<OrbitSchedulerConfig, "enabled" | "runAutopilot" | "maxProjectsPerRun">> {
  const parsed = parseSchedulerConfig(metadata);
  return {
    enabled: parsed.enabled ?? DEFAULT_SCHEDULER_CONFIG.enabled ?? true,
    runAutopilot: parsed.runAutopilot ?? DEFAULT_SCHEDULER_CONFIG.runAutopilot ?? true,
    maxProjectsPerRun:
      parsed.maxProjectsPerRun ?? DEFAULT_SCHEDULER_CONFIG.maxProjectsPerRun ?? 20,
  };
}
