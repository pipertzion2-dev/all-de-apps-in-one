import { NextRequest } from "next/server";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getSitemapUrl } from "@/lib/site-url";
import { submitSitemapToGSC, submitSitemapWithAccessToken } from "@/lib/google-indexing";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import {
  getGoogleServiceAccountAccessToken,
  GoogleServiceAccount,
  parseGoogleServiceAccount,
} from "@/lib/google-service-account";
import { badRequest, forbidden, ok, serverError } from "@/lib/http-response";
import {
  hydratePlatformSecrets,
  patchPlatformRuntimeSecrets,
} from "@/lib/platform-runtime-secrets";
import { formatDatabaseConnectionError } from "@/lib/db-connection-error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = internalSecret && internalSecret === process.env.ORBIT_INTERNAL_SECRET;
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    const { action } = body;

    // submit_sitemap can run without user context (internal scheduler or authenticated user).
    // Google: real Webmasters v3 API via service-account JWT (the legacy ?ping= endpoint was
    // retired June 2023). Bing: legacy ping endpoint still alive.
    if (action === "submit_sitemap") {
      const isInternal = internalSecret && internalSecret === process.env.ORBIT_INTERNAL_SECRET;
      if (!isInternal && !(await isOrbitAdminAllowed(req))) return forbidden();

      try {
        const sitemapUrl = getSitemapUrl();

        // Find the admin's stored service-account + site URL.
        // Prefer ADMIN_USER_ID (deterministic); fall back to most-recent enabled row.
        const adminUserId = getPrimaryAdminUserId() || "";
        const orbitUserId = (await resolveGscCredentialsUserId()) || adminUserId || "orbit-admin";
        const lookupUserId = orbitUserId || adminUserId;
        const [creds] = lookupUserId
          ? await db
              .select({
                sa: seedCredentials.googleServiceAccountJson,
                site: seedCredentials.googleSiteUrl,
                userId: seedCredentials.userId,
              })
              .from(seedCredentials)
              .where(eq(seedCredentials.userId, lookupUserId))
              .limit(1)
          : await db
              .select({
                sa: seedCredentials.googleServiceAccountJson,
                site: seedCredentials.googleSiteUrl,
                userId: seedCredentials.userId,
              })
              .from(seedCredentials)
              .where(
                and(
                  eq(seedCredentials.googleIndexingEnabled, true),
                  isNotNull(seedCredentials.googleSiteUrl),
                ),
              )
              .orderBy(desc(seedCredentials.updatedAt))
              .limit(1);

        const credUserId = creds?.userId || orbitUserId;
        const accessToken = await getGoogleOAuthAccessTokenForUser(credUserId);

        const googlePromise =
          accessToken && creds?.site
            ? submitSitemapWithAccessToken(accessToken, creds.site, sitemapUrl)
            : creds?.sa && creds?.site
              ? submitSitemapToGSC(creds.sa, creds.site, sitemapUrl)
              : accessToken
                ? (async () => {
                    const setup = await runGscAutoSetup({ userId: credUserId, accessToken });
                    if (setup.siteUrl && setup.sitemapOk) {
                      return { ok: true as const };
                    }
                    return {
                      ok: false as const,
                      error: setup.message || "GSC property not matched — sync property first",
                    };
                  })()
                : Promise.resolve({
                    ok: false as const,
                    error:
                      "Connect Google at /dashboard/gsc-connect or paste a service account JSON",
                  });

        const bingPromise = fetch(
          `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
          {
            signal: AbortSignal.timeout(10000),
          },
        )
          .then((r) => ({ ok: r.ok, status: r.status }))
          .catch((e) => ({ ok: false, status: 0, error: String(e) }));

        const [google, bing] = await Promise.all([googlePromise, bingPromise]);
        return ok({ success: true, sitemapUrl, google, bing });
      } catch (e: any) {
        return serverError(e.message);
      }
    }

    // Remaining actions require admin access
    if (!(await isOrbitAdminAllowed(req))) {
      return forbidden("Admin unlock required — enter the admin passcode on this page first.");
    }

    const userId = await resolveGscCredentialsUserId();

    const [existing] = await db
      .select({ id: seedCredentials.id })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);
    if (!existing) {
      await db.insert(seedCredentials).values({ userId, updatedAt: new Date() });
    }

    // Re-match GSC property + submit sitemap (OAuth — no re-sign-in)
    if (action === "sync_property") {
      const accessToken = await getGoogleOAuthAccessTokenForUser(userId);
      if (!accessToken) {
        return badRequest("Connect Google first — no OAuth refresh token saved.");
      }
      const setup = await runGscAutoSetup({ userId, accessToken });
      return ok({
        success: setup.ok,
        setup,
        message: setup.message,
      });
    }

    // Fix site URL
    if (action === "fix_url") {
      const { siteUrl } = body;
      if (!siteUrl || typeof siteUrl !== "string") return badRequest("siteUrl required");
      await db
        .update(seedCredentials)
        .set({ googleSiteUrl: siteUrl, updatedAt: new Date() })
        .where(eq(seedCredentials.userId, userId));
      return ok({ success: true, siteUrl });
    }

    // Save service account JSON
    if (action === "save_service_account") {
      const { json } = body;
      if (!json || typeof json !== "string") return badRequest("json required");
      let sa: GoogleServiceAccount;
      try {
        sa = parseGoogleServiceAccount(json);
      } catch (e: any) {
        return badRequest(`Invalid JSON: ${e.message}`);
      }
      try {
        await getGoogleServiceAccountAccessToken(
          sa,
          "https://www.googleapis.com/auth/webmasters.readonly",
        );
      } catch (e: any) {
        return badRequest(`Service account auth failed: ${e.message}`);
      }
      try {
        await db
          .update(seedCredentials)
          .set({
            googleServiceAccountJson: json,
            googleIndexingEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(seedCredentials.userId, userId));
      } catch (e: any) {
        console.error("[gsc/save] UPDATE failed:", e?.message);
        return serverError(`DB save failed: ${e.message}`);
      }
      return ok({ success: true, email: sa.client_email });
    }

    // Save Google OAuth client credentials (when not set in Vercel env)
    if (action === "save_oauth_client") {
      const { parseGscOAuthCredentialsFromFields, isValidGscOAuthCredentials } =
        await import("@/lib/gsc-oauth-credentials");
      const { clientId: rawId, clientSecret: rawSecret } = body;
      if (!rawId || typeof rawId !== "string" || !rawSecret || typeof rawSecret !== "string") {
        return badRequest("clientId and clientSecret required");
      }
      const { clientId: id, clientSecret: secret } = parseGscOAuthCredentialsFromFields(
        rawId,
        rawSecret,
      );
      if (!id || !secret) return badRequest("clientId and clientSecret required");
      if (!isValidGscOAuthCredentials(id, secret)) {
        return badRequest(
          "Invalid Google OAuth client — Client ID must end with .apps.googleusercontent.com and secret must be real (not a placeholder).",
        );
      }
      try {
        await patchPlatformRuntimeSecrets({
          googleGscClientId: id,
          googleGscClientSecret: secret,
        });
        await hydratePlatformSecrets();
      } catch (e: unknown) {
        const dbMsg = formatDatabaseConnectionError(e);
        if (dbMsg) {
          return serverError(
            "Database unavailable — could not save OAuth client. Set DATABASE_URL in Vercel to hosted Postgres and redeploy, or set GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET in Vercel env vars instead.",
          );
        }
        const message = e instanceof Error ? e.message : String(e);
        console.error("[gsc/save] save_oauth_client failed:", message);
        return serverError(`Could not save OAuth client: ${message}`);
      }
      return ok({
        success: true,
        message: "Google OAuth client saved — you can connect with Google now.",
      });
    }

    return badRequest("Unknown action");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[gsc/save] unhandled:", message);
    return serverError(message || "Save failed");
  }
}
