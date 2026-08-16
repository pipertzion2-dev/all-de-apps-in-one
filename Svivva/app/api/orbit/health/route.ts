import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed, isCronSecretAuthorized } from "@/lib/orbit/admin-access";
import { getSiteUrl } from "@/lib/site-url";
import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";

/**
 * Lightweight Orbit readiness probe for admins / ops.
 * Does not require full marketing DB aggregates (those live on /api/orbit/status).
 */
export async function GET(req: NextRequest) {
  const allowed = (await isOrbitAdminAllowed(req)) || isCronSecretAuthorized(req);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const siteUrl = getSiteUrl();
  const internalUserId = await resolveOrbitInternalUserId().catch(() => null);
  const checks = {
    siteUrl: !!siteUrl,
    adminCookieOrSecret: true,
    orbitInternalUserId: !!internalUserId,
    orbitAi: !!(getGeminiApiKey()?.trim() || getOllamaUrl()?.trim()),
    openAiConfigured: !!(getOpenAIApiKey()?.trim() && getOpenAIApiKey()!.trim().startsWith("sk-")),
    indexNowEnvHint: !!process.env.INDEXNOW_KEY?.trim(),
  };

  const ready = checks.siteUrl && checks.orbitInternalUserId;
  return NextResponse.json({
    ok: ready,
    ready,
    checks,
    next: ready
      ? [
          "Open /dashboard/orbit",
          "Run status panel / IndexNow setup",
          "Execute marketing steps from the launchpad UI",
        ]
      : [
          "Set ADMIN_USER_ID or enter admin code 272727",
          "Ensure NEXT_PUBLIC_SITE_URL / site URL is configured",
          "Create a seed_credentials row by running IndexNow once",
        ],
  });
}
