/**
 * Entertainment credit packs for Steal the Bundle.
 * Apple Pay (via Stripe) and Cash App buy virtual chips — never redeemable for cash.
 */

import { getCashAppTag } from "@/lib/interim-payments";

export type CreditPackId = "stack_small" | "stack_medium" | "stack_large";

export type CreditPack = {
  id: CreditPackId;
  label: string;
  credits: number;
  priceCents: number;
  /** Cash App dollar amount string (whole dollars preferred for deep links). */
  cashAppDollars: number;
};

export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "stack_small", label: "Starter stack", credits: 250, priceCents: 299, cashAppDollars: 3 },
  { id: "stack_medium", label: "Table stack", credits: 750, priceCents: 699, cashAppDollars: 7 },
  { id: "stack_large", label: "High roller", credits: 2000, priceCents: 1499, cashAppDollars: 15 },
] as const;

export const ENTERTAINMENT_DISCLAIMER =
  "Credits are entertainment chips for Steal the Old Man's Bundle only. They have no cash value and cannot be withdrawn. Must be 18+.";

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function cashAppPackUrl(pack: CreditPack, tag = getCashAppTag()): string {
  const handle = tag.replace(/^\$/, "");
  return `https://cash.app/$${handle}/${pack.cashAppDollars}`;
}

/** Short redeem codes shown after Cash App / manual confirm (demo-safe local flow). */
export function makeCashAppRedeemHint(pack: CreditPack): string {
  return `After Cash App payment, enter code SB-${pack.cashAppDollars}-${pack.credits}`;
}

export function parseLocalRedeemCode(code: string): CreditPack | null {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^SB-(\d+)-(\d+)$/);
  if (!match) return null;
  const dollars = Number(match[1]);
  const credits = Number(match[2]);
  return (
    CREDIT_PACKS.find((p) => p.cashAppDollars === dollars && p.credits === credits) ?? null
  );
}

export function formatPackPrice(pack: CreditPack): string {
  return `$${(pack.priceCents / 100).toFixed(2)}`;
}
