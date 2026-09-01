import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import {
  ensureGoogleIndexingApisEnabled,
  probeGoogleIndexingApi,
} from "@/lib/google-cloud-enable-apis";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { forbidden, ok, serverError } from "@/lib/http-response";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";

export const dynamic = "force-dynamic";

/** Auto-enable Indexing + Search Console APIs, or return direct enable links. */
export async function POST() {
  if (!(await isOrbitAdminAllowed())) return forbidden();

  await hydratePlatformSecrets();

  const userId = await resolveGscCredentialsUserId();
  const accessToken = await getGoogleOAuthAccessTokenForUser(userId);
  if (!accessToken) {
    return ok({
      ok: false,
      needsReconnect: true,
      message: "Connect Google first at /dashboard/gsc-connect, then retry.",
    });
  }

  const probe = await probeGoogleIndexingApi(accessToken);
  if (probe.enabled) {
    return ok({
      ok: true,
      alreadyEnabled: true,
      message: "Google Indexing API is already enabled.",
    });
  }

  try {
    const result = await ensureGoogleIndexingApisEnabled(accessToken, probe.projectNumber);
    return ok(result);
  } catch (e) {
    return serverError(String(e));
  }
}

/** Read-only probe for UI (enable links + disabled status). */
export async function GET() {
  if (!(await isOrbitAdminAllowed())) return forbidden();

  await hydratePlatformSecrets();

  const userId = await resolveGscCredentialsUserId();
  const accessToken = await getGoogleOAuthAccessTokenForUser(userId);
  if (!accessToken) {
    return ok({ enabled: false, connected: false, enableLinks: null });
  }

  const probe = await probeGoogleIndexingApi(accessToken);
  const enableResult = probe.enabled
    ? null
    : await ensureGoogleIndexingApisEnabled(accessToken, probe.projectNumber).catch(() => null);

  return ok({
    enabled: probe.enabled || enableResult?.ok === true,
    connected: true,
    error: probe.error,
    enableLinks: enableResult?.enableLinks ?? null,
    needsReconnect: enableResult?.needsReconnect ?? false,
    message: enableResult?.message,
  });
}
