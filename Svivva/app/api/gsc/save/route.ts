import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getSitemapUrl } from "@/lib/site-url";
import { submitSitemapToGSC } from "@/lib/google-indexing";
import {
  getGoogleServiceAccountAccessToken,
  GoogleServiceAccount,
  parseGoogleServiceAccount,
} from "@/lib/google-service-account";
import {
  badRequest,
  forbidden,
  ok,
  serverError,
} from "@/lib/http-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = internalSecret && internalSecret === process.env.ORBIT_INTERNAL_SECRET;
  const body = await req.json();
  const { action } = body;

  // submit_sitemap can run without user context (internal scheduler or authenticated user).
  // Google: real Webmasters v3 API via service-account JWT (the legacy ?ping= endpoint was
  // retired June 2023). Bing: legacy ping endpoint still alive.
  if (action === "submit_sitemap") {
    try {
      const sitemapUrl = getSitemapUrl();

      // Find the admin's stored service-account + site URL.
      // Prefer ADMIN_USER_ID (deterministic); fall back to most-recent enabled row.
      const adminUserId = process.env.ADMIN_USER_ID || "";
      const [creds] = adminUserId
        ? await db.select({ sa: seedCredentials.googleServiceAccountJson, site: seedCredentials.googleSiteUrl })
            .from(seedCredentials)
            .where(eq(seedCredentials.userId, adminUserId))
            .limit(1)
        : await db.select({ sa: seedCredentials.googleServiceAccountJson, site: seedCredentials.googleSiteUrl })
            .from(seedCredentials)
            .where(and(eq(seedCredentials.googleIndexingEnabled, true), isNotNull(seedCredentials.googleServiceAccountJson), isNotNull(seedCredentials.googleSiteUrl)))
            .orderBy(desc(seedCredentials.updatedAt))
            .limit(1);

      const googlePromise = creds?.sa && creds?.site
        ? submitSitemapToGSC(creds.sa, creds.site, sitemapUrl)
        : Promise.resolve({ ok: false as const, error: "No service account configured (paste JSON at /dashboard/gsc-connect)" });

      const bingPromise = fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => ({ ok: r.ok, status: r.status }))
        .catch((e) => ({ ok: false, status: 0, error: String(e) }));

      const [google, bing] = await Promise.all([googlePromise, bingPromise]);
      return ok({ success: true, sitemapUrl, google, bing });
    } catch (e: any) {
      return serverError(e.message);
    }
  }

  // Remaining actions require authenticated user (not available for internal scheduler)
  if (isInternal) return badRequest("Action not available for internal calls");

  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return forbidden();

  const [existing] = await db.select({ id: seedCredentials.id }).from(seedCredentials).where(eq(seedCredentials.userId, user.id)).limit(1);
  if (!existing) {
    await db.insert(seedCredentials).values({ userId: user.id, updatedAt: new Date() });
  }

  // Fix site URL
  if (action === "fix_url") {
    const { siteUrl } = body;
    if (!siteUrl || typeof siteUrl !== "string") return badRequest("siteUrl required");
    await db.update(seedCredentials).set({ googleSiteUrl: siteUrl, updatedAt: new Date() }).where(eq(seedCredentials.userId, user.id));
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
        "https://www.googleapis.com/auth/webmasters.readonly"
      );
    } catch (e: any) {
      return badRequest(`Service account auth failed: ${e.message}`);
    }
    try {
      const result = await db.update(seedCredentials)
        .set({ googleServiceAccountJson: json, googleIndexingEnabled: true, updatedAt: new Date() })
        .where(eq(seedCredentials.userId, user.id));
      console.log("[gsc/save] UPDATE result:", JSON.stringify(result));
    } catch (e: any) {
      console.error("[gsc/save] UPDATE failed:", e?.message);
      return serverError(`DB save failed: ${e.message}`);
    }
    return ok({ success: true, email: sa.client_email });
  }

  return badRequest("Unknown action");
}
