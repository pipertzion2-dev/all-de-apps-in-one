import { NextResponse } from "next/server";
import { z } from "zod";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  getPlatformRuntimeSecretsRow,
  patchPlatformRuntimeSecrets,
  runtimeSecretColdStart,
} from "@/lib/platform-runtime-secrets";
import { getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
import { isInterimPaymentActive, mergeInterimPaymentConfig } from "@/lib/interim-payments";
const patchSchema = z
  .object({
    openaiApiKey: z.string().optional(),
    openaiBaseUrl: z.string().optional(),
    stripeSecretKey: z.string().optional(),
    stripePublishableKey: z.string().optional(),
    stripeWebhookSecret: z.string().optional(),
    nextPublicSiteUrl: z.string().optional(),
    interimStripePaymentLinkPro: z.string().optional(),
    interimStripePaymentLinkEnterprise: z.string().optional(),
    interimPaypalUrl: z.string().optional(),
    interimVenmoUrl: z.string().optional(),
    interimPaymentNote: z.string().optional(),
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
    const interim = mergeInterimPaymentConfig(
      row
        ? {
            stripePaymentLinkPro: row.interimStripePaymentLinkPro,
            stripePaymentLinkEnterprise: row.interimStripePaymentLinkEnterprise,
            paypalUrl: row.interimPaypalUrl,
            venmoUrl: row.interimVenmoUrl,
            note: row.interimPaymentNote,
          }
        : null,
    );

    return NextResponse.json({
      stored: {
        openai: !!row?.openaiApiKey?.trim(),
        openaiBaseUrl: !!row?.openaiBaseUrl?.trim(),
        stripeSecret: !!row?.stripeSecretKey?.trim(),
        stripePublishable: !!row?.stripePublishableKey?.trim(),
        stripeWebhook: !!row?.stripeWebhookSecret?.trim(),
        siteUrl: !!row?.nextPublicSiteUrl?.trim(),
        interimStripePaymentLinkPro: !!row?.interimStripePaymentLinkPro?.trim(),
        interimStripePaymentLinkEnterprise: !!row?.interimStripePaymentLinkEnterprise?.trim(),
        interimPaypalUrl: !!row?.interimPaypalUrl?.trim(),
        interimVenmoUrl: !!row?.interimVenmoUrl?.trim(),
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
      interim: {
        active: isInterimPaymentActive(interim),
        stripePaymentLinkPro: !!interim.stripePaymentLinkPro,
        stripePaymentLinkEnterprise: !!interim.stripePaymentLinkEnterprise,
        paypalUrl: !!interim.paypalUrl,
        venmoUrl: !!interim.venmoUrl,
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
    if ("interimStripePaymentLinkPro" in body)
      patch.interimStripePaymentLinkPro = toPatchValue(body.interimStripePaymentLinkPro);
    if ("interimStripePaymentLinkEnterprise" in body)
      patch.interimStripePaymentLinkEnterprise = toPatchValue(
        body.interimStripePaymentLinkEnterprise,
      );
    if ("interimPaypalUrl" in body) patch.interimPaypalUrl = toPatchValue(body.interimPaypalUrl);
    if ("interimVenmoUrl" in body) patch.interimVenmoUrl = toPatchValue(body.interimVenmoUrl);
    if ("interimPaymentNote" in body)
      patch.interimPaymentNote = toPatchValue(body.interimPaymentNote);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await patchPlatformRuntimeSecrets(patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
