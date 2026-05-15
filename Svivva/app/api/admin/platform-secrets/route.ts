import { NextResponse } from "next/server";
import { z } from "zod";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  getPlatformRuntimeSecretsRow,
  patchPlatformRuntimeSecrets,
  runtimeSecretColdStart,
} from "@/lib/platform-runtime-secrets";
import { getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
const patchSchema = z
  .object({
    openaiApiKey: z.string().optional(),
    openaiBaseUrl: z.string().optional(),
    stripeSecretKey: z.string().optional(),
    stripePublishableKey: z.string().optional(),
    stripeWebhookSecret: z.string().optional(),
    nextPublicSiteUrl: z.string().optional(),
  })
  .strict();

function toPatchValue(raw: string | undefined): string | null | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  // Only return null if explicitly empty string (user wants to clear)
  // Otherwise return undefined to skip updating this field
  return t.length === 0 ? null : t;
}

export async function GET() {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const row = await getPlatformRuntimeSecretsRow();

    return NextResponse.json({
      stored: {
        openai: !!row?.openaiApiKey?.trim(),
        openaiBaseUrl: !!row?.openaiBaseUrl?.trim(),
        stripeSecret: !!row?.stripeSecretKey?.trim(),
        stripePublishable: !!row?.stripePublishableKey?.trim(),
        stripeWebhook: !!row?.stripeWebhookSecret?.trim(),
        siteUrl: !!row?.nextPublicSiteUrl?.trim(),
      },
      deploymentOverrides: runtimeSecretColdStart,
      effective: {
        openai: !!getOpenAIApiKey()?.trim(),
        openaiBaseUrl: !!getOpenAIBaseUrl()?.trim(),
        stripeSecret: !!process.env.STRIPE_SECRET_KEY?.trim(),
        stripePublishable: !!(
          process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
        ),
        stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET?.trim(),
        siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
      },
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const patch: Parameters<typeof patchPlatformRuntimeSecrets>[0] = {};

    if ("openaiApiKey" in body) patch.openaiApiKey = toPatchValue(body.openaiApiKey);
    if ("openaiBaseUrl" in body) patch.openaiBaseUrl = toPatchValue(body.openaiBaseUrl);
    if ("stripeSecretKey" in body) patch.stripeSecretKey = toPatchValue(body.stripeSecretKey);
    if ("stripePublishableKey" in body)
      patch.stripePublishableKey = toPatchValue(body.stripePublishableKey);
    if ("stripeWebhookSecret" in body)
      patch.stripeWebhookSecret = toPatchValue(body.stripeWebhookSecret);
    if ("nextPublicSiteUrl" in body) patch.nextPublicSiteUrl = toPatchValue(body.nextPublicSiteUrl);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await patchPlatformRuntimeSecrets(patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
