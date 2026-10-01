import { readWallet, writeWallet } from "@/lib/clean-sneaks/monetization/wallet";
import type { CreditPackId } from "./credit-packs";
import { readCasinoSession, writeCasinoSession } from "./session";
import type { SessionCasinoState } from "./types";

export type CasinoUpgradeId = CreditPackId;

export type CasinoUpgradeDef = {
  id: CasinoUpgradeId;
  label: string;
  blurb: string;
  /** One-time unlock cost in earned walking / table credits. */
  creditCost: number;
  winMultiplierAdd?: number;
  anteRatioMul?: number;
  minAnte?: number;
};

export const CASINO_UPGRADE_CATALOG: readonly CasinoUpgradeDef[] = [
  {
    id: "stack_small",
    label: "Starter stack",
    blurb: "+10% win credits when you take the hand.",
    creditCost: 250,
    winMultiplierAdd: 0.1,
  },
  {
    id: "stack_medium",
    label: "Table stack",
    blurb: "Ante uses 10% less of your chip stack.",
    creditCost: 750,
    anteRatioMul: 0.9,
  },
  {
    id: "stack_large",
    label: "High roller",
    blurb: "Min ante drops to 40 · +15% win credits.",
    creditCost: 2000,
    minAnte: 40,
    winMultiplierAdd: 0.15,
  },
] as const;

export const UPGRADE_UNLOCK_DISCLAIMER =
  "Upgrades spend credits you earned on the walk or at the table. They are permanent for this device and have no cash value.";

export type ResolvedUpgradeEffects = {
  minAnte: number;
  anteRatio: number;
  winMultiplier: number;
};

export function getCasinoUpgrade(id: string): CasinoUpgradeDef | undefined {
  return CASINO_UPGRADE_CATALOG.find((u) => u.id === id);
}

export function listUnlockedUpgrades(session = readCasinoSession()): CasinoUpgradeId[] {
  const raw = session.unlockedUpgrades;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is CasinoUpgradeId =>
    CASINO_UPGRADE_CATALOG.some((u) => u.id === id),
  );
}

export function resolveUpgradeEffects(
  unlockedIds: readonly string[],
): ResolvedUpgradeEffects {
  const baseMinAnte = 50;
  const baseAnteRatio = 0.12;
  const baseWin = 1.75;
  let minAnte = baseMinAnte;
  let anteRatio = baseAnteRatio;
  let winMultiplier = baseWin;

  for (const id of unlockedIds) {
    const def = getCasinoUpgrade(id);
    if (!def) continue;
    if (def.winMultiplierAdd) winMultiplier += def.winMultiplierAdd;
    if (def.anteRatioMul) anteRatio *= def.anteRatioMul;
    if (def.minAnte != null) minAnte = Math.min(minAnte, def.minAnte);
  }

  return { minAnte, anteRatio, winMultiplier };
}

export function isUpgradeUnlocked(id: CasinoUpgradeId, session = readCasinoSession()): boolean {
  return listUnlockedUpgrades(session).includes(id);
}

export type UnlockUpgradeResult =
  | { ok: true; session: SessionCasinoState }
  | { ok: false; reason: string };

/** Spend earned credits to permanently unlock a table upgrade. */
export function tryUnlockCasinoUpgrade(id: CasinoUpgradeId): UnlockUpgradeResult {
  const def = getCasinoUpgrade(id);
  if (!def) return { ok: false, reason: "Unknown upgrade." };
  const session = readCasinoSession();
  const unlocked = listUnlockedUpgrades(session);
  if (unlocked.includes(id)) return { ok: false, reason: "Already unlocked." };
  if (session.credits < def.creditCost) {
    return {
      ok: false,
      reason: `Need ${def.creditCost.toLocaleString()} credits (you have ${session.credits.toLocaleString()}).`,
    };
  }

  const next = writeCasinoSession({
    ...session,
    credits: session.credits - def.creditCost,
    unlockedUpgrades: [...unlocked, id],
  });

  if (typeof window !== "undefined") {
    try {
      const wallet = readWallet();
      writeWallet({ ...wallet, credits: next.credits });
    } catch {
      /* ignore */
    }
  }

  return { ok: true, session: next };
}
