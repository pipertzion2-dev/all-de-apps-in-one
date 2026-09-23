import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("localStorage", {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
});

vi.stubGlobal("window", globalThis);

import {
  AD_REWARD_CONFIG,
  OLD_MAN_BUNDLE,
  buildRewardedOffer,
  claimAdBonus,
  claimBaseReward,
  claimDailyReward,
  commitClaim,
  emptyWallet,
  makeClaimId,
  previewDailyReward,
  purchaseOldManBundleWithLaces,
  readWallet,
  writeWallet,
} from "@/lib/clean-sneaks/monetization";

describe("klean monetization rewards", () => {
  beforeEach(() => {
    localStorage.clear();
    writeWallet(emptyWallet(1_700_000_000_000));
  });

  it("is idempotent — same claimId cannot pay twice", () => {
    const claimId = makeClaimId(["test", "dup"]);
    const first = commitClaim({
      claimId,
      source: "rewarded_ad",
      lines: [{ kind: "credits", amount: 100 }],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.duplicate).toBe(false);
    expect(first.wallet.credits).toBe(100);

    const second = commitClaim({
      claimId,
      source: "rewarded_ad",
      lines: [{ kind: "credits", amount: 100 }],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.duplicate).toBe(true);
    expect(second.wallet.credits).toBe(100);
  });

  it("mission ad bonus grants uplift only, never locks the base", () => {
    writeWallet({ ...emptyWallet(), credits: 500, walksCompleted: 1 });
    const offer = buildRewardedOffer({
      context: "mission_complete",
      baseCredits: 500,
      walkId: "w1",
      now: Date.now(),
    });
    expect(offer).toBeTruthy();
    if (!offer) return;
    expect(offer.baseLines[0]?.amount).toBe(500);
    const bonus = Math.floor(500 * AD_REWARD_CONFIG.missionBonusMultiplier);
    expect(offer.previewLines[0]?.amount).toBe(bonus - 500);
    expect(offer.adLabel).toContain(String(bonus));

    const denied = claimAdBonus({ offer, token: "bad", adCompleted: true });
    expect(denied.ok).toBe(false);

    const closedEarly = claimAdBonus({ offer, token: offer.token, adCompleted: false });
    expect(closedEarly.ok).toBe(false);

    const ok = claimAdBonus({ offer, token: offer.token, adCompleted: true });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.wallet.credits).toBe(500 + (bonus - 500));
  });

  it("daily reward can be claimed once per UTC day without an ad", () => {
    const preview = previewDailyReward();
    expect(preview.available).toBe(true);
    const first = claimDailyReward();
    expect(first.ok).toBe(true);
    const second = claimDailyReward();
    expect(second.ok).toBe(false);
  });

  it("Old Man's Bundle grants contents once and tracks ownership", () => {
    writeWallet({ ...emptyWallet(), laces: OLD_MAN_BUNDLE.priceLaces + 5 });
    const first = purchaseOldManBundleWithLaces();
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.wallet.ownedProducts).toContain(OLD_MAN_BUNDLE.id);
    expect(first.wallet.ownedOutfits).toContain(OLD_MAN_BUNDLE.contents.outfitId);
    const again = purchaseOldManBundleWithLaces();
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.duplicate).toBe(true);
  });

  it("failed ad does not block base offline claim", () => {
    const offer = buildRewardedOffer({
      context: "offline_boost",
      baseCredits: 200,
      walkId: "off1",
    });
    expect(offer).toBeTruthy();
    if (!offer) return;
    const fail = claimAdBonus({ offer, token: offer.token, adCompleted: false });
    expect(fail.ok).toBe(false);
    const base = claimBaseReward({
      claimId: makeClaimId(["base", offer.offerId]),
      source: "offline",
      lines: offer.baseLines,
    });
    expect(base.ok).toBe(true);
    if (!base.ok) return;
    expect(base.wallet.credits).toBe(200);
  });

  it("persists wallet across read/write", () => {
    writeWallet({ ...readWallet(), laces: 42, credits: 900 });
    expect(readWallet().laces).toBe(42);
    expect(readWallet().credits).toBe(900);
  });
});
