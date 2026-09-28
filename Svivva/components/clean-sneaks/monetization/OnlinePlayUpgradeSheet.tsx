"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PLATFORM_FUNNEL_COPY,
  PLATFORM_UPGRADE_PATH,
} from "@/lib/clean-sneaks/monetization/platform-strategy";
import type { OnlineAccessSnapshot } from "@/lib/clean-sneaks/monetization/online-access-server";

type Props = {
  access: OnlineAccessSnapshot;
  onDismiss: () => void;
  className?: string;
};

export function OnlinePlayUpgradeSheet({ access, onDismiss, className }: Props) {
  return (
    <div
      className={`rounded-lg border border-[#7EC8D9]/40 bg-[#0a1418]/95 px-4 py-4 text-left shadow-xl ${className ?? ""}`}
      data-testid="online-play-upgrade-sheet"
    >
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#7EC8D9]">Platform play</p>
      <h3 className="mt-1 font-serif text-xl text-[#f7e7b0]">{PLATFORM_FUNNEL_COPY.headline}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[#e8dcc0]/75">{PLATFORM_FUNNEL_COPY.subhead}</p>

      <p className="mt-3 text-sm text-[#ffd76a]">
        {access.unlimited
          ? "You have unlimited online tables on your plan."
          : PLATFORM_FUNNEL_COPY.monthlyLabel(access.usedThisMonth, access.limit)}
      </p>
      <p className="mt-1 text-[11px] text-[#e8dcc0]/50">{PLATFORM_FUNNEL_COPY.fairnessNote}</p>

      {!access.unlimited && (
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
        {access.requiresSignIn ? (
          <Button asChild className="bg-[#7EC8D9] text-[#0a1a20]">
            <Link href={`/login?returnTo=${encodeURIComponent("/clean-sneaks")}`}>
              Sign in for 2 free online tables / month
            </Link>
          </Button>
        ) : (
          <Button asChild className="bg-[#d4af37] text-[#1a1008]">
            <Link href={PLATFORM_UPGRADE_PATH}>Upgrade on ZZAI</Link>
          </Button>
        )}
        <Button variant="ghost" className="text-[#e8dcc0]/55" onClick={onDismiss}>
          Keep playing solo
        </Button>
      </div>
    </div>
  );
}
