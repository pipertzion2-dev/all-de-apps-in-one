/** Shared rules for which pink-checklist lines Orbit can mark done without a human browser. */

export type ManualTaskForAuto = {
  key: string;
  stepId: string;
  text: string;
  smart: {
    likelyAutoDone: boolean;
    needsOutsideApp: boolean;
  };
};

export type AutomationContext = {
  indexNowOk: boolean;
  googleSitemapOk: boolean;
  googleIndexingSubmitted: number;
  stepCompletion?: Record<string, boolean>;
};

export function shouldAutoCompleteManualTask(
  task: ManualTaskForAuto,
  ctx: AutomationContext,
): boolean {
  if (task.smart.likelyAutoDone) return true;

  const lower = task.text.toLowerCase();
  const mentionsPasteOrAccount =
    /copy each|copy the|paste into|paste it|publish it on the target|logged-?in|sign-?up|your inbox|from your own|directory website|product hunt|reddit|twitter thread|linkedin|medium\.com|dev\.to|show hn|news\.ycombinator|email manually|send each email/i.test(
      lower,
    );

  if (mentionsPasteOrAccount) return false;

  const mentionsBingOnly =
    /bing|yandex|yahoo|duckduckgo|indexnow/.test(lower) &&
    !/google search console|\bgsc\b|url inspection|request indexing/i.test(lower);

  if (ctx.indexNowOk && mentionsBingOnly) return true;

  const mentionsGoogle =
    /google search console|\bgsc\b|url inspection|request indexing|sitemap.*submit/i.test(lower);

  if (mentionsGoogle && ctx.googleSitemapOk) {
    return true;
  }

  if (ctx.stepCompletion?.[task.stepId] && !task.smart.needsOutsideApp) {
    return true;
  }

  return false;
}

export function getAutoCompletableManualKeys(
  tasks: ManualTaskForAuto[],
  ctx: AutomationContext,
): string[] {
  return tasks.filter((t) => shouldAutoCompleteManualTask(t, ctx)).map((t) => t.key);
}
