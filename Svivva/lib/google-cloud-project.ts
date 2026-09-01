/** Google OAuth client IDs embed the Cloud project number: `{projectNumber}-….apps.googleusercontent.com`. */

export function extractGoogleCloudProjectNumber(
  clientId: string | null | undefined,
): string | null {
  const id = clientId?.trim() || "";
  const match = id.match(/^(\d+)-[\w-]+\.apps\.googleusercontent\.com$/i);
  return match?.[1] ?? null;
}

/** Parse project number from Google API error text (e.g. "project 680989077677"). */
export function extractGoogleCloudProjectFromError(message: string): string | null {
  const match = message.match(/project[\s_]+(\d{6,})/i);
  return match?.[1] ?? null;
}

export type GoogleApiEnableLinks = {
  projectNumber: string;
  indexingApi: string;
  searchConsoleApi: string;
  apisDashboard: string;
};

export function buildGoogleApiEnableLinks(projectNumber: string): GoogleApiEnableLinks {
  const project = projectNumber.trim();
  return {
    projectNumber: project,
    indexingApi: `https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=${project}`,
    searchConsoleApi: `https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=${project}`,
    apisDashboard: `https://console.cloud.google.com/apis/dashboard?project=${project}`,
  };
}

export function resolveGoogleApiEnableLinks(opts: {
  clientId?: string | null;
  errorMessage?: string | null;
}): GoogleApiEnableLinks | null {
  const project =
    extractGoogleCloudProjectNumber(opts.clientId) ||
    (opts.errorMessage ? extractGoogleCloudProjectFromError(opts.errorMessage) : null);
  return project ? buildGoogleApiEnableLinks(project) : null;
}

/** True when Google says the Indexing API (or similar) is disabled for the project. */
export function isGoogleApiDisabledError(message: string | null | undefined): boolean {
  if (!message?.trim()) return false;
  const low = message.toLowerCase();
  return (
    low.includes("has not been used in project") ||
    low.includes("accessnotconfigured") ||
    (low.includes("is disabled") && low.includes("indexing")) ||
    low.includes("access not configured") ||
    low.includes("service is not enabled")
  );
}

/** URL ownership / GSC permission — different fix than enabling the API. */
export function isGoogleIndexingOwnershipError(message: string | null | undefined): boolean {
  if (!message?.trim()) return false;
  const low = message.toLowerCase();
  return (
    low.includes("failed to verify the url ownership") ||
    low.includes("permission denied") ||
    (low.includes("forbidden") && low.includes("ownership"))
  );
}

export function summarizeGoogleIndexingErrors(errors: string[]): string {
  const unique = [...new Set(errors.map((e) => e.trim()).filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  const disabled = unique.find(isGoogleApiDisabledError);
  if (disabled) return disabled;
  const ownership = unique.find(isGoogleIndexingOwnershipError);
  if (ownership) return ownership;
  return unique.slice(0, 2).join(" · ");
}

/** Masked OAuth client id for UI: `680989077677-abc…ontent.com` */
export function maskGoogleOAuthClientId(clientId: string | null | undefined): string | null {
  const id = clientId?.trim() || "";
  if (!id) return null;
  const m = id.match(/^(\d+-[\w-]{3})[\w-]+(\.apps\.googleusercontent\.com)$/i);
  if (m) return `${m[1]}…${m[2]}`;
  return id.length > 24 ? `${id.slice(0, 20)}…` : id;
}
