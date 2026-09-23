"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  OLD_MAN_BUNDLE,
  describeLines,
  grantOldManBundleFromPurchase,
  oldManBundleRewardLines,
  purchaseOldManBundleWithLaces,
  readWallet,
  trackMonetization,
} from "@/lib/clean-sneaks/monetization";

type Props = {
  open: boolean;
  onClose: () => void;
  onPurchased?: () => void;
};

export function OldManBundleScreen({ open, onClose, onPurchased }: Props) {
  const [wallet, setWallet] = useState(() => readWallet());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const lines = useMemo(() => oldManBundleRewardLines(), []);
  const owned = wallet.ownedProducts.includes(OLD_MAN_BUNDLE.id);

  useEffect(() => {
    if (open) {
      setWallet(readWallet());
      trackMonetization("bundle_viewed", { productId: OLD_MAN_BUNDLE.id });
    }
  }, [open]);

  if (!open) return null;

  const buyLaces = () => {
    setBusy(true);
    setMsg(null);
    trackMonetization("purchase_started", {
      productId: OLD_MAN_BUNDLE.id,
      method: "laces",
    });
    const result = purchaseOldManBundleWithLaces();
    setBusy(false);
    if (!result.ok) {
      setMsg("reason" in result ? result.reason : "Purchase failed");
      trackMonetization("purchase_failed", { productId: OLD_MAN_BUNDLE.id });
      return;
    }
    setWallet(readWallet());
    trackMonetization("purchase_completed", {
      productId: OLD_MAN_BUNDLE.id,
      revenueCents: 0,
      method: "laces",
    });
    trackMonetization("old_man_bundle_purchased", { method: "laces" });
    onPurchased?.();
  };

  const buyStripe = async () => {
    setBusy(true);
    setMsg(null);
    trackMonetization("purchase_started", {
      productId: OLD_MAN_BUNDLE.id,
      method: "stripe",
      revenueCents: OLD_MAN_BUNDLE.priceCents,
    });
    try {
      const res = await fetch("/api/clean-sneaks/monetization/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "intent", kind: "old_mans_bundle" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Card checkout unavailable — try Laces.");
        trackMonetization("purchase_failed", { productId: OLD_MAN_BUNDLE.id });
        return;
      }
      // Without embedding Stripe Elements here, confirm path is documented for restore.
      // Demo grant when Stripe returns clientSecret in non-production is avoided —
      // user must complete Payment Request via CreditPayPanel-style flow later.
      setMsg(
        "Apple Pay / card intent ready. Complete checkout in the wallet sheet when Stripe is configured, or buy with Laces now.",
      );
      if (data.paymentIntentId && process.env.NODE_ENV === "development") {
        // no auto-grant in production
      }
      void grantOldManBundleFromPurchase;
    } catch {
      setMsg("Checkout failed.");
      trackMonetization("purchase_failed", { productId: OLD_MAN_BUNDLE.id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-[#07050a]/95 p-4"
      data-testid="old-man-bundle-screen"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#d4af37]/50 bg-gradient-to-b from-[#1a1208] via-[#0c0a08] to-[#07050a] p-6 shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.35), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(122,16,40,0.35), transparent 50%)",
          }}
        />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[#d4af37]">
            Steal the Old Man&apos;s Bundle
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[#f7e7b0]">{OLD_MAN_BUNDLE.title}</h2>
          <p className="mt-2 text-sm text-[#e8dcc0]/75">{OLD_MAN_BUNDLE.presentation.tagline}</p>
          <p className="mt-1 text-xs text-[#e8dcc0]/55">{OLD_MAN_BUNDLE.subtitle}</p>

          <ul className="mt-5 space-y-2 text-sm text-[#ffd76a]">
            {lines.map((line, i) => (
              <li key={i} className="flex gap-2 border-b border-[#d4af37]/15 pb-2">
                <span className="text-[#d4af37]">▸</span>
                <span>{describeLines([line])}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px] text-[#e8dcc0]/50">
            Optional. Never required to finish the walk or sit at the table. Boosts inside are
            disclosed as gameplay advantages.
          </p>

          {owned ? (
            <p className="mt-6 text-center text-sm text-[#7dffb2]" data-testid="bundle-owned">
              You already hold The Old Man&apos;s Bundle.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-2">
              <Button
                className="bg-[#d4af37] text-[#1a1008]"
                disabled={busy}
                onClick={buyLaces}
                data-testid="button-buy-bundle-laces"
              >
                Buy with {OLD_MAN_BUNDLE.priceLaces} Laces · you have {wallet.laces}
              </Button>
              <Button
                variant="outline"
                className="border-[#d4af37]/40 text-[#ffd76a]"
                disabled={busy}
                onClick={buyStripe}
                data-testid="button-buy-bundle-money"
              >
                Apple Pay / Card · ${(OLD_MAN_BUNDLE.priceCents / 100).toFixed(2)}*
              </Button>
              <p className="text-center text-[10px] text-[#e8dcc0]/40">
                *Shown fallback; App Store / Play localized price replaces this on native builds.
              </p>
            </div>
          )}

          {msg && <p className="mt-3 text-center text-xs text-[#ffd76a]">{msg}</p>}

          <Button variant="ghost" className="mt-4 w-full text-[#e8dcc0]/55" onClick={onClose}>
            Back to shop
          </Button>
        </div>
      </div>
    </div>
  );
}
