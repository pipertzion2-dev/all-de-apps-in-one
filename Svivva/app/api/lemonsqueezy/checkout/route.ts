import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureBillingColumns } from "@/lib/billing/ensure-billing-columns";
import { createLemonSqueezyCheckoutUrl } from "@/lib/lemonsqueezy/checkout";
import { loadLemonSqueezyConfig, lemonSqueezyCheckoutCapable } from "@/lib/lemonsqueezy/config";

const bodySchema = z.object({
  tier: z.enum(["pro", "enterprise"]),
});

export async function POST(req: NextRequest) {
  try {
    await ensureBillingColumns();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to subscribe" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const config = await loadLemonSqueezyConfig();
    if (!lemonSqueezyCheckoutCapable(config, parsed.data.tier)) {
      return NextResponse.json({ error: "Lemon Squeezy is not configured for this plan" }, { status: 503 });
    }

    const checkout = await createLemonSqueezyCheckoutUrl(config, parsed.data.tier, {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({ url: checkout.url, provider: "lemonsqueezy", mode: checkout.mode });
  } catch (e) {
    console.error("[lemonsqueezy/checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
