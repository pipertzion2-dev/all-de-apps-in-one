"use client";

import { CasinoExperience } from "@/components/clean-sneaks/casino/CasinoExperience";
import { readCasinoSession } from "@/lib/clean-sneaks/casino";

type Props = {
  onBack: () => void;
  onNewWalk?: () => void;
};

/**
 * Entry for unlocked players jumping straight into the casino / card table.
 * Walking score from the last session is preserved as admission.
 */
export function StealTheBundleCardGame({ onBack, onNewWalk }: Props) {
  const session = readCasinoSession();

  return (
    <CasinoExperience
      walkingScore={session.walkingScore}
      initialState={session.scoreAccepted ? "CASINO_LOBBY" : "WALK_COMPLETE"}
      onNewWalk={onNewWalk ?? onBack}
      onExit={onBack}
    />
  );
}
