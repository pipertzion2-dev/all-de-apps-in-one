"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/**
 * After login redirect from FreeYearPrizeModal (?claimYear=1), claim any
 * pending prize stored in localStorage.
 */
export function PendingYearSubClaimHost() {
  const params = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const want = params.get("claimYear") === "1";
    let pending: { prizeId?: string; claimToken?: string } | null = null;
    try {
      const raw = window.localStorage.getItem("klean_year_sub_pending");
      if (raw) pending = JSON.parse(raw);
    } catch {
      pending = null;
    }
    if (!want && !pending?.prizeId) return;
    if (!pending?.prizeId || !pending.claimToken) return;
    setOpen(true);

    if (!isAuthenticated) {
      setMsg("Sign in to claim your free year of ZZAI Pro.");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/clean-sneaks/prizes/year-sub/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            prizeId: pending!.prizeId,
            claimToken: pending!.claimToken,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setMsg(data.error || "Could not claim prize");
          return;
        }
        setMsg(data.message || "1 year of ZZAI Pro is active.");
        try {
          window.localStorage.removeItem("klean_year_sub_pending");
        } catch {
          /* ignore */
        }
      } catch {
        if (!cancelled) setMsg("Claim failed — open the game and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, params]);

  if (!open || !msg) return null;

  return (
    <div
      className="fixed inset-0 z-[270] flex items-center justify-center bg-black/75 p-4"
      data-testid="pending-year-sub-claim"
    >
      <div className="w-full max-w-sm rounded-xl border border-[#d4af37]/50 bg-[#0e1016] p-5 text-center">
        <p className="text-sm text-[#f7e7b0]">{msg}</p>
        <div className="mt-4 flex flex-col gap-2">
          {!isAuthenticated && (
            <Button asChild className="bg-[#d4af37] text-[#1a1008]">
              <Link href="/login?redirect=/clean-sneaks?claimYear=1">Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" className="text-white/50" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
