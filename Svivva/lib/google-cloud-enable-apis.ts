import {
  buildGoogleApiEnableLinks,
  extractGoogleCloudProjectNumber,
  isGoogleApiDisabledError,
  type GoogleApiEnableLinks,
} from "@/lib/google-cloud-project";
import { getGoogleGscOAuthConfig } from "@/lib/google-gsc-oauth";

const SERVICE_USAGE = "https://serviceusage.googleapis.com/v1";

/** Scope required to call Service Usage API enable endpoints. */
export const GOOGLE_SERVICE_MANAGEMENT_SCOPE =
  "https://www.googleapis.com/auth/service.management";

const APIS_TO_ENABLE = ["indexing.googleapis.com", "searchconsole.googleapis.com"] as const;

export type EnsureGoogleApisResult = {
  ok: boolean;
  projectNumber: string | null;
  enabled: string[];
  failed: { service: string; error: string }[];
  enableLinks: GoogleApiEnableLinks | null;
  message: string;
  needsReconnect?: boolean;
};

async function enableOneService(
  accessToken: string,
  projectNumber: string,
  service: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = `${SERVICE_USAGE}/projects/${projectNumber}/services/${service}:enable`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(20_000),
  });
  if (res.ok) return { ok: true };

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string; status?: string };
  };
  const msg = body.error?.message || `HTTP ${res.status}`;
  if (res.status === 403 && /insufficient|permission|scope/i.test(msg)) {
    return { ok: false, error: `insufficient_scope: ${msg}` };
  }
  return { ok: false, error: msg };
}

/** Probe Indexing API with a harmless publish to detect "API disabled" without submitting a URL. */
export async function probeGoogleIndexingApi(accessToken: string): Promise<{
  enabled: boolean;
  error?: string;
  projectNumber?: string;
}> {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/", type: "URL_UPDATED" }),
    signal: AbortSignal.timeout(12_000),
  });
  if (res.ok) return { enabled: true };

  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  const msg = body.error?.message || `HTTP ${res.status}`;
  const projectNumber = msg.match(/project[\s_]+(\d{6,})/i)?.[1];
  return {
    enabled: !isGoogleApiDisabledError(msg),
    error: msg,
    projectNumber,
  };
}

export function resolveProjectNumberForEnable(): string | null {
  const cfg = getGoogleGscOAuthConfig();
  return cfg ? extractGoogleCloudProjectNumber(cfg.clientId) : null;
}

/** Enable Indexing + Search Console APIs on the OAuth client’s GCP project. */
export async function ensureGoogleIndexingApisEnabled(
  accessToken: string,
  projectNumber?: string | null,
): Promise<EnsureGoogleApisResult> {
  const project = projectNumber?.trim() || resolveProjectNumberForEnable();
  const enableLinks = project ? buildGoogleApiEnableLinks(project) : null;

  if (!project) {
    return {
      ok: false,
      projectNumber: null,
      enabled: [],
      failed: [],
      enableLinks,
      message:
        "Could not determine Google Cloud project — enable Web Search Indexing API manually in Google Cloud Console.",
    };
  }

  const enabled: string[] = [];
  const failed: { service: string; error: string }[] = [];
  let needsReconnect = false;

  for (const service of APIS_TO_ENABLE) {
    const result = await enableOneService(accessToken, project, service);
    if (result.ok) {
      enabled.push(service);
    } else {
      const err = result.error || "unknown";
      failed.push({ service, error: err });
      if (/insufficient_scope|insufficient authentication scopes/i.test(err)) {
        needsReconnect = true;
      }
    }
  }

  const ok = failed.length === 0;
  let message = ok
    ? `Enabled ${enabled.join(" and ")} on project ${project}. Wait 1–2 minutes, then retry indexing.`
    : failed.every((f) => /insufficient_scope/i.test(f.error))
      ? "Reconnect Google once to grant API-enable permission, or enable the APIs manually using the links below."
      : `Could not enable all APIs automatically — use the links below, then retry indexing.`;

  if (!ok && enabled.length > 0) {
    message = `Partially enabled (${enabled.join(", ")}). ${message}`;
  }

  return {
    ok,
    projectNumber: project,
    enabled,
    failed,
    enableLinks,
    message,
    needsReconnect,
  };
}
