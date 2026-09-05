import { isGoogleIndexingQuotaError } from "@/lib/orbit/orbit-error-messages";

/** Process-local marker so we stop burning Indexing API quota after the first exhaustion today. */
let exhaustedDayKey: string | null = null;

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** True when we've already hit Google Indexing API daily quota in this process today. */
export function isGoogleIndexingQuotaExhaustedToday(): boolean {
  return exhaustedDayKey === utcDayKey();
}

export function markGoogleIndexingQuotaExhausted(at = new Date()): void {
  exhaustedDayKey = utcDayKey(at);
}

export function clearGoogleIndexingQuotaExhaustedForTests(): void {
  exhaustedDayKey = null;
}

export function noteGoogleIndexingErrors(errors: string[]): boolean {
  if (errors.some((e) => isGoogleIndexingQuotaError(e))) {
    markGoogleIndexingQuotaExhausted();
    return true;
  }
  return false;
}

export const GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE =
  "Google Indexing API daily quota reached (~200 URLs/day). IndexNow + GSC sitemap still cover discovery — quota resets tomorrow.";
