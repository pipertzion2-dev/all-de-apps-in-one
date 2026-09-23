import {
  AD_REWARD_CONFIG,
  BOOST_CATALOG,
  MONETIZATION_CONFIG_VERSION,
  type BoostId,
} from "./config";
import type { ActiveBoost, ClaimRecord, PlayerWallet, RewardLine } from "./types";
import { readCasinoSession, setSessionCredits } from "../casino/session";

export const WALLET_KEY = "zzai.clean-sneaks.monetization.wallet.v1";
const CLAIM_CAP = 400;

export function utcDayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function emptyWallet(now = Date.now()): PlayerWallet {
  return {
    version: MONETIZATION_CONFIG_VERSION,
    credits: 0,
    laces: 0,
    ownedCosmetics: ["oilSlick"],
    ownedOutfits: [],
    ownedCollectibles: [],
    ownedBadges: [],
    ownedTitles: [],
    ownedProducts: [],
    activeBoosts: [],
    claimedIds: [],
    daily: { lastClaimDay: null, streak: 0, adBonusClaimedDay: null },
    pass: {
      seasonId: null,
      premium: false,
      xp: 0,
      claimedFreeLevels: [],
      claimedPremiumLevels: [],
      expiresAt: null,
    },
    ads: { day: null, completionsToday: 0, lastCompletionAt: null },
    offline: { lastSeenAt: now },
    walksCompleted: 0,
    analytics: {
      purchasesCompleted: 0,
      purchaseRevenueCents: 0,
      adCompletions: 0,
      shopOpens: 0,
    },
    updatedAt: now,
  };
}

function migrateFromCasino(wallet: PlayerWallet): PlayerWallet {
  try {
    const session = readCasinoSession();
    if (session.credits > wallet.credits) {
      wallet.credits = session.credits;
    }
  } catch {
    /* ignore */
  }
  return wallet;
}

export function readWallet(): PlayerWallet {
  if (typeof window === "undefined") return emptyWallet();
  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    if (!raw) return migrateFromCasino(emptyWallet());
    const parsed = JSON.parse(raw) as Partial<PlayerWallet>;
    const base = emptyWallet();
    const next: PlayerWallet = {
      ...base,
      ...parsed,
      ownedCosmetics: Array.isArray(parsed.ownedCosmetics)
        ? [...new Set(["oilSlick", ...parsed.ownedCosmetics.map(String)])]
        : base.ownedCosmetics,
      ownedOutfits: Array.isArray(parsed.ownedOutfits) ? parsed.ownedOutfits.map(String) : [],
      ownedCollectibles: Array.isArray(parsed.ownedCollectibles)
        ? parsed.ownedCollectibles.map(String)
        : [],
      ownedBadges: Array.isArray(parsed.ownedBadges) ? parsed.ownedBadges.map(String) : [],
      ownedTitles: Array.isArray(parsed.ownedTitles) ? parsed.ownedTitles.map(String) : [],
      ownedProducts: Array.isArray(parsed.ownedProducts) ? parsed.ownedProducts.map(String) : [],
      activeBoosts: Array.isArray(parsed.activeBoosts)
        ? (parsed.activeBoosts as ActiveBoost[])
        : [],
      claimedIds: Array.isArray(parsed.claimedIds) ? parsed.claimedIds.map(String) : [],
      daily: { ...base.daily, ...(parsed.daily || {}) },
      pass: { ...base.pass, ...(parsed.pass || {}) },
      ads: { ...base.ads, ...(parsed.ads || {}) },
      offline: { ...base.offline, ...(parsed.offline || {}) },
      analytics: { ...base.analytics, ...(parsed.analytics || {}) },
      credits: Math.max(0, Math.floor(Number(parsed.credits) || 0)),
      laces: Math.max(0, Math.floor(Number(parsed.laces) || 0)),
      walksCompleted: Math.max(0, Math.floor(Number(parsed.walksCompleted) || 0)),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
    return migrateFromCasino(next);
  } catch {
    return migrateFromCasino(emptyWallet());
  }
}

export function writeWallet(next: PlayerWallet): PlayerWallet {
  const cleaned = pruneBoosts({ ...next, updatedAt: Date.now() });
  if (cleaned.claimedIds.length > CLAIM_CAP) {
    cleaned.claimedIds = cleaned.claimedIds.slice(-CLAIM_CAP);
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(WALLET_KEY, JSON.stringify(cleaned));
    } catch {
      /* ignore */
    }
    // Keep casino session chips in sync for existing table ante flow.
    try {
      setSessionCredits(cleaned.credits);
    } catch {
      /* ignore */
    }
  }
  return cleaned;
}

export function pruneBoosts(wallet: PlayerWallet, now = Date.now()): PlayerWallet {
  return {
    ...wallet,
    activeBoosts: wallet.activeBoosts.filter((b) => b.expiresAt > now),
  };
}

export function hasClaimed(wallet: PlayerWallet, claimId: string): boolean {
  return wallet.claimedIds.includes(claimId);
}

export function syncCreditsFromCasino(): PlayerWallet {
  const wallet = readWallet();
  const session = readCasinoSession();
  if (session.credits !== wallet.credits) {
    return writeWallet({ ...wallet, credits: Math.max(wallet.credits, session.credits) });
  }
  return wallet;
}

export function applyRewardLines(wallet: PlayerWallet, lines: RewardLine[]): PlayerWallet {
  let next = pruneBoosts({ ...wallet });
  for (const line of lines) {
    switch (line.kind) {
      case "credits":
        next.credits = Math.max(0, next.credits + Math.floor(line.amount || 0));
        break;
      case "laces":
        next.laces = Math.max(0, next.laces + Math.floor(line.amount || 0));
        break;
      case "cosmetic":
        if (line.itemId && !next.ownedCosmetics.includes(line.itemId)) {
          next.ownedCosmetics = [...next.ownedCosmetics, line.itemId];
        }
        break;
      case "outfit":
        if (line.itemId && !next.ownedOutfits.includes(line.itemId)) {
          next.ownedOutfits = [...next.ownedOutfits, line.itemId];
        }
        break;
      case "collectible":
        if (line.itemId && !next.ownedCollectibles.includes(line.itemId)) {
          next.ownedCollectibles = [...next.ownedCollectibles, line.itemId];
        }
        break;
      case "badge":
        if (line.itemId && !next.ownedBadges.includes(line.itemId)) {
          next.ownedBadges = [...next.ownedBadges, line.itemId];
        }
        break;
      case "title":
        if (line.itemId && !next.ownedTitles.includes(line.itemId)) {
          next.ownedTitles = [...next.ownedTitles, line.itemId];
        }
        break;
      case "boost": {
        const def = BOOST_CATALOG.find((b) => b.id === (line.boostId || line.itemId));
        if (def) {
          const duration = line.durationMs ?? def.durationMs;
          next.activeBoosts = [
            ...next.activeBoosts.filter((b) => b.boostId !== def.id),
            {
              boostId: def.id,
              multiplier: def.multiplier,
              expiresAt: Date.now() + duration,
            },
          ];
        }
        break;
      }
      case "bundle_ownership":
        if (line.itemId && !next.ownedProducts.includes(line.itemId)) {
          next.ownedProducts = [...next.ownedProducts, line.itemId];
        }
        break;
      case "pass_xp":
        next.pass = {
          ...next.pass,
          xp: next.pass.xp + Math.max(0, Math.floor(line.amount || 0)),
        };
        break;
      default:
        break;
    }
  }
  return next;
}

export function spendLaces(
  wallet: PlayerWallet,
  amount: number,
): { ok: true; wallet: PlayerWallet } | { ok: false; reason: string } {
  const need = Math.max(0, Math.floor(amount));
  if (wallet.laces < need) return { ok: false, reason: "Not enough Laces." };
  return { ok: true, wallet: { ...wallet, laces: wallet.laces - need } };
}

export function activeMultiplier(wallet: PlayerWallet, boostId: BoostId, now = Date.now()): number {
  const hit = pruneBoosts(wallet, now).activeBoosts.find((b) => b.boostId === boostId);
  return hit?.multiplier ?? 1;
}

export function walkEarningsMultiplier(wallet: PlayerWallet, now = Date.now()): number {
  return activeMultiplier(wallet, "street_hustle", now);
}

export function canCompleteRewardedAd(
  wallet: PlayerWallet,
  now = Date.now(),
): { ok: true } | { ok: false; reason: string } {
  const day = utcDayKey(now);
  let completions = wallet.ads.completionsToday;
  if (wallet.ads.day !== day) completions = 0;
  if (completions >= AD_REWARD_CONFIG.dailyLimit) {
    return { ok: false, reason: "Daily ad bonus limit reached." };
  }
  if (
    wallet.ads.lastCompletionAt &&
    now - wallet.ads.lastCompletionAt < AD_REWARD_CONFIG.globalCooldownMs
  ) {
    return { ok: false, reason: "Ad bonus cooling down." };
  }
  return { ok: true };
}

export function markAdCompletion(wallet: PlayerWallet, now = Date.now()): PlayerWallet {
  const day = utcDayKey(now);
  const completions = wallet.ads.day === day ? wallet.ads.completionsToday + 1 : 1;
  return {
    ...wallet,
    ads: { day, completionsToday: completions, lastCompletionAt: now },
    analytics: {
      ...wallet.analytics,
      adCompletions: wallet.analytics.adCompletions + 1,
    },
  };
}

export type ClaimResult =
  | { ok: true; wallet: PlayerWallet; claim: ClaimRecord; duplicate: boolean }
  | { ok: false; reason: string };

export function commitClaim(input: {
  claimId: string;
  source: ClaimRecord["source"];
  lines: RewardLine[];
  providerRef?: string;
  wallet?: PlayerWallet;
}): ClaimResult {
  const claimId = String(input.claimId || "").trim();
  if (!claimId) return { ok: false, reason: "Missing claimId." };
  if (!input.lines.length) return { ok: false, reason: "Empty reward." };

  let wallet = input.wallet ?? readWallet();
  if (hasClaimed(wallet, claimId)) {
    return {
      ok: true,
      wallet,
      duplicate: true,
      claim: {
        claimId,
        source: input.source,
        lines: input.lines,
        createdAt: Date.now(),
        providerRef: input.providerRef,
      },
    };
  }

  wallet = applyRewardLines(wallet, input.lines);
  wallet = {
    ...wallet,
    claimedIds: [...wallet.claimedIds, claimId],
  };
  wallet = writeWallet(wallet);
  return {
    ok: true,
    wallet,
    duplicate: false,
    claim: {
      claimId,
      source: input.source,
      lines: input.lines,
      createdAt: Date.now(),
      providerRef: input.providerRef,
    },
  };
}
