import {
  BOOST_CATALOG,
  COSMETIC_PRODUCTS,
  CREDIT_PACKS,
  LACE_PACKS,
  OLD_MAN_BUNDLE,
  PASS_CONFIG,
  PREMIUM_CURRENCY,
  SOFT_CURRENCY,
} from "./config";
import { oldManBundleRewardLines } from "./rewards";
import type { RewardLine } from "./types";
import { commitClaim, readWallet, spendLaces, writeWallet } from "./wallet";
import { makeClaimId } from "./rewards";

export type ShopSectionId =
  | "featured"
  | "old_mans_bundle"
  | "sneakers"
  | "cosmetics"
  | "currency"
  | "boosts"
  | "pass";

export type ShopItem = {
  id: string;
  section: ShopSectionId;
  title: string;
  blurb: string;
  access: "free" | "watch_ad" | "purchase";
  priceCents: number | null;
  priceLaces: number | null;
  storeProductId: string | null;
  owned: boolean;
  gameplayAdvantage: boolean;
  contentsPreview: string[];
};

export function getShopCatalog(wallet = readWallet()): {
  soft: typeof SOFT_CURRENCY;
  premium: typeof PREMIUM_CURRENCY;
  sections: ShopSectionId[];
  items: ShopItem[];
} {
  const items: ShopItem[] = [];

  items.push({
    id: OLD_MAN_BUNDLE.id,
    section: "old_mans_bundle",
    title: OLD_MAN_BUNDLE.title,
    blurb: OLD_MAN_BUNDLE.subtitle,
    access: "purchase",
    priceCents: OLD_MAN_BUNDLE.priceCents,
    priceLaces: OLD_MAN_BUNDLE.allowLacePurchase ? OLD_MAN_BUNDLE.priceLaces : null,
    storeProductId: OLD_MAN_BUNDLE.storeProductId,
    owned: wallet.ownedProducts.includes(OLD_MAN_BUNDLE.id),
    gameplayAdvantage: true,
    contentsPreview: [
      `${OLD_MAN_BUNDLE.contents.credits} Credits`,
      `${OLD_MAN_BUNDLE.contents.laces} Laces`,
      `Colorways: ${OLD_MAN_BUNDLE.contents.cosmeticIds.join(", ")}`,
      `Outfit: ${OLD_MAN_BUNDLE.contents.outfitId}`,
      `Badge & title`,
      `Boost: ${OLD_MAN_BUNDLE.contents.boostId}`,
    ],
  });

  for (const pack of LACE_PACKS) {
    items.push({
      id: pack.id,
      section: pack.kind === "bundle" ? "featured" : "currency",
      title: pack.label,
      blurb: `${"laces" in pack ? pack.laces : 0} ${PREMIUM_CURRENCY.name}`,
      access: "purchase",
      priceCents: pack.priceCents,
      priceLaces: null,
      storeProductId: pack.storeProductId,
      owned: false,
      gameplayAdvantage: false,
      contentsPreview: [
        `${pack.laces} Laces`,
        ...("credits" in pack && pack.credits ? [`${pack.credits} Credits`] : []),
      ],
    });
  }

  for (const pack of CREDIT_PACKS) {
    items.push({
      id: pack.id,
      section: "currency",
      title: pack.label,
      blurb: `${pack.credits.toLocaleString()} Credits`,
      access: "purchase",
      priceCents: pack.priceCents,
      priceLaces: null,
      storeProductId: `klean_${pack.id}`,
      owned: false,
      gameplayAdvantage: false,
      contentsPreview: [`${pack.credits} Credits`],
    });
  }

  for (const c of COSMETIC_PRODUCTS) {
    const owned =
      wallet.ownedCosmetics.includes(c.id) ||
      wallet.ownedOutfits.includes(c.id) ||
      wallet.ownedCollectibles.includes(c.id);
    items.push({
      id: c.id,
      section: c.kind === "colorway" ? "sneakers" : "cosmetics",
      title: c.label,
      blurb: c.gameplayAdvantage
        ? "Includes a disclosed gameplay effect."
        : "Cosmetic only — no hidden power.",
      access: "purchase",
      priceCents: c.priceCents,
      priceLaces: c.priceLaces,
      storeProductId: c.storeProductId,
      owned,
      gameplayAdvantage: c.gameplayAdvantage,
      contentsPreview: [c.kind],
    });
  }

  for (const b of BOOST_CATALOG) {
    items.push({
      id: b.id,
      section: "boosts",
      title: b.label,
      blurb: b.blurb,
      access: "purchase",
      priceCents: b.priceCents,
      priceLaces: b.priceLaces,
      storeProductId: b.storeProductId,
      owned: false,
      gameplayAdvantage: b.gameplayAdvantage,
      contentsPreview: [`${b.multiplier}× · ${Math.round(b.durationMs / 60000)}m`],
    });
  }

  items.push({
    id: PASS_CONFIG.id,
    section: "pass",
    title: PASS_CONFIG.title,
    blurb: PASS_CONFIG.subtitle,
    access: "purchase",
    priceCents: PASS_CONFIG.priceCents,
    priceLaces: PASS_CONFIG.priceLaces,
    storeProductId: PASS_CONFIG.storeProductId,
    owned: wallet.pass.premium && wallet.pass.seasonId === PASS_CONFIG.id,
    gameplayAdvantage: false,
    contentsPreview: ["Free track", "Premium track", `${PASS_CONFIG.levels.length} levels`],
  });

  // Free daily / ad entries for shop clarity
  items.push({
    id: "daily_login",
    section: "featured",
    title: "Daily Corner Drop",
    blurb: "Free login reward — ads optional for a bonus after.",
    access: "free",
    priceCents: null,
    priceLaces: null,
    storeProductId: null,
    owned: false,
    gameplayAdvantage: false,
    contentsPreview: ["Credits", "Streak cosmetics"],
  });
  items.push({
    id: "watch_ad_credits",
    section: "featured",
    title: "Watch Ad · Street Tip",
    blurb: "Opt-in only. Exact bonus shown before you watch.",
    access: "watch_ad",
    priceCents: null,
    priceLaces: null,
    storeProductId: null,
    owned: false,
    gameplayAdvantage: false,
    contentsPreview: ["Bonus Credits"],
  });

  return {
    soft: SOFT_CURRENCY,
    premium: PREMIUM_CURRENCY,
    sections: [
      "featured",
      "old_mans_bundle",
      "sneakers",
      "cosmetics",
      "currency",
      "boosts",
      "pass",
    ],
    items,
  };
}

export function purchaseOldManBundleWithLaces() {
  const wallet = readWallet();
  if (wallet.ownedProducts.includes(OLD_MAN_BUNDLE.id)) {
    return { ok: true as const, duplicate: true, wallet };
  }
  const spent = spendLaces(wallet, OLD_MAN_BUNDLE.priceLaces);
  if (!spent.ok) return spent;
  const claimId = makeClaimId(["bundle", OLD_MAN_BUNDLE.id, "laces"]);
  writeWallet(spent.wallet);
  return commitClaim({
    claimId,
    source: "bundle",
    lines: oldManBundleRewardLines(),
    providerRef: "laces",
  });
}

export function grantOldManBundleFromPurchase(receiptId: string) {
  const claimId = makeClaimId(["bundle", OLD_MAN_BUNDLE.id, receiptId]);
  const result = commitClaim({
    claimId,
    source: "purchase",
    lines: oldManBundleRewardLines(),
    providerRef: receiptId,
  });
  if (result.ok && !result.duplicate) {
    writeWallet({
      ...result.wallet,
      analytics: {
        ...result.wallet.analytics,
        purchasesCompleted: result.wallet.analytics.purchasesCompleted + 1,
        purchaseRevenueCents:
          result.wallet.analytics.purchaseRevenueCents + OLD_MAN_BUNDLE.priceCents,
      },
    });
  }
  return { ...result, wallet: readWallet() };
}

export function purchaseCosmeticWithLaces(cosmeticId: string) {
  const product = COSMETIC_PRODUCTS.find((c) => c.id === cosmeticId);
  if (!product) return { ok: false as const, reason: "Unknown cosmetic." };
  const wallet = readWallet();
  if (
    wallet.ownedCosmetics.includes(cosmeticId) ||
    wallet.ownedOutfits.includes(cosmeticId) ||
    wallet.ownedCollectibles.includes(cosmeticId)
  ) {
    return { ok: true as const, duplicate: true, wallet };
  }
  const spent = spendLaces(wallet, product.priceLaces);
  if (!spent.ok) return spent;
  writeWallet(spent.wallet);
  const kind =
    product.kind === "colorway" ? "cosmetic" : product.kind === "outfit" ? "outfit" : "collectible";
  const claimId = makeClaimId(["cosmetic", cosmeticId, "laces"]);
  return commitClaim({
    claimId,
    source: "purchase",
    lines: [{ kind, itemId: cosmeticId }],
    providerRef: "laces",
  });
}

export function purchaseBoostWithLaces(boostId: string) {
  const def = BOOST_CATALOG.find((b) => b.id === boostId);
  if (!def) return { ok: false as const, reason: "Unknown boost." };
  const wallet = readWallet();
  const spent = spendLaces(wallet, def.priceLaces);
  if (!spent.ok) return spent;
  writeWallet(spent.wallet);
  const claimId = makeClaimId(["boost", boostId, Date.now()]);
  return commitClaim({
    claimId,
    source: "boost_activation",
    lines: [{ kind: "boost", boostId: def.id, durationMs: def.durationMs }],
    providerRef: "laces",
  });
}

export function purchaseLacePackLocal(packId: string, receiptId: string) {
  const pack = LACE_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: false as const, reason: "Unknown pack." };
  const lines: RewardLine[] = [{ kind: "laces", amount: pack.laces }];
  if ("credits" in pack && pack.credits) {
    lines.push({ kind: "credits", amount: pack.credits });
  }
  if ("cosmeticIds" in pack && pack.cosmeticIds) {
    for (const id of pack.cosmeticIds) lines.push({ kind: "cosmetic", itemId: id });
  }
  const claimId = makeClaimId(["lacespack", packId, receiptId]);
  const result = commitClaim({
    claimId,
    source: "purchase",
    lines,
    providerRef: receiptId,
  });
  if (result.ok && !result.duplicate) {
    writeWallet({
      ...result.wallet,
      analytics: {
        ...result.wallet.analytics,
        purchasesCompleted: result.wallet.analytics.purchasesCompleted + 1,
        purchaseRevenueCents: result.wallet.analytics.purchaseRevenueCents + pack.priceCents,
      },
    });
  }
  return { ...result, wallet: readWallet() };
}
