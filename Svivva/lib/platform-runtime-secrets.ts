import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformRuntimeSecrets } from "@/lib/schema";
import { resetOpenAIClientCache } from "@/lib/llm/openai";

const ROW_ID = "default";

let googleGscColumnsEnsured = false;

async function ensureGoogleGscPlatformColumns(): Promise<void> {
  if (googleGscColumnsEnsured) return;
  try {
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS google_gsc_client_id TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS google_gsc_client_secret TEXT`,
    );
    googleGscColumnsEnsured = true;
  } catch {
    /* test env */
  }
}

/**
 * Snapshot of deployment env before DB hydration. When true, that slot is never
 * overwritten or cleared from database values (Vercel/host env wins).
 */
export const runtimeSecretColdStart = {
  openai: !!(process.env.ORBIT_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()),
  openaiBaseUrl: !!process.env.ORBIT_OPENAI_BASE_URL?.trim(),
  stripeSecret: !!process.env.STRIPE_SECRET_KEY?.trim(),
  stripePublishable: !!(
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  ),
  stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
  googleGscClientId: !!process.env.GOOGLE_GSC_CLIENT_ID?.trim(),
  googleGscClientSecret: !!process.env.GOOGLE_GSC_CLIENT_SECRET?.trim(),
};

export type PlatformRuntimeSecretsPatch = Partial<{
  openaiApiKey: string | null;
  openaiBaseUrl: string | null;
  stripeSecretKey: string | null;
  stripePublishableKey: string | null;
  stripeWebhookSecret: string | null;
  nextPublicSiteUrl: string | null;
  googleGscClientId: string | null;
  googleGscClientSecret: string | null;
}>;

export async function getPlatformRuntimeSecretsRow() {
  const [row] = await db
    .select()
    .from(platformRuntimeSecrets)
    .where(eq(platformRuntimeSecrets.id, ROW_ID))
    .limit(1);
  return row ?? null;
}

function syncProcessEnvFromRow(
  row: NonNullable<Awaited<ReturnType<typeof getPlatformRuntimeSecretsRow>>>,
) {
  if (!runtimeSecretColdStart.stripeSecret) {
    const v = row.stripeSecretKey?.trim();
    if (v) process.env.STRIPE_SECRET_KEY = v;
    else delete process.env.STRIPE_SECRET_KEY;
  }

  if (!runtimeSecretColdStart.stripePublishable) {
    const v = row.stripePublishableKey?.trim();
    if (v) {
      process.env.STRIPE_PUBLISHABLE_KEY = v;
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = v;
    } else {
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    }
  }

  if (!runtimeSecretColdStart.stripeWebhook) {
    const v = row.stripeWebhookSecret?.trim();
    if (v) process.env.STRIPE_WEBHOOK_SECRET = v;
    else delete process.env.STRIPE_WEBHOOK_SECRET;
  }

  if (!runtimeSecretColdStart.openai) {
    const v = row.openaiApiKey?.trim();
    if (v) process.env.OPENAI_API_KEY = v;
    else delete process.env.OPENAI_API_KEY;
  }

  if (!runtimeSecretColdStart.openaiBaseUrl) {
    const v = row.openaiBaseUrl?.trim();
    if (v) process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = v;
    else delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  }

  if (!runtimeSecretColdStart.siteUrl) {
    const v = row.nextPublicSiteUrl?.trim();
    if (v) process.env.NEXT_PUBLIC_SITE_URL = v;
    else delete process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (!runtimeSecretColdStart.googleGscClientId) {
    const v = row.googleGscClientId?.trim();
    if (v) process.env.GOOGLE_GSC_CLIENT_ID = v;
    else delete process.env.GOOGLE_GSC_CLIENT_ID;
  }

  if (!runtimeSecretColdStart.googleGscClientSecret) {
    const v = row.googleGscClientSecret?.trim();
    if (v) process.env.GOOGLE_GSC_CLIENT_SECRET = v;
    else delete process.env.GOOGLE_GSC_CLIENT_SECRET;
  }
}

/** Merge database secrets into process.env when the host did not provide them. */
export async function hydratePlatformSecrets(): Promise<void> {
  try {
    await ensureGoogleGscPlatformColumns();
    const row = await getPlatformRuntimeSecretsRow();
    if (row) syncProcessEnvFromRow(row);
    resetOpenAIClientCache();
  } catch (e) {
    console.warn("[platform-runtime-secrets] hydrate skipped:", e);
  }
}

export async function patchPlatformRuntimeSecrets(patch: PlatformRuntimeSecretsPatch) {
  const existing = await getPlatformRuntimeSecretsRow();
  const base = {
    id: ROW_ID,
    openaiApiKey: existing?.openaiApiKey ?? null,
    openaiBaseUrl: existing?.openaiBaseUrl ?? null,
    stripeSecretKey: existing?.stripeSecretKey ?? null,
    stripePublishableKey: existing?.stripePublishableKey ?? null,
    stripeWebhookSecret: existing?.stripeWebhookSecret ?? null,
    nextPublicSiteUrl: existing?.nextPublicSiteUrl ?? null,
    googleGscClientId: existing?.googleGscClientId ?? null,
    googleGscClientSecret: existing?.googleGscClientSecret ?? null,
    updatedAt: new Date(),
  };

  const merged = { ...base, ...patch, updatedAt: new Date() };

  await db
    .insert(platformRuntimeSecrets)
    .values(merged)
    .onConflictDoUpdate({
      target: platformRuntimeSecrets.id,
      set: {
        openaiApiKey: merged.openaiApiKey,
        openaiBaseUrl: merged.openaiBaseUrl,
        stripeSecretKey: merged.stripeSecretKey,
        stripePublishableKey: merged.stripePublishableKey,
        stripeWebhookSecret: merged.stripeWebhookSecret,
        nextPublicSiteUrl: merged.nextPublicSiteUrl,
        googleGscClientId: merged.googleGscClientId,
        googleGscClientSecret: merged.googleGscClientSecret,
        updatedAt: merged.updatedAt,
      },
    });

  await hydratePlatformSecrets();
}
