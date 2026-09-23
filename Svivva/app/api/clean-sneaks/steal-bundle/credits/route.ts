import { NextRequest, NextResponse } from "next/server";
import {
  cashAppPackUrl,
  CREDIT_PACKS,
  ENTERTAINMENT_DISCLAIMER,
  getCreditPack,
  makeCashAppRedeemHint,
  parseLocalRedeemCode,
} from "@/lib/clean-sneaks/casino/credit-packs";
import { getCashAppTag } from "@/lib/interim-payments";
import { getUncachableStripeClient, hasCompleteStripeEnvKeys } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/** List packs + Cash App / Apple Pay availability. */
export async function GET() {
  const tag = getCashAppTag();
  return NextResponse.json({
    disclaimer: ENTERTAINMENT_DISCLAIMER,
    cashAppTag: tag,
    applePayReady: hasCompleteStripeEnvKeys(),
    packs: CREDIT_PACKS.map((p) => ({
      ...p,
      cashAppUrl: cashAppPackUrl(p, tag),
      redeemHint: makeCashAppRedeemHint(p),
      priceLabel: `$${(p.priceCents / 100).toFixed(2)}`,
    })),
  });
}

/**
 * Create a Stripe PaymentIntent for Apple Pay / Payment Request,
 * or redeem a Cash App confirmation code into credits metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "intent");

    if (action === "redeem_cashapp") {
      const pack = parseLocalRedeemCode(String(body.code || ""));
      if (!pack) {
        return NextResponse.json(
          { error: "Invalid code. Use the format shown next to your Cash App pack." },
          { status: 400 },
        );
      }
      return NextResponse.json({
        ok: true,
        packId: pack.id,
        credits: pack.credits,
        disclaimer: ENTERTAINMENT_DISCLAIMER,
      });
    }

    if (action === "intent") {
      const pack = getCreditPack(String(body.packId || ""));
      if (!pack) {
        return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
      }
      if (!hasCompleteStripeEnvKeys()) {
        return NextResponse.json(
          {
            error: "Apple Pay unavailable — Stripe is not configured. Use Cash App.",
            fallback: "cashapp",
            cashAppUrl: cashAppPackUrl(pack),
            redeemHint: makeCashAppRedeemHint(pack),
          },
          { status: 503 },
        );
      }
      const stripe = await getUncachableStripeClient();
      const intent = await stripe.paymentIntents.create({
        amount: pack.priceCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          product: "steal_bundle_credits",
          packId: pack.id,
          credits: String(pack.credits),
          entertainment_only: "true",
        },
        description: `Steal Bundle ${pack.label} (${pack.credits} entertainment credits)`,
      });
      return NextResponse.json({
        clientSecret: intent.client_secret,
        packId: pack.id,
        credits: pack.credits,
        amount: pack.priceCents,
        disclaimer: ENTERTAINMENT_DISCLAIMER,
      });
    }

    if (action === "confirm_intent") {
      const pack = getCreditPack(String(body.packId || ""));
      const paymentIntentId = String(body.paymentIntentId || "");
      if (!pack || !paymentIntentId) {
        return NextResponse.json({ error: "packId and paymentIntentId required" }, { status: 400 });
      }
      if (!hasCompleteStripeEnvKeys()) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
      }
      const stripe = await getUncachableStripeClient();
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== "succeeded") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
      }
      if (intent.metadata?.packId !== pack.id) {
        return NextResponse.json({ error: "Pack mismatch" }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        packId: pack.id,
        credits: pack.credits,
        disclaimer: ENTERTAINMENT_DISCLAIMER,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("steal-bundle credits:", err);
    return NextResponse.json({ error: "Payment request failed" }, { status: 500 });
  }
}
