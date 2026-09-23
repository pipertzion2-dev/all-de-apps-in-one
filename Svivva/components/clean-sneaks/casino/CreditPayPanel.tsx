"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  ENTERTAINMENT_DISCLAIMER,
  type CreditPackId,
} from "@/lib/clean-sneaks/casino/credit-packs";
import { addSessionCredits } from "@/lib/clean-sneaks/casino";

type PackRow = {
  id: CreditPackId;
  label: string;
  credits: number;
  priceCents: number;
  cashAppUrl: string;
  redeemHint: string;
  priceLabel: string;
};

type Catalog = {
  disclaimer: string;
  cashAppTag: string;
  applePayReady: boolean;
  packs: PackRow[];
};

type Props = {
  onCreditsGranted: (credits: number, balance: number) => void;
  onClose: () => void;
};

let stripePromise: Promise<Stripe | null> | null = null;

async function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe/publishable-key")
      .then((r) => r.json())
      .then((j) => (j.publishableKey ? loadStripe(j.publishableKey) : null))
      .catch(() => null);
  }
  return stripePromise;
}

export function CreditPayPanel({ onCreditsGranted, onClose }: Props) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [ageOk, setAgeOk] = useState(false);

  useEffect(() => {
    fetch("/api/clean-sneaks/steal-bundle/credits")
      .then((r) => r.json())
      .then((j) => setCatalog(j as Catalog))
      .catch(() => setMessage("Could not load credit packs."));
  }, []);

  const grant = useCallback(
    (credits: number) => {
      const session = addSessionCredits(credits);
      onCreditsGranted(credits, session.credits);
      setMessage(`Added ${credits.toLocaleString()} entertainment credits.`);
    },
    [onCreditsGranted],
  );

  const payApple = async (pack: PackRow) => {
    if (!ageOk) {
      setMessage("Confirm you are 18+ first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/clean-sneaks/steal-bundle/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "intent", packId: pack.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.cashAppUrl) {
          setMessage("Apple Pay unavailable — use Cash App below.");
          return;
        }
        setMessage(data.error || "Could not start Apple Pay.");
        return;
      }
      const stripe = await getStripe();
      if (!stripe || !data.clientSecret) {
        setMessage("Apple Pay unavailable — use Cash App.");
        return;
      }
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: { label: `Steal Bundle · ${pack.label}`, amount: pack.priceCents },
        requestPayerName: false,
        requestPayerEmail: false,
      });
      const can = await pr.canMakePayment();
      if (!can) {
        setMessage("Apple Pay / wallet not available on this device — use Cash App.");
        return;
      }
      pr.on("paymentmethod", async (ev) => {
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: ev.paymentMethod.id,
        });
        if (error) {
          ev.complete("fail");
          setMessage(error.message || "Payment failed.");
          return;
        }
        ev.complete("success");
        if (paymentIntent?.status === "succeeded") {
          const confirm = await fetch("/api/clean-sneaks/steal-bundle/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "confirm_intent",
              packId: pack.id,
              paymentIntentId: paymentIntent.id,
            }),
          });
          const conf = await confirm.json();
          if (confirm.ok && conf.credits) grant(conf.credits);
          else setMessage(conf.error || "Could not confirm payment.");
        }
      });
      pr.show();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    if (!ageOk) {
      setMessage("Confirm you are 18+ first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/clean-sneaks/steal-bundle/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem_cashapp", code: redeemCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Invalid code.");
        return;
      }
      grant(data.credits);
      setRedeemCode("");
    } catch {
      setMessage("Redeem failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex max-h-full w-full max-w-lg flex-col gap-4 overflow-y-auto px-4 py-6"
      data-testid="credit-pay-panel"
    >
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#7dffb2]">Buy chips</p>
        <h2 className="mt-1 font-serif text-2xl text-[#f7e7b0]">Apple Pay · Cash App</h2>
        <p className="mt-2 text-xs text-[#e8dcc0]/65">
          {catalog?.disclaimer || ENTERTAINMENT_DISCLAIMER}
        </p>
      </div>

      <label className="flex items-start gap-2 text-xs text-[#e8dcc0]/75">
        <input
          type="checkbox"
          checked={ageOk}
          onChange={(e) => setAgeOk(e.target.checked)}
          className="mt-0.5"
          data-testid="credits-age-gate"
        />
        <span>I am 18+ and understand these are entertainment credits with no cash value.</span>
      </label>

      <div className="grid gap-3">
        {(catalog?.packs || []).map((pack) => (
          <div
            key={pack.id}
            className="rounded-md border border-[#d4af37]/30 bg-black/35 px-3 py-3"
            data-testid={`credit-pack-${pack.id}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-serif text-lg text-[#f7e7b0]">{pack.label}</p>
              <p className="text-sm text-[#ffd76a]">{pack.priceLabel}</p>
            </div>
            <p className="text-xs text-[#e8dcc0]/60">
              {pack.credits.toLocaleString()} entertainment credits
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                className="bg-[#111] text-white hover:bg-[#222]"
                disabled={busy || !ageOk}
                onClick={() => payApple(pack)}
                data-testid={`button-apple-pay-${pack.id}`}
              >
                Apple Pay / Wallet
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#00D632]/50 text-[#00D632]"
                data-testid={`button-cashapp-${pack.id}`}
              >
                <a
                  href={pack.cashAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!ageOk) {
                      e.preventDefault();
                      setMessage("Confirm you are 18+ first.");
                    }
                  }}
                >
                  Cash App ${catalog?.cashAppTag || "…"}
                </a>
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-[#e8dcc0]/45">{pack.redeemHint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[#00D632]/30 bg-black/30 px-3 py-3">
        <p className="text-xs text-[#e8dcc0]/70">Redeem Cash App code</p>
        <div className="mt-2 flex gap-2">
          <input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="SB-7-750"
            className="flex-1 rounded-md border border-[#d4af37]/30 bg-black/40 px-3 py-2 text-sm text-[#ffd76a]"
            data-testid="cashapp-redeem-input"
          />
          <Button
            disabled={busy || !redeemCode.trim()}
            onClick={redeem}
            className="bg-[#00D632] text-[#06210c] hover:bg-[#1ae04a]"
            data-testid="button-redeem-cashapp"
          >
            Redeem
          </Button>
        </div>
      </div>

      {message && (
        <p className="text-center text-xs text-[#ffd76a]" data-testid="credit-pay-message">
          {message}
        </p>
      )}

      <Button variant="ghost" className="text-[#e8dcc0]/60" onClick={onClose}>
        Back to lobby
      </Button>
    </div>
  );
}
