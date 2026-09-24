"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getOrCreateDeviceId } from "@/lib/clean-sneaks/prizes/year-subscription";

type RollResult = {
  won: boolean;
  prizeId?: string;
  claimToken?: string;
  expiresAt?: string;
  odds?: number;
  message?: string;
  alreadyPending?: boolean;
};

type Props = {
  /** Unique per hand — used as lottery entry id */
  entryId: string | null;
  humanWonSolo: boolean;
  onDismiss?: () => void;
};

/**
 * After a solo Steal Bundle win, roll (server-side) for 1 year free ZZAI Pro.
 * Claim requires sign-in.
 */
export function FreeYearPrizeModal({ entryId, humanWonSolo, onDismiss }: Props) {
  const { isAuthenticated, user } = useAuth();
  const [roll, setRoll] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!entryId || !humanWonSolo) return;
    let cancelled = false;
    setRolling(true);
    setClaimMsg(null);
    void (async () => {
      try {
        const res = await fetch("/api/clean-sneaks/prizes/year-sub/roll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryId,
            deviceId: getOrCreateDeviceId(),
            humanWonSolo: true,
          }),
        });
        const data = (await res.json()) as RollResult;
        if (cancelled) return;
        setRoll(data);
        if (data.won && data.prizeId && data.claimToken) {
          setOpen(true);
          try {
            window.localStorage.setItem(
              "klean_year_sub_pending",
              JSON.stringify({
                prizeId: data.prizeId,
                claimToken: data.claimToken,
                expiresAt: data.expiresAt,
              }),
            );
          } catch {
            /* ignore */
          }
        }
      } catch {
        if (!cancelled) setRoll({ won: false });
      } finally {
        if (!cancelled) setRolling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId, humanWonSolo]);

  const claim = useCallback(async () => {
    if (!roll?.prizeId || !roll.claimToken) return;
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await fetch("/api/clean-sneaks/prizes/year-sub/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prizeId: roll.prizeId, claimToken: roll.claimToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "auth_required") {
          setClaimMsg("Sign in to claim your free year.");
        } else {
          setClaimMsg(data.error || "Claim failed");
        }
        return;
      }
      setClaimMsg(data.message || "1 year of ZZAI Pro is on your account.");
      try {
        window.localStorage.removeItem("klean_year_sub_pending");
      } catch {
        /* ignore */
      }
    } catch {
      setClaimMsg("Claim failed — try again.");
    } finally {
      setClaiming(false);
    }
  }, [roll]);

  if (!open || !roll?.won) return null;

  const loginRedirect = `/login?redirect=${encodeURIComponent("/clean-sneaks?claimYear=1")}`;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Free year subscription prize"
      data-testid="free-year-prize-modal"
    >
      <div className="w-full max-w-md rounded-xl border-2 border-[#d4af37] bg-[#0e1016] p-5 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d4af37]">
          Jackpot · Steal Bundle
        </p>
        <h3 className="mt-2 font-serif text-2xl text-[#f7e7b0]">You won 1 year free!</h3>
        <p className="mt-2 text-sm text-[#e8dcc0]/80">
          ZZAI Pro — full workspace access for 365 days. Solo Steal Bundle wins have about a{" "}
          {roll.odds != null ? `${Math.round(roll.odds * 100)}%` : "5%"} chance.
        </p>
        {rolling && <p className="mt-3 text-xs text-white/50">Confirming prize…</p>}
        {claimMsg && (
          <p className="mt-3 text-sm text-[#ffd76a]" data-testid="free-year-claim-message">
            {claimMsg}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          {isAuthenticated ? (
            <Button
              className="w-full bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a] font-bold"
              disabled={claiming || Boolean(claimMsg?.includes("active"))}
              onClick={() => void claim()}
              data-testid="button-claim-free-year"
            >
              {claiming ? "Claiming…" : user?.email ? `Claim on ${user.email}` : "Claim 1 year Pro"}
            </Button>
          ) : (
            <Button
              asChild
              className="w-full bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a] font-bold"
              data-testid="button-signin-claim-free-year"
            >
              <Link href={loginRedirect}>Sign in to claim</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-white/50"
            onClick={() => {
              setOpen(false);
              onDismiss?.();
            }}
            data-testid="button-dismiss-free-year"
          >
            Claim later
          </Button>
        </div>
        {roll.expiresAt && (
          <p className="mt-3 text-[10px] text-white/40">
            Claim by {new Date(roll.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
