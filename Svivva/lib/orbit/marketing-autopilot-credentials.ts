import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import type {
  MarketingCredentialStatus,
  MarketingPlatformCredentials,
} from "./marketing-autopilot-types";

let columnEnsured = false;

async function ensureColumn() {
  if (columnEnsured) return;
  try {
    await db.execute(
      sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS marketing_autopilot_credentials TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS marketing_autopilot_last_run TEXT`,
    );
    columnEnsured = true;
  } catch {
    /* table may not exist in test env */
  }
}

function parseJson<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadMarketingPlatformCredentials(): Promise<MarketingPlatformCredentials> {
  await ensureColumn();
  const userId = (await resolveOrbitInternalUserId()) || getPrimaryAdminUserId() || "orbit-admin";
  const result = await db.execute(
    sql`SELECT marketing_autopilot_credentials FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
  );
  const row = result.rows?.[0] as Record<string, unknown> | undefined;
  return parseJson<MarketingPlatformCredentials>(row?.marketing_autopilot_credentials) ?? {};
}

export async function saveMarketingPlatformCredentials(
  patch: Partial<MarketingPlatformCredentials>,
): Promise<void> {
  await ensureColumn();
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  const existing = await loadMarketingPlatformCredentials();
  const merged: MarketingPlatformCredentials = { ...existing };
  for (const [k, v] of Object.entries(patch)) {
    const key = k as keyof MarketingPlatformCredentials;
    if (v === "" || v === undefined) continue;
    merged[key] = v;
  }
  const json = JSON.stringify(merged);
  await db.execute(sql`
    INSERT INTO seed_credentials (id, user_id, marketing_autopilot_credentials, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${json}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      marketing_autopilot_credentials = ${json},
      updated_at = NOW()
  `);
}

export async function loadLastAutopilotRun(): Promise<unknown | null> {
  await ensureColumn();
  const userId = (await resolveOrbitInternalUserId()) || getPrimaryAdminUserId() || "orbit-admin";
  const result = await db.execute(
    sql`SELECT marketing_autopilot_last_run FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
  );
  const row = result.rows?.[0] as Record<string, unknown> | undefined;
  return parseJson(row?.marketing_autopilot_last_run);
}

export async function saveLastAutopilotRun(run: unknown): Promise<void> {
  await ensureColumn();
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  const json = JSON.stringify(run);
  await db.execute(sql`
    INSERT INTO seed_credentials (id, user_id, marketing_autopilot_last_run, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${json}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      marketing_autopilot_last_run = ${json},
      updated_at = NOW()
  `);
}

export async function getMarketingCredentialStatus(): Promise<MarketingCredentialStatus> {
  await ensureColumn();
  const adminId = getPrimaryAdminUserId() || "";
  const { ensureGscOAuthColumns } = await import("@/lib/google-gsc-oauth");
  await ensureGscOAuthColumns();

  const [row] = adminId
    ? await db
        .select({
          sa: seedCredentials.googleServiceAccountJson,
          site: seedCredentials.googleSiteUrl,
          indexnow: seedCredentials.indexnowKey,
          oauth: seedCredentials.googleOauthRefreshToken,
        })
        .from(seedCredentials)
        .where(eq(seedCredentials.userId, adminId))
        .limit(1)
    : await db
        .select({
          sa: seedCredentials.googleServiceAccountJson,
          site: seedCredentials.googleSiteUrl,
          indexnow: seedCredentials.indexnowKey,
          oauth: seedCredentials.googleOauthRefreshToken,
        })
        .from(seedCredentials)
        .limit(1);

  const platform = await loadMarketingPlatformCredentials();

  const configured: MarketingCredentialStatus["configured"] = {};
  for (const key of Object.keys(platform) as (keyof MarketingPlatformCredentials)[]) {
    configured[key] = !!platform[key]?.trim();
  }

  return {
    configured,
    google: {
      serviceAccount: !!(row?.sa?.trim() || row?.oauth?.trim()),
      siteUrl: !!row?.site?.trim(),
      indexNow: !!row?.indexnow?.trim(),
    },
  };
}
