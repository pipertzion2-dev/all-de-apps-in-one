"use client";

import { Button } from "@/components/ui/button";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { ZONE_LABELS } from "@/lib/clean-sneaks/dirt-system";
import type { GameOverPayload } from "@/lib/clean-sneaks/types";

type Props = {
  payload: GameOverPayload;
  onRetry: () => void;
  onShare: () => void;
  onExit?: () => void;
  onPlayBundleCard?: () => void;
  shareMsg?: string | null;
};

/** Post-mission shoe reveal — numbers after the cinematic look-down. */
export function PostMissionReveal({
  payload,
  onRetry,
  onShare,
  onExit,
  onPlayBundleCard,
  shareMsg,
}: Props) {
  const perfect = payload.perfectClean;
  const worst = payload.worstHit;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-md"
      data-testid="post-mission-reveal"
    >
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">{KLEAN_SNEAKS.title}</p>

      {perfect ? (
        <>
          <p className="mt-3 text-xs uppercase tracking-[0.4em] text-[#7EC8D9]">Music cuts.</p>
          <h3 className="seeds-holo-text mt-2 text-4xl font-bold tracking-[0.2em] sm:text-5xl">
            UNTOUCHED.
          </h3>
          <p className="mt-2 text-sm text-[#7EC8D9]/80">Perfect clean. Legendary.</p>
        </>
      ) : (
        <>
          <h3 className="seeds-holo-text mt-2 text-3xl font-bold tracking-wide sm:text-4xl">
            {payload.finalCleanliness <= 0 ? "KICKS COOKED." : "SHOE REVEAL"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">How clean did you keep the fit?</p>
        </>
      )}

      <dl className="mt-6 grid w-full max-w-md grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Stat label="Cleanliness" value={`${payload.finalCleanliness}%`} accent />
        <Stat label="Condition" value={`${payload.conditionScore}%`} />
        <Stat label="Left" value={`${payload.leftClean}%`} />
        <Stat label="Right" value={`${payload.rightClean}%`} />
        <Stat label="Crease" value={`${payload.creases}%`} />
        <Stat label="Style" value={payload.styleScore.toLocaleString()} />
        <Stat label="Close Calls" value={String(payload.closeCalls)} />
        <Stat label="Klean Chain" value={`x${payload.maxCleanChain}`} />
        <Stat label="Distance" value={`${payload.distance}m`} />
        <Stat label="Score" value={payload.score.toLocaleString()} accent />
      </dl>

      {payload.bundleNewlyUnlocked && (
        <div
          className="mt-5 w-full max-w-md rounded-lg border border-[#7EC8D9]/40 bg-[#7EC8D9]/10 px-4 py-3 text-center"
          data-testid="bundle-unlock-banner"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#7EC8D9]">New high score</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Steal the Old Man&apos;s Bundle — card game unlocked.
          </p>
        </div>
      )}

      {!payload.bundleCardUnlocked && payload.bundleUnlockReason && (
        <p className="mt-4 max-w-md text-center text-xs text-white/50">
          {payload.bundleUnlockReason}
        </p>
      )}

      {worst && (
        <div className="mt-5 w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#D94F9C]">
            How did that touch me?
          </p>
          <p className="mt-1 text-foreground">
            {worst.label} hit the{" "}
            <span className="font-semibold">
              {worst.shoe.toUpperCase()} {ZONE_LABELS[worst.zone]}
            </span>{" "}
            at {Math.floor(worst.atDistance)}m (−{Math.round(worst.amount)}%).
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          size="lg"
          className="bg-[#5B8DA8] text-white"
          onClick={onRetry}
          data-testid="button-clean-sneaks-retry"
        >
          Run It Back
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onShare}
          data-testid="button-clean-sneaks-share"
        >
          Share Score
        </Button>
        {payload.bundleCardUnlocked && onPlayBundleCard && (
          <Button
            size="lg"
            className="bg-[#D94F9C] text-white hover:bg-[#D94F9C]/90"
            onClick={onPlayBundleCard}
            data-testid="button-play-steal-bundle"
          >
            Steal the Bundle
          </Button>
        )}
        {onExit && (
          <Button size="lg" variant="ghost" onClick={onExit} data-testid="button-clean-sneaks-exit">
            Close
          </Button>
        )}
      </div>
      {shareMsg && <p className="mt-3 text-xs text-muted-foreground">{shareMsg}</p>}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-semibold tabular-nums ${accent ? "text-[#7EC8D9]" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
