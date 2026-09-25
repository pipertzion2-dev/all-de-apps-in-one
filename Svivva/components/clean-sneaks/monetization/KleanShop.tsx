"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  claimDailyReward,
  dailyAdBonusOffer,
  getShopCatalog,
  markDailyAdBonusClaimed,
  previewDailyReward,
  purchaseBoostWithLaces,
  purchaseCosmeticWithLaces,
  readWallet,
  trackMonetization,
  unlockPremiumPass,
  type RewardedOffer,
  type ShopSectionId,
} from "@/lib/clean-sneaks/monetization";
import { OldManBundleScreen } from "./OldManBundleScreen";
import { RewardClaimModal } from "./RewardClaimModal";
import { buildRewardedOffer } from "@/lib/clean-sneaks/monetization";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SECTION_LABEL: Record<ShopSectionId, string> = {
  featured: "Featured",
  old_mans_bundle: "Old Man's Bundle",
  sneakers: "Sneakers",
  cosmetics: "Cosmetics",
  currency: "Currency",
  boosts: "Boosts",
  pass: "Street Pass",
};

export function KleanShop({ open, onClose }: Props) {
  const [section, setSection] = useState<ShopSectionId>("featured");
  const [wallet, setWallet] = useState(() => readWallet());
  const [bundleOpen, setBundleOpen] = useState(false);
  const [dailyOffer, setDailyOffer] = useState<RewardedOffer | null>(null);
  const [flatOffer, setFlatOffer] = useState<RewardedOffer | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const catalog = useMemo(() => getShopCatalog(wallet), [wallet]);
  const daily = previewDailyReward();

  useEffect(() => {
    if (open) {
      setWallet(readWallet());
      trackMonetization("shop_opened", {});
    }
  }, [open]);

  if (!open) return null;

  const items = catalog.items.filter((i) => i.section === section);

  const refresh = () => setWallet(readWallet());

  return (
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-black/80 sm:items-center"
      data-testid="klean-shop"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#d4af37]/35 bg-[#0c0a08] sm:rounded-2xl">
        <div className="border-b border-[#d4af37]/25 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">Corner Store</p>
              <h2 className="font-serif text-2xl text-[#f7e7b0]">Klean Sneaks Shop</h2>
              <p className="mt-1 text-xs text-[#e8dcc0]/60">
                {wallet.credits.toLocaleString()} Credits · {wallet.laces} Laces
              </p>
            </div>
            <Button variant="ghost" className="text-[#e8dcc0]/55" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {catalog.sections.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs uppercase tracking-wide ${
                  section === id
                    ? "bg-[#d4af37] text-[#1a1008]"
                    : "border border-[#d4af37]/30 text-[#e8dcc0]/70"
                }`}
                data-testid={`shop-section-${id}`}
              >
                {SECTION_LABEL[id]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[#d4af37]/25 bg-black/35 p-3"
              data-testid={`shop-item-${item.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-lg text-[#f7e7b0]">{item.title}</p>
                  <p className="text-xs text-[#e8dcc0]/60">{item.blurb}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[#d4af37]/80">
                    {item.access === "free"
                      ? "FREE"
                      : item.access === "watch_ad"
                        ? "WATCH AD"
                        : "PURCHASE"}
                    {item.gameplayAdvantage ? " · gameplay advantage disclosed" : ""}
                  </p>
                </div>
                {item.owned && <span className="text-[10px] uppercase text-[#7dffb2]">Owned</span>}
              </div>
              <ul className="mt-2 text-[11px] text-[#ffd76a]/80">
                {item.contentsPreview.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.id === "old_mans_bundle" && !item.owned && (
                  <Button
                    size="sm"
                    className="bg-[#d4af37] text-[#1a1008]"
                    onClick={() => setBundleOpen(true)}
                    data-testid="button-open-old-man-bundle"
                  >
                    Open bundle
                  </Button>
                )}
                {item.id === "daily_login" && (
                  <Button
                    size="sm"
                    className="bg-[#d4af37] text-[#1a1008]"
                    disabled={!daily.available}
                    onClick={() => {
                      const r = claimDailyReward();
                      if (r.ok) {
                        trackMonetization("daily_reward_claimed", { streak: daily.streakAfter });
                        refresh();
                        const offer = dailyAdBonusOffer();
                        if (offer) setDailyOffer(offer);
                      } else if ("reason" in r) setMsg(r.reason || "Unavailable");
                    }}
                    data-testid="button-claim-daily"
                  >
                    {daily.available ? `Claim day ${daily.dayIndex + 1}` : "Claimed today"}
                  </Button>
                )}
                {item.id === "watch_ad_credits" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#ffd76a]/40 text-[#ffd76a]"
                    onClick={() => {
                      const offer = buildRewardedOffer({
                        context: "flat_bonus",
                        baseCredits: 0,
                      });
                      if (offer) setFlatOffer(offer);
                      else setMsg("Ad bonus unavailable (limit or cooldown).");
                    }}
                  >
                    Watch ad
                  </Button>
                )}
                {item.section === "sneakers" || item.section === "cosmetics"
                  ? !item.owned &&
                    item.priceLaces != null && (
                      <Button
                        size="sm"
                        className="bg-[#7a1028] text-[#f7e7b0]"
                        onClick={() => {
                          const r = purchaseCosmeticWithLaces(item.id);
                          if (r.ok) refresh();
                          else if ("reason" in r) setMsg(r.reason);
                        }}
                      >
                        {item.priceLaces} Laces
                      </Button>
                    )
                  : null}
                {item.section === "boosts" && item.priceLaces != null && (
                  <Button
                    size="sm"
                    className="bg-[#7a1028] text-[#f7e7b0]"
                    onClick={() => {
                      const r = purchaseBoostWithLaces(item.id);
                      if (r.ok) {
                        trackMonetization("boost_activated", { boostId: item.id });
                        refresh();
                      } else if ("reason" in r) setMsg(r.reason);
                    }}
                  >
                    Activate · {item.priceLaces} Laces
                  </Button>
                )}
                {item.section === "pass" && !item.owned && (
                  <Button
                    size="sm"
                    className="bg-[#d4af37] text-[#1a1008]"
                    onClick={() => {
                      const r = unlockPremiumPass("laces");
                      if (r.ok) {
                        trackMonetization("pass_purchased", { method: "laces" });
                        refresh();
                      } else if ("reason" in r) setMsg(r.reason);
                    }}
                  >
                    Unlock Premium · {item.priceLaces} Laces
                  </Button>
                )}
                {item.section === "currency" && item.priceCents != null && (
                  <p className="text-[11px] text-[#e8dcc0]/55">
                    Earn credits on the walk — unlock table upgrades in the casino lobby
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {msg && (
          <p className="border-t border-[#d4af37]/20 px-4 py-2 text-center text-xs text-[#ffd76a]">
            {msg}
          </p>
        )}
      </div>

      <OldManBundleScreen
        open={bundleOpen}
        onClose={() => {
          setBundleOpen(false);
          refresh();
        }}
        onPurchased={refresh}
      />

      <RewardClaimModal
        open={Boolean(dailyOffer)}
        title="Daily Bonus"
        subtitle="Normal daily already claimed. Optional ad bonus:"
        offer={dailyOffer}
        onClose={() => setDailyOffer(null)}
        onClaimed={() => {
          markDailyAdBonusClaimed();
          refresh();
        }}
      />

      <RewardClaimModal
        open={Boolean(flatOffer)}
        title="Street Tip"
        offer={flatOffer}
        onClose={() => setFlatOffer(null)}
        onClaimed={refresh}
      />
    </div>
  );
}
