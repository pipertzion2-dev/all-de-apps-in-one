import { PASS_CONFIG } from "./config";
import { claimBaseReward, makeClaimId } from "./rewards";
import type { RewardLine } from "./types";
import { readWallet, spendLaces, writeWallet } from "./wallet";

function levelLines(
  track: "free" | "premium",
  level: (typeof PASS_CONFIG.levels)[number],
): RewardLine[] {
  const src = track === "free" ? level.free : level.premium;
  const lines: RewardLine[] = [];
  if ("credits" in src && src.credits) lines.push({ kind: "credits", amount: src.credits });
  if ("laces" in src && src.laces) lines.push({ kind: "laces", amount: src.laces });
  if ("cosmeticId" in src && src.cosmeticId) {
    lines.push({ kind: "cosmetic", itemId: src.cosmeticId });
  }
  if ("boostId" in src && src.boostId) {
    lines.push({ kind: "boost", boostId: src.boostId });
  }
  if ("badgeId" in src && src.badgeId) {
    lines.push({ kind: "badge", itemId: src.badgeId });
  }
  return lines;
}

export function passProgress(wallet = readWallet()) {
  const levels = PASS_CONFIG.levels;
  let current: (typeof levels)[number] = levels[0]!;
  for (const lvl of levels) {
    if (wallet.pass.xp >= lvl.xp) current = lvl;
  }
  const next = levels.find((l) => l.xp > wallet.pass.xp) || null;
  return {
    seasonId: PASS_CONFIG.id,
    level: current.level,
    xp: wallet.pass.xp,
    premium: wallet.pass.premium,
    nextXp: next?.xp ?? null,
    expiresAt: wallet.pass.expiresAt,
    levels,
  };
}

export function unlockPremiumPass(method: "laces" | "purchase", receiptId?: string) {
  let wallet = readWallet();
  if (wallet.pass.premium && wallet.pass.seasonId === PASS_CONFIG.id) {
    return { ok: true as const, wallet, duplicate: true };
  }
  if (method === "laces") {
    const spent = spendLaces(wallet, PASS_CONFIG.priceLaces);
    if (!spent.ok) return spent;
    wallet = spent.wallet;
  }
  wallet = {
    ...wallet,
    pass: {
      ...wallet.pass,
      seasonId: PASS_CONFIG.id,
      premium: true,
      expiresAt: Date.now() + PASS_CONFIG.durationMs,
    },
    ownedProducts: wallet.ownedProducts.includes(PASS_CONFIG.id)
      ? wallet.ownedProducts
      : [...wallet.ownedProducts, PASS_CONFIG.id],
    analytics: {
      ...wallet.analytics,
      purchasesCompleted: wallet.analytics.purchasesCompleted + (method === "purchase" ? 1 : 0),
      purchaseRevenueCents:
        wallet.analytics.purchaseRevenueCents +
        (method === "purchase" ? PASS_CONFIG.priceCents : 0),
    },
  };
  writeWallet(wallet);
  return {
    ok: true as const,
    wallet: readWallet(),
    duplicate: false,
    receiptId,
  };
}

export function claimPassLevel(level: number, track: "free" | "premium") {
  const wallet = readWallet();
  const def = PASS_CONFIG.levels.find((l) => l.level === level);
  if (!def) return { ok: false as const, reason: "Unknown level." };
  if (wallet.pass.xp < def.xp) return { ok: false as const, reason: "Not enough XP yet." };
  if (track === "premium" && !wallet.pass.premium) {
    return { ok: false as const, reason: "Premium track locked." };
  }
  const claimed =
    track === "free" ? wallet.pass.claimedFreeLevels : wallet.pass.claimedPremiumLevels;
  if (claimed.includes(level)) {
    return { ok: true as const, duplicate: true, wallet };
  }
  const lines = levelLines(track, def);
  const claimId = makeClaimId(["pass", PASS_CONFIG.id, track, level]);
  const result = claimBaseReward({ claimId, source: "pass", lines });
  if (!result.ok) return result;
  if (!result.duplicate) {
    writeWallet({
      ...result.wallet,
      pass: {
        ...result.wallet.pass,
        claimedFreeLevels:
          track === "free"
            ? [...result.wallet.pass.claimedFreeLevels, level]
            : result.wallet.pass.claimedFreeLevels,
        claimedPremiumLevels:
          track === "premium"
            ? [...result.wallet.pass.claimedPremiumLevels, level]
            : result.wallet.pass.claimedPremiumLevels,
      },
    });
  }
  return { ...result, wallet: readWallet() };
}

export function addPassXpForWalk() {
  const claimId = makeClaimId(["passxp", "walk", Date.now()]);
  return claimBaseReward({
    claimId,
    source: "pass",
    lines: [{ kind: "pass_xp", amount: PASS_CONFIG.xpPerWalkComplete }],
  });
}
