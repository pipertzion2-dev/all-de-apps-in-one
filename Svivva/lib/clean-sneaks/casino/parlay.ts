/**
 * Virtual-credit parlays for Steal the Old Man's Bundle.
 * Settles in entertainment chips only — never cash.
 */

export type ParlayLegId =
  | "win_hand"
  | "steal_once"
  | "steal_twice"
  | "biggest_bundle"
  | "no_drop"
  | "clear_table";

export type ParlayLegDef = {
  id: ParlayLegId;
  label: string;
  hint: string;
  /** American-style decimal odds contribution (multiplicative). */
  odds: number;
};

export const PARLAY_LEGS: readonly ParlayLegDef[] = [
  {
    id: "win_hand",
    label: "Win the hand",
    hint: "Finish with the largest bundle (solo win, no tie).",
    odds: 1.75,
  },
  {
    id: "steal_once",
    label: "Steal ≥1 bundle",
    hint: "Steal another player's bundle at least once.",
    odds: 1.45,
  },
  {
    id: "steal_twice",
    label: "Steal ≥2 bundles",
    hint: "Pull off two or more steals in one deal.",
    odds: 2.1,
  },
  {
    id: "biggest_bundle",
    label: "Bundle of 8+",
    hint: "End with at least eight cards in your bundle.",
    odds: 1.9,
  },
  {
    id: "no_drop",
    label: "No table drops",
    hint: "Never place a card onto the open table.",
    odds: 2.4,
  },
  {
    id: "clear_table",
    label: "Clear the table",
    hint: "Match the last open table card at least once.",
    odds: 1.55,
  },
] as const;

export const PARLAY_MIN_STAKE = 25;
export const PARLAY_MAX_LEGS = 4;
export const PARLAY_MIN_LEGS = 2;

export type ParlayTicket = {
  id: string;
  stake: number;
  legIds: ParlayLegId[];
  combinedOdds: number;
  potentialPayout: number;
  placedAt: number;
};

export type HandStats = {
  humanWonSolo: boolean;
  steals: number;
  bundleSize: number;
  dropsToTable: number;
  clearedTable: boolean;
};

export function getLeg(id: ParlayLegId): ParlayLegDef | undefined {
  return PARLAY_LEGS.find((l) => l.id === id);
}

export function combineOdds(legIds: ParlayLegId[]): number {
  if (legIds.length < PARLAY_MIN_LEGS) return 0;
  let product = 1;
  for (const id of legIds) {
    const leg = getLeg(id);
    if (!leg) return 0;
    product *= leg.odds;
  }
  return Math.round(product * 100) / 100;
}

export function potentialPayout(stake: number, legIds: ParlayLegId[]): number {
  const odds = combineOdds(legIds);
  if (odds <= 0 || stake < PARLAY_MIN_STAKE) return 0;
  return Math.max(0, Math.floor(stake * odds));
}

export function canPlaceParlay(
  credits: number,
  stake: number,
  legIds: ParlayLegId[],
): { ok: true } | { ok: false; reason: string } {
  const unique = [...new Set(legIds)];
  if (unique.length !== legIds.length) {
    return { ok: false, reason: "Each parlay leg can only be selected once." };
  }
  if (legIds.length < PARLAY_MIN_LEGS) {
    return { ok: false, reason: `Pick at least ${PARLAY_MIN_LEGS} legs.` };
  }
  if (legIds.length > PARLAY_MAX_LEGS) {
    return { ok: false, reason: `At most ${PARLAY_MAX_LEGS} legs.` };
  }
  if (!Number.isFinite(stake) || stake < PARLAY_MIN_STAKE) {
    return { ok: false, reason: `Minimum stake is ${PARLAY_MIN_STAKE} credits.` };
  }
  if (stake > credits) {
    return { ok: false, reason: "Not enough credits for this stake." };
  }
  for (const id of legIds) {
    if (!getLeg(id)) return { ok: false, reason: "Unknown parlay leg." };
  }
  return { ok: true };
}

export function placeParlay(
  credits: number,
  stake: number,
  legIds: ParlayLegId[],
  idFactory: () => string = () => `parlay_${Date.now().toString(36)}`,
): { ok: true; ticket: ParlayTicket; creditsAfter: number } | { ok: false; reason: string } {
  const check = canPlaceParlay(credits, stake, legIds);
  if (!check.ok) return check;
  const odds = combineOdds(legIds);
  const ticket: ParlayTicket = {
    id: idFactory(),
    stake: Math.floor(stake),
    legIds: [...legIds],
    combinedOdds: odds,
    potentialPayout: potentialPayout(stake, legIds),
    placedAt: Date.now(),
  };
  return {
    ok: true,
    ticket,
    creditsAfter: Math.max(0, Math.floor(credits - ticket.stake)),
  };
}

export function legHit(legId: ParlayLegId, stats: HandStats): boolean {
  switch (legId) {
    case "win_hand":
      return stats.humanWonSolo;
    case "steal_once":
      return stats.steals >= 1;
    case "steal_twice":
      return stats.steals >= 2;
    case "biggest_bundle":
      return stats.bundleSize >= 8;
    case "no_drop":
      return stats.dropsToTable === 0;
    case "clear_table":
      return stats.clearedTable;
    default:
      return false;
  }
}

export function settleParlay(
  ticket: ParlayTicket,
  stats: HandStats,
): {
  won: boolean;
  payout: number;
  hits: Array<{ id: ParlayLegId; hit: boolean }>;
} {
  const hits = ticket.legIds.map((id) => ({ id, hit: legHit(id, stats) }));
  const won = hits.every((h) => h.hit);
  return {
    won,
    payout: won ? ticket.potentialPayout : 0,
    hits,
  };
}
