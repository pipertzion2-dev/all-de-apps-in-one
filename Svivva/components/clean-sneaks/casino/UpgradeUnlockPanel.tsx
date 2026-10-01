"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CASINO_UPGRADE_CATALOG,
  UPGRADE_UNLOCK_DISCLAIMER,
  isUpgradeUnlocked,
  listUnlockedUpgrades,
  tryUnlockCasinoUpgrade,
  type CasinoUpgradeId,
} from "@/lib/clean-sneaks/casino/upgrades";
import { readCasinoSession } from "@/lib/clean-sneaks/casino/session";

type Props = {
  credits: number;
  unlockedUpgrades: string[];
  onUnlocked: (credits: number, unlockedUpgrades: string[]) => void;
  onClose: () => void;
};

export function UpgradeUnlockPanel({ credits, unlockedUpgrades, onUnlocked, onClose }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const owned = useMemo(() => new Set(unlockedUpgrades), [unlockedUpgrades]);

  const unlock = useCallback(
    (id: CasinoUpgradeId) => {
      setBusy(true);
      setMessage(null);
      const result = tryUnlockCasinoUpgrade(id);
      setBusy(false);
      if (!result.ok) {
        setMessage(result.reason);
        return;
      }
      const session = readCasinoSession();
      onUnlocked(session.credits, listUnlockedUpgrades(session));
      setMessage(`${CASINO_UPGRADE_CATALOG.find((u) => u.id === id)?.label ?? "Upgrade"} unlocked.`);
    },
    [onUnlocked],
  );

  return (
    <div
      className="flex max-h-full w-full max-w-lg flex-col gap-4 overflow-y-auto px-4 py-6"
      data-testid="upgrade-unlock-panel"
    >
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#7dffb2]">Table upgrades</p>
        <h2 className="mt-1 font-serif text-2xl text-[#f7e7b0]">Unlock upgrades</h2>
        <p className="mt-2 text-xs text-[#e8dcc0]/65">{UPGRADE_UNLOCK_DISCLAIMER}</p>
        <p className="mt-2 text-sm text-[#ffd76a]" data-testid="upgrade-panel-credits">
          {credits.toLocaleString()} credits available
        </p>
      </div>

      <div className="grid gap-3">
        {CASINO_UPGRADE_CATALOG.map((upgrade) => {
          const has = owned.has(upgrade.id) || isUpgradeUnlocked(upgrade.id);
          const canAfford = credits >= upgrade.creditCost;
          return (
            <div
              key={upgrade.id}
              className="rounded-md border border-[#d4af37]/30 bg-black/35 px-3 py-3"
              data-testid={`casino-upgrade-${upgrade.id}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-serif text-lg text-[#f7e7b0]">{upgrade.label}</p>
                {has ? (
                  <span className="text-[10px] uppercase text-[#7dffb2]">Unlocked</span>
                ) : (
                  <p className="text-sm text-[#ffd76a]">
                    {upgrade.creditCost.toLocaleString()} credits
                  </p>
                )}
              </div>
              <p className="text-xs text-[#e8dcc0]/60">{upgrade.blurb}</p>
              {!has && (
                <Button
                  className="mt-3 w-full bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a] disabled:opacity-40"
                  disabled={busy || !canAfford}
                  onClick={() => unlock(upgrade.id)}
                  data-testid={`button-unlock-${upgrade.id}`}
                >
                  {canAfford ? "Unlock upgrade" : "Earn more credits"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <p className="text-center text-xs text-[#ffd76a]" data-testid="upgrade-unlock-message">
          {message}
        </p>
      )}

      <Button variant="ghost" className="text-[#e8dcc0]/60" onClick={onClose}>
        Back to lobby
      </Button>
    </div>
  );
}
