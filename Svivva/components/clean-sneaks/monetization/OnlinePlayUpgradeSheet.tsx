"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLATFORM_FUNNEL_COPY } from "@/lib/clean-sneaks/monetization/platform-strategy";
import type { OnlineAccessSnapshot } from "@/lib/clean-sneaks/monetization/online-access-server";
import type { CashAppRecurringPlan } from "@/lib/billing/cashapp-recurring";

type Props = {
  access: OnlineAccessSnapshot;
  onDismiss: () => void;
  onUnlocked?: () => void;
  className?: string;
};

type SubscribePayload = {
  cashAppTag: string;
  plans: CashAppRecurringPlan[];
  membershipUnlock?: { instructions: string; hasCode: boolean };
  note: string | null;
};

export function OnlinePlayUpgradeSheet({ access, onDismiss, onUnlocked, className }: Props) {
  const [subscribe, setSubscribe] = useState<SubscribePayload | null>(null);
  const [code, setCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeOk, setCodeOk] = useState(false);

  useEffect(() => {
    fetch("/api/clean-sneaks/platform-subscribe")
      .then((r) => r.json())
      .then((data) => setSubscribe(data))
      .catch(() => setSubscribe(null));
  }, []);

  const openCashApp = (plan: CashAppRecurringPlan) => {
    window.open(plan.paymentLink, "_blank", "noopener,noreferrer");
  };

  const submitCode = useCallback(async () => {
    setCodeBusy(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/auth/membership-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || "Incorrect code");
        return;
      }
      setCodeOk(true);
      onUnlocked?.();
    } catch {
      setCodeError("Could not verify code.");
    } finally {
      setCodeBusy(false);
    }
  }, [code, onUnlocked]);

  return (
    <div
      className={`rounded-lg border border-[#00D632]/35 bg-[#0a1418]/95 px-4 py-4 text-left shadow-xl ${className ?? ""}`}
      data-testid="online-play-upgrade-sheet"
    >
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#00D632]">Cash App · monthly</p>
      <h3 className="mt-1 font-serif text-xl text-[#f7e7b0]">{PLATFORM_FUNNEL_COPY.headline}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[#e8dcc0]/75">
        Subscribe with <strong className="text-[#00D632]">recurring Cash App</strong> — tap{" "}
        <em>Repeat → Monthly</em> when you pay. Unlimited online tables + platform tools on the
        same plan.
      </p>

      <p className="mt-3 text-sm text-[#ffd76a]">
        {access.unlimited || access.cashAppMembership || codeOk
          ? "Your recurring plan is active — unlimited online tables."
          : PLATFORM_FUNNEL_COPY.monthlyLabel(access.usedThisMonth, access.limit)}
      </p>
      <p className="mt-1 text-[11px] text-[#e8dcc0]/50">{PLATFORM_FUNNEL_COPY.fairnessNote}</p>

      {!access.unlimited && !codeOk && subscribe?.plans?.length ? (
        <div className="mt-4 flex flex-col gap-2">
          {subscribe.plans.map((plan) => (
            <Button
              key={plan.tier}
              type="button"
              className={
                plan.tier === "pro"
                  ? "bg-[#00D632] text-black hover:bg-[#00bd2d]"
                  : "bg-[#d4af37] text-[#1a1008]"
              }
              onClick={() => openCashApp(plan)}
              data-testid={`cashapp-subscribe-${plan.tier}`}
            >
              Cash App recurring — {plan.name} {plan.priceLabel}/mo
            </Button>
          ))}
          {subscribe.cashAppTag ? (
            <p className="text-[10px] text-[#e8dcc0]/45">${subscribe.cashAppTag} on Cash App</p>
          ) : null}
        </div>
      ) : null}

      {!access.unlimited && !codeOk && (
        <div className="mt-4 rounded-md border border-[#d4af37]/25 bg-black/35 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">
            After Cash App payment
          </p>
          <p className="mt-1 text-[11px] text-[#e8dcc0]/65">
            {subscribe?.membershipUnlock?.instructions ??
              "Enter your access code to activate 30 days of unlimited online play."}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="flex-1 rounded-md border border-[#d4af37]/35 bg-black/40 px-3 py-2 text-sm text-[#ffd76a]"
              data-testid="klean-membership-code"
            />
            <Button
              type="button"
              disabled={codeBusy || code.trim().length < 1}
              className="bg-[#7a1028] text-[#f7e7b0]"
              onClick={() => void submitCode()}
              data-testid="klean-membership-code-submit"
            >
              {codeBusy ? "…" : "Activate"}
            </Button>
          </div>
          {codeError && (
            <p className="mt-2 text-xs text-[#ff6b8a]" data-testid="klean-membership-code-error">
              {codeError}
            </p>
          )}
        </div>
      )}

      {!access.unlimited && !codeOk && (
        <ul className="mt-3 space-y-1.5 text-xs text-[#e8dcc0]/80">
          {PLATFORM_FUNNEL_COPY.benefits.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-[#7dffb2]">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {access.requiresSignIn && !codeOk ? (
          <Button asChild className="bg-[#7EC8D9] text-[#0a1a20]">
            <Link href={`/login?returnTo=${encodeURIComponent("/clean-sneaks")}`}>
              Sign in to sync recurring plan
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="border-[#00D632]/40 text-[#00D632]">
            <Link href="/dashboard/billing?ref=klean-online">Full billing page</Link>
          </Button>
        )}
        <Button variant="ghost" className="text-[#e8dcc0]/55" onClick={onDismiss}>
          Keep playing solo
        </Button>
      </div>
    </div>
  );
}
