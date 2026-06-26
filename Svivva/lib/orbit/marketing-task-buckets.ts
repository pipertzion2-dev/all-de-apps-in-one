import { taskDefById } from "./marketing-autopilot-tasks";
import type { AutopilotTaskResult } from "./marketing-autopilot-types";

/** Tasks with no public API — admin pastes copy on external sites. */
export function isManualOnlyTask(id: string): boolean {
  const def = taskDefById(id);
  return def?.automatable === "prepare_only";
}

export function partitionAutopilotTasks(tasks: AutopilotTaskResult[]): {
  automated: AutopilotTaskResult[];
  manual: AutopilotTaskResult[];
} {
  const automated: AutopilotTaskResult[] = [];
  const manual: AutopilotTaskResult[] = [];
  for (const t of tasks) {
    if (isManualOnlyTask(t.id)) manual.push(t);
    else automated.push(t);
  }
  return { automated, manual };
}

export function isAutomatedSuccess(status: AutopilotTaskResult["status"]): boolean {
  return status === "done" || status === "posted";
}
