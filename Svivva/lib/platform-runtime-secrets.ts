import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformRuntimeSecrets } from "@/lib/schema";
import { resetOpenAIClientCache } from "@/lib/llm/openai";

const ROW_ID = "default";

/**
 * Snapshot of deployment env before DB hydration. When true, that slot is never
 * overwritten or cleared from database values (Vercel/host env wins).
 */
export const runtimeSecretColdStart = {
  stripeSecret: !!process.env.STRIPE_SECRET_KEY?.trim(),
  stripePublishable: !!(
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  ),
  stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  openai: !!(
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()
  ),
  openaiBase: !!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim(),
  siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
};

export type PlatformRuntimeSecretsPatch = Partial<{
  openaiApiKey: string | null;
  openaiBaseUrl: string | null;
  stripeSecretKey: string | null;
  stripePublishableKey: string | null;
  stripeWebhookSecret: string | null;
  nextPublicSiteUrl: string | null;
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

  if (!runtimeSecretColdStart.openaiBase) {
    const v = row.openaiBaseUrl?.trim();
    if (v) process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = v;
    else delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  }

  if (!runtimeSecretColdStart.siteUrl) {
    const v = row.nextPublicSiteUrl?.trim();
    if (v) process.env.NEXT_PUBLIC_SITE_URL = v;
    else delete process.env.NEXT_PUBLIC_SITE_URL;
  }
}

/** Merge database secrets into process.env when the host did not provide them. */
export async function hydratePlatformSecrets(): Promise<void> {
  try {
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
        updatedAt: merged.updatedAt,
      },
    });

  await hydratePlatformSecrets();
}
