import { cn } from "@/lib/utils";

export type HomepageSurfaceKind = "game" | "platform";

const SURFACE = {
  game: {
    eyebrow: "Homepage · face 1",
    title: "The game",
    detail: "Klean Sneaks — free demo, not billing",
  },
  platform: {
    eyebrow: "Homepage · face 2",
    title: "The platform",
    detail: "ZZAI — API guardrails you ship on",
  },
} as const;

type HomepageSurfaceLabelProps = {
  kind: HomepageSurfaceKind;
  className?: string;
};

/** Makes game vs product obvious on each flip face. */
export function HomepageSurfaceLabel({ kind, className }: HomepageSurfaceLabelProps) {
  const meta = SURFACE[kind];
  const game = kind === "game";

  return (
    <div
      className={cn("mx-auto w-full max-w-md text-center", className)}
      data-testid={`homepage-surface-${kind}`}
    >
      <p
        className={cn(
          "text-[9px] font-semibold uppercase tracking-[0.28em] sm:text-[10px]",
          game ? "text-[#A8BA48]/85" : "text-[#5B8DA8]",
        )}
      >
        {meta.eyebrow}
      </p>
      <div
        className={cn(
          "mt-1.5 inline-flex flex-col items-center rounded-xl border px-4 py-2 sm:px-5 sm:py-2.5",
          game ? "border-[#9085c4]/50 bg-[#9085c4]/15" : "border-[#5B8DA8]/45 bg-[#5B8DA8]/10",
        )}
      >
        <span
          className={cn(
            "text-sm font-bold tracking-tight sm:text-base",
            game ? "text-[#E8D9A8]" : "text-foreground",
          )}
        >
          {meta.title}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[10px] leading-snug sm:text-xs",
            game ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {meta.detail}
        </span>
      </div>
    </div>
  );
}
