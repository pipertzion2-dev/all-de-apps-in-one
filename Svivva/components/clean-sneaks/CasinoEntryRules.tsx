import { FINISH_DISTANCE } from "@/lib/clean-sneaks/run-engine";
import { CREDITS_MIN_ANTE } from "@/lib/clean-sneaks/casino/credits";

type Props = {
  compact?: boolean;
  className?: string;
};

/** Player-facing rules for earning casino entry. */
export function CasinoEntryRules({ compact, className }: Props) {
  if (compact) {
    return (
      <p
        className={`max-w-sm text-center text-[11px] leading-relaxed text-[#e8dcc0]/70 ${className ?? ""}`}
        data-testid="casino-entry-rules-compact"
      >
        Score = credits. Hit {FINISH_DISTANCE}m for the casino, or cash out early with{" "}
        {CREDITS_MIN_ANTE}+ credits via <span className="text-[#ffd76a]">Steal Bundle</span>. Turn
        in your ticket at the door.
      </p>
    );
  }

  return (
    <div
      className={`w-full max-w-md rounded-lg border border-[#d4af37]/35 bg-black/55 px-4 py-3 text-left ${className ?? ""}`}
      data-testid="casino-entry-rules"
    >
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">
        How to enter the casino
      </p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-[#e8dcc0]/85 sm:text-sm">
        <li>
          Walk the Vegas strip. Your <span className="text-[#ffd76a]">score becomes credits</span> —
          cleaner kicks score higher.
        </li>
        <li>Dodge street trash, mud, and debris so the shoes don&apos;t get cooked.</li>
        <li>
          Reach <span className="text-[#7EC8D9]">{FINISH_DISTANCE}m</span> to unlock the casino
          destination — or tap <span className="text-[#ffd76a]">Steal Bundle</span> anytime you have{" "}
          {CREDITS_MIN_ANTE}+ credits to cash out early.
        </li>
        <li>
          At the door, turn in your <span className="text-[#ffd76a]">score ticket</span>. Those
          credits are your chip stack for Steal the Old Man&apos;s Bundle.
        </li>
      </ol>
    </div>
  );
}
