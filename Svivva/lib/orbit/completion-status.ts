/**
 * Derive a clear Orbit completion snapshot from the last autopilot run.
 * Answers: what's done, what's blocked on keys, and the single next human action.
 */

import { isManualOnlyTask, isAutomatedSuccess } from "./marketing-task-buckets";
import type { AutopilotTaskResult } from "./marketing-autopilot-types";

export type OrbitCompletionSnapshot = {
  doneCount: number;
  postedCount: number;
  blockedCount: number;
  manualLeftCount: number;
  failedCount: number;
  /** Highest-impact next paste / human step, if any */
  nextAction: {
    id: string;
    label: string;
    message: string;
    url?: string;
    copyText?: string;
  } | null;
  /** Credential-gated automated tasks still waiting on keys */
  blockedLabels: string[];
  /** True when every automatable task succeeded and only optional/manual leftovers remain */
  automatableComplete: boolean;
  summaryLine: string;
};

/** Prefer high-traffic paste channels first for zero-traffic owners. */
const NEXT_ACTION_PRIORITY: string[] = [
  "manual-showhn",
  "manual-producthunt",
  "dir-futurepedia",
  "dir-taaft",
  "dir-g2",
  "dir-alternativeto",
  "dir-crunchbase",
  "manual-medium",
  "manual-indiehackers",
  "manual-podcasts",
  "tech-rich-results",
];

const OPEN_URLS: Record<string, string> = {
  "manual-showhn": "https://news.ycombinator.com/submit",
  "manual-producthunt": "https://www.producthunt.com/posts/new",
  "dir-futurepedia": "https://www.futurepedia.io/submit-tool",
  "dir-taaft": "https://theresanaiforthat.com/submit/",
  "dir-g2": "https://sell.g2.com/list-your-product",
  "dir-alternativeto": "https://alternativeto.net/manage/add-product/",
  "dir-crunchbase": "https://www.crunchbase.com/add-company",
  "manual-medium": "https://medium.com/new-story",
  "manual-indiehackers": "https://www.indiehackers.com/post",
  "tech-rich-results": "https://search.google.com/test/rich-results",
};

function priorityIndex(id: string): number {
  const i = NEXT_ACTION_PRIORITY.indexOf(id);
  return i === -1 ? 999 : i;
}

export function buildOrbitCompletionSnapshot(
  tasks: AutopilotTaskResult[],
  opts?: { manualDoneIds?: Iterable<string> },
): OrbitCompletionSnapshot {
  const doneIds = new Set(opts?.manualDoneIds ?? []);
  let doneCount = 0;
  let postedCount = 0;
  let blockedCount = 0;
  let manualLeftCount = 0;
  let failedCount = 0;
  const blockedLabels: string[] = [];
  const pendingManual: AutopilotTaskResult[] = [];

  for (const t of tasks) {
    if (doneIds.has(t.id)) {
      doneCount += 1;
      continue;
    }
    if (t.status === "posted") {
      postedCount += 1;
      doneCount += 1;
      continue;
    }
    if (t.status === "done") {
      doneCount += 1;
      continue;
    }
    if (t.status === "failed") {
      failedCount += 1;
      continue;
    }
    if (t.status === "needs_credentials") {
      blockedCount += 1;
      blockedLabels.push(t.label);
      continue;
    }
    if (t.status === "prepared" && isManualOnlyTask(t.id)) {
      manualLeftCount += 1;
      pendingManual.push(t);
    }
  }

  pendingManual.sort((a, b) => priorityIndex(a.id) - priorityIndex(b.id));
  const next = pendingManual[0];
  const nextAction = next
    ? {
        id: next.id,
        label: next.label,
        message: next.message,
        url: next.url || OPEN_URLS[next.id],
        copyText: next.copyText,
      }
    : null;

  const automatableLeft = tasks.filter(
    (t) =>
      !doneIds.has(t.id) &&
      !isManualOnlyTask(t.id) &&
      t.status !== "skipped" &&
      !isAutomatedSuccess(t.status),
  );
  const automatableComplete = automatableLeft.length === 0;

  const parts: string[] = [`${doneCount} done`];
  if (blockedCount > 0) parts.push(`${blockedCount} blocked on keys`);
  if (manualLeftCount > 0) parts.push(`${manualLeftCount} paste left`);
  if (failedCount > 0) parts.push(`${failedCount} failed`);
  if (nextAction) parts.push(`Next: ${nextAction.label}`);
  else if (automatableComplete && manualLeftCount === 0)
    parts.push("Orbit completable work finished");

  return {
    doneCount,
    postedCount,
    blockedCount,
    manualLeftCount,
    failedCount,
    nextAction,
    blockedLabels,
    automatableComplete,
    summaryLine: parts.join(" · "),
  };
}
