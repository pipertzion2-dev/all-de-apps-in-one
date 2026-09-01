import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformRuntimeSecrets } from "@/lib/schema";
import { resetOpenAIClientCache } from "@/lib/llm/openai";
import { ensureCoreDbTables } from "@/lib/ensure-core-db-tables";
import {
  isValidGscOAuthClientId,
  isValidGscOAuthClientSecret,
  isValidGscOAuthCredentials,
} from "@/lib/gsc-oauth-credentials";

const ROW_ID = "default";

let googleGscColumnsEnsured = false;
let interimPaymentColumnsEnsured = false;

async function ensureInterimPaymentColumns(): Promise<void> {
  if (interimPaymentColumnsEnsured) return;
  try {
    await ensureCoreDbTables();
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS interim_stripe_payment_link_pro TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS interim_stripe_payment_link_enterprise TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS interim_paypal_url TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS interim_venmo_url TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS interim_payment_note TEXT`,
    );
    interimPaymentColumnsEnsured = true;
  } catch {
    /* test env */
  }
}

async function ensureGoogleGscPlatformColumns(): Promise<void> {
  if (googleGscColumnsEnsured) return;
  try {
    await ensureCoreDbTables();
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
  googleGscClientId: isValidGscOAuthClientId(process.env.GOOGLE_GSC_CLIENT_ID),
  googleGscClientSecret: isValidGscOAuthClientSecret(process.env.GOOGLE_GSC_CLIENT_SECRET),
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
  interimStripePaymentLinkPro: string | null;
  interimStripePaymentLinkEnterprise: string | null;
  interimPaypalUrl: string | null;
  interimVenmoUrl: string | null;
  interimPaymentNote: string | null;
}>;

export async function getPlatformRuntimeSecretsRow() {
  await ensureInterimPaymentColumns();
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

  applyGoogleGscOAuthFromRow(row);
}

/** Prefer valid env; fall back to DB when Vercel has placeholder values like your-client-id. */
export function stripInvalidGoogleGscEnvFromProcess(): void {
  const envId =
    process.env.GOOGLE_GSC_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const envSecret =
    process.env.GOOGLE_GSC_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  if (isValidGscOAuthCredentials(envId, envSecret)) return;
  delete process.env.GOOGLE_GSC_CLIENT_ID;
  delete process.env.GOOGLE_GSC_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
}

function applyGoogleGscOAuthFromRow(
  row: NonNullable<Awaited<ReturnType<typeof getPlatformRuntimeSecretsRow>>>,
) {
  const envId = process.env.GOOGLE_GSC_CLIENT_ID?.trim() || "";
  const envSecret = process.env.GOOGLE_GSC_CLIENT_SECRET?.trim() || "";
  const dbId = row.googleGscClientId?.trim() || "";
  const dbSecret = row.googleGscClientSecret?.trim() || "";

  if (isValidGscOAuthCredentials(envId, envSecret)) return;

  if (isValidGscOAuthCredentials(dbId, dbSecret)) {
    process.env.GOOGLE_GSC_CLIENT_ID = dbId;
    process.env.GOOGLE_GSC_CLIENT_SECRET = dbSecret;
    return;
  }

  delete process.env.GOOGLE_GSC_CLIENT_ID;
  delete process.env.GOOGLE_GSC_CLIENT_SECRET;
}

/** Merge database secrets into process.env when the host did not provide them. */
export async function hydratePlatformSecrets(): Promise<void> {
  try {
    stripInvalidGoogleGscEnvFromProcess();
    await ensureGoogleGscPlatformColumns();
    const row = await getPlatformRuntimeSecretsRow();
    if (row) syncProcessEnvFromRow(row);
    resetOpenAIClientCache();
  } catch (e) {
    console.warn("[platform-runtime-secrets] hydrate skipped:", e);
  }
}

export async function patchPlatformRuntimeSecrets(patch: PlatformRuntimeSecretsPatch) {
  if ("googleGscClientId" in patch || "googleGscClientSecret" in patch) {
    await ensureGoogleGscPlatformColumns();
  }
  if (
    "interimStripePaymentLinkPro" in patch ||
    "interimStripePaymentLinkEnterprise" in patch ||
    "interimPaypalUrl" in patch ||
    "interimVenmoUrl" in patch ||
    "interimPaymentNote" in patch
  ) {
    await ensureInterimPaymentColumns();
  }
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
    interimStripePaymentLinkPro: existing?.interimStripePaymentLinkPro ?? null,
    interimStripePaymentLinkEnterprise: existing?.interimStripePaymentLinkEnterprise ?? null,
    interimPaypalUrl: existing?.interimPaypalUrl ?? null,
    interimVenmoUrl: existing?.interimVenmoUrl ?? null,
    interimPaymentNote: existing?.interimPaymentNote ?? null,
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
        interimStripePaymentLinkPro: merged.interimStripePaymentLinkPro,
        interimStripePaymentLinkEnterprise: merged.interimStripePaymentLinkEnterprise,
        interimPaypalUrl: merged.interimPaypalUrl,
        interimVenmoUrl: merged.interimVenmoUrl,
        interimPaymentNote: merged.interimPaymentNote,
        updatedAt: merged.updatedAt,
      },
    });

  await hydratePlatformSecrets();
}
