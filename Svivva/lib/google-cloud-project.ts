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
    low.includes("is disabled") ||
    low.includes("access not configured") ||
    low.includes("service is not enabled")
  );
}
