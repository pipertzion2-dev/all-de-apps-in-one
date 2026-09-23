import { NextRequest, NextResponse } from "next/server";
import { LACE_PACKS, OLD_MAN_BUNDLE, PASS_CONFIG } from "@/lib/clean-sneaks/monetization/config";
import {
  signClaimPayload,
  serverHasClaimed,
  serverMarkClaimed,
} from "@/lib/clean-sneaks/monetization/security";
import { getUncachableStripeClient, hasCompleteStripeEnvKeys } from "@/lib/stripe/client";
import { ENTERTAINMENT_DISCLAIMER } from "@/lib/clean-sneaks/casino/credit-packs";

export const dynamic = "force-dynamic";

type ProductKind = "old_mans_bundle" | "laces_pack" | "pass";

function resolveProduct(kind: ProductKind, packId?: string) {
  if (kind === "old_mans_bundle") {
    return {
      id: OLD_MAN_BUNDLE.id,
      storeProductId: OLD_MAN_BUNDLE.storeProductId,
      amount: OLD_MAN_BUNDLE.priceCents,
      label: OLD_MAN_BUNDLE.title,
    };
  }
  if (kind === "pass") {
    return {
      id: PASS_CONFIG.id,
      storeProductId: PASS_CONFIG.storeProductId,
      amount: PASS_CONFIG.priceCents,
      label: PASS_CONFIG.title,
    };
  }
  const pack = LACE_PACKS.find((p) => p.id === packId);
  if (!pack) return null;
  return {
    id: pack.id,
    storeProductId: pack.storeProductId,
    amount: pack.priceCents,
    label: pack.label,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "intent");
    const kind = String(body.kind || "") as ProductKind;

    if (action === "restore") {
      // Platform restore hook — client re-applies from signed receipts it already holds.
      const receiptId = String(body.receiptId || "").slice(0, 128);
      if (!receiptId) {
        return NextResponse.json({ error: "receiptId required" }, { status: 400 });
      }
      const claimId = `restore:${receiptId}`;
      if (serverHasClaimed(claimId)) {
        return NextResponse.json({ ok: true, duplicate: true, claimId });
      }
      serverMarkClaimed(claimId);
      return NextResponse.json({
        ok: true,
        duplicate: false,
        claimId,
        signature: signClaimPayload(claimId),
        disclaimer: ENTERTAINMENT_DISCLAIMER,
      });
    }

    const product = resolveProduct(kind, body.packId ? String(body.packId) : undefined);
    if (!product) {
      return NextResponse.json({ error: "Unknown product" }, { status: 400 });
    }

    if (action === "intent") {
      if (!hasCompleteStripeEnvKeys()) {
        return NextResponse.json(
          {
            error: "Card / Apple Pay unavailable — configure Stripe or buy with Laces / Cash App.",
            fallback: "laces_or_cashapp",
            product,
            disclaimer: ENTERTAINMENT_DISCLAIMER,
          },
          { status: 503 },
        );
      }
      const stripe = await getUncachableStripeClient();
      const intent = await stripe.paymentIntents.create({
        amount: product.amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          product: "klean_sneaks_iap",
          productId: product.id,
          storeProductId: product.storeProductId,
          kind,
          entertainment_only: "true",
        },
        description: `Klean Sneaks · ${product.label}`,
      });
      return NextResponse.json({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        product,
        disclaimer: ENTERTAINMENT_DISCLAIMER,
      });
    }

    if (action === "confirm") {
      const paymentIntentId = String(body.paymentIntentId || "");
      if (!paymentIntentId || !hasCompleteStripeEnvKeys()) {
        return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
      }
      const stripe = await getUncachableStripeClient();
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== "succeeded") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
      }
      if (intent.metadata?.productId !== product.id) {
        return NextResponse.json({ error: "Product mismatch" }, { status: 400 });
      }
      const claimId = `purchase:${intent.id}`;
      if (serverHasClaimed(claimId)) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          claimId,
          productId: product.id,
          kind,
        });
      }
      serverMarkClaimed(claimId);
      return NextResponse.json({
        ok: true,
        duplicate: false,
        claimId,
        productId: product.id,
        kind,
        storeProductId: product.storeProductId,
        signature: signClaimPayload(`${claimId}|purchase|${intent.id}`),
        disclaimer: ENTERTAINMENT_DISCLAIMER,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("monetization purchase:", err);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
