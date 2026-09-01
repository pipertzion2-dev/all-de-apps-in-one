import { NextRequest, NextResponse } from "next/server";
import { ensureBillingColumns } from "@/lib/billing/ensure-billing-columns";
import { getSiteUrl } from "@/lib/site-url";
import {
  getLemonSqueezyWebhookSecret,
  processLemonSqueezyWebhook,
  verifyLemonSqueezySignature,
} from "@/lib/lemonsqueezy/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureBillingColumns();
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const secret = await getLemonSqueezyWebhookSecret();

    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
    }

    if (!signature || !verifyLemonSqueezySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Parameters<typeof processLemonSqueezyWebhook>[0];
    const result = await processLemonSqueezyWebhook(payload);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[lemonsqueezy/webhook]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    webhookUrl: `${getSiteUrl()}/api/lemonsqueezy/webhook`,
    events: [
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_expired",
    ],
  });
}
