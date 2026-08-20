import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import { ensureGscOAuthColumns } from "@/lib/google-gsc-oauth";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";

/**
 * User id whose `seed_credentials` row holds Google Search Console OAuth tokens.
 * Prefers the Orbit internal/admin user, but falls back to the most recently
 * updated row that already has a refresh token (fixes orphaned tokens after
 * ADMIN_USER_ID / seed_credentials row changes).
 */
export async function resolveGscCredentialsUserId(): Promise<string> {
  const primary = (await resolveOrbitInternalUserId()) || "orbit-admin";
  await ensureGscOAuthColumns();

  const [primaryRow] = await db
    .select({ refresh: seedCredentials.googleOauthRefreshToken })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, primary))
    .limit(1);

  if (primaryRow?.refresh?.trim()) return primary;

  const [oauthRow] = await db
    .select({ userId: seedCredentials.userId })
    .from(seedCredentials)
    .where(isNotNull(seedCredentials.googleOauthRefreshToken))
    .orderBy(desc(seedCredentials.updatedAt))
    .limit(1);

  return oauthRow?.userId || primary;
}

/** Primary write target for new OAuth tokens (always the admin/internal row). */
export async function resolveGscOAuthSaveUserId(): Promise<string> {
  return (await resolveOrbitInternalUserId()) || "orbit-admin";
}
