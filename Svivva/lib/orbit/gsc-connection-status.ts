import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  ensureGscOAuthColumns,
  getGoogleOAuthAccessTokenForUser,
  isGoogleGscOAuthConfigured,
} from "@/lib/google-gsc-oauth";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { getActiveIndexNowKey } from "@/lib/indexing/indexnow-key";

export type GscConnectionStatus = {
  userId: string;
  siteUrl: string | null;
  oauthEmail: string | null;
  /** Valid OAuth refresh token that yields an access token right now. */
  oauthConnected: boolean;
  /** Legacy service-account JSON on the credentials row. */
  serviceAccount: boolean;
  indexNow: boolean;
  oauthAvailable: boolean;
  /** OAuth or service account — can call GSC / Indexing APIs. */
  canUseGoogleApis: boolean;
  /** Site URL saved — minimum for IndexNow-only workflows. */
  siteConfigured: boolean;
};

/** Single source of truth for “is Google Search Console actually connected?” */
export async function getGscConnectionStatus(): Promise<GscConnectionStatus> {
  await ensureGscOAuthColumns();
  const userId = await resolveGscCredentialsUserId();

  const [row] = await db
    .select({
      site: seedCredentials.googleSiteUrl,
      oauth: seedCredentials.googleOauthRefreshToken,
      oauthEmail: seedCredentials.googleOauthEmail,
      sa: seedCredentials.googleServiceAccountJson,
    })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);

  const siteUrl = row?.site?.trim() || null;
  const hasRefresh = !!row?.oauth?.trim();
  const serviceAccount = !!row?.sa?.trim();
  const accessToken = hasRefresh ? await getGoogleOAuthAccessTokenForUser(userId) : null;
  const oauthConnected = !!accessToken;
  const indexNow = !!(await getActiveIndexNowKey());

  return {
    userId,
    siteUrl,
    oauthEmail: row?.oauthEmail?.trim() || null,
    oauthConnected,
    serviceAccount,
    indexNow,
    oauthAvailable: isGoogleGscOAuthConfigured(),
    canUseGoogleApis: oauthConnected || serviceAccount,
    siteConfigured: !!siteUrl,
  };
}
