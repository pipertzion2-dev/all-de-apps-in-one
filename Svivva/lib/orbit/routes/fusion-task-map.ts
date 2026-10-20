/** Maps marketing checklist task IDs to Orbit run-step stepIds. */
export const FUSION_TASK_RUN_STEPS: Record<string, string> = {
  "content-seo-pages": "svivva-seo-pages",
  "content-blog": "svivva-blog",
  "content-comparisons": "svivva-comparisons",
  "content-aeo": "svivva-aeo",
  "content-integrations": "svivva-integrations",
  "content-usecases": "svivva-usecases",
  "content-paa": "svivva-paa",
  "content-parasite": "svivva-parasite",
  "content-social-pack": "svivva-social",
  "content-community": "svivva-communities",
  "tech-schema-jsonld": "svivva-schema",
  "tech-indexnow-submitted": "svivva-indexnow",
};

/** Tasks that require manual action or separate dashboards — skipped in fusion runs. */
export const FUSION_MANUAL_TASKS = new Set([
  "content-channel-intel",
  "manual-reddit-sideproject",
]);

export function resolveFusionRunStep(taskId: string): string | null {
  if (FUSION_MANUAL_TASKS.has(taskId)) return null;
  return FUSION_TASK_RUN_STEPS[taskId] ?? null;
}
