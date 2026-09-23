import { NextRequest, NextResponse } from "next/server";
import {
  AD_REWARD_CONFIG,
  BOOST_CATALOG,
  COSMETIC_PRODUCTS,
  DAILY_REWARD_CONFIG,
  LACE_PACKS,
  OFFLINE_REWARD_CONFIG,
  OLD_MAN_BUNDLE,
  PASS_CONFIG,
  PREMIUM_CURRENCY,
  SOFT_CURRENCY,
} from "@/lib/clean-sneaks/monetization/config";
import { getShopCatalog } from "@/lib/clean-sneaks/monetization/shop";

export const dynamic = "force-dynamic";

/** Public catalog + economy knobs for clients and remote config mirrors. */
export async function GET() {
  return NextResponse.json({
    softCurrency: SOFT_CURRENCY,
    premiumCurrency: PREMIUM_CURRENCY,
    oldMansBundle: OLD_MAN_BUNDLE,
    lacePacks: LACE_PACKS,
    cosmetics: COSMETIC_PRODUCTS,
    boosts: BOOST_CATALOG,
    pass: {
      id: PASS_CONFIG.id,
      title: PASS_CONFIG.title,
      priceCents: PASS_CONFIG.priceCents,
      priceLaces: PASS_CONFIG.priceLaces,
      storeProductId: PASS_CONFIG.storeProductId,
      levels: PASS_CONFIG.levels.length,
    },
    adRewards: AD_REWARD_CONFIG,
    daily: DAILY_REWARD_CONFIG,
    offline: OFFLINE_REWARD_CONFIG,
    shop: getShopCatalog(),
  });
}

export async function POST(request: NextRequest) {
  // Reserved for authenticated remote config overrides later.
  void request;
  return NextResponse.json({ ok: true, note: "Catalog is config-driven in-repo." });
}
