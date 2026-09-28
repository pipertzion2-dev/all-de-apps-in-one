"use client";

import { useCallback, useEffect, useState } from "react";
import { HOMEPAGE_FLIP_EVENT, type HomepageFlipPanelId } from "@/lib/homepage-flip-stack";
import { flipPanelFromHash, scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { cn } from "@/lib/utils";

const FACES: {
  id: HomepageFlipPanelId;
  tab: string;
  hint: string;
  game: boolean;
}[] = [
  { id: "home-game", tab: "Game", hint: "Klean Sneaks demo", game: true },
  { id: "nav-cube", tab: "Platform", hint: "ZZAI product", game: false },
];

function activePanelFromLocation(): HomepageFlipPanelId {
  if (typeof window === "undefined") return "home-game";
  return flipPanelFromHash(window.location.hash) ?? "home-game";
}

/** Fixed tabs: switch between game face and platform face. */
export function HomepageFaceSwitcher({ className }: { className?: string }) {
  const [active, setActive] = useState<HomepageFlipPanelId>("home-game");

  const sync = useCallback(() => {
    setActive(activePanelFromLocation());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener(HOMEPAGE_FLIP_EVENT, sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener(HOMEPAGE_FLIP_EVENT, sync);
    };
  }, [sync]);

  return (
    <div
      className={cn(
        "pointer-events-auto fixed left-1/2 z-[55] w-[min(100%,22rem)] -translate-x-1/2 px-3",
        className,
      )}
      style={{ top: "calc(3.65rem + env(safe-area-inset-top, 0px))" }}
      role="tablist"
      aria-label="Homepage: game or platform"
      data-testid="homepage-face-switcher"
    >
      <div className="flex gap-1 rounded-full border border-border/60 bg-background/95 p-1 shadow-md backdrop-blur-md">
        {FACES.map((face) => {
          const selected = active === face.id;
          return (
            <button
              key={face.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => scrollToHomepagePanel(face.id)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center rounded-full px-2 py-1.5 transition-colors sm:px-3 sm:py-2",
                selected
                  ? face.game
                    ? "bg-[#9085c4]/25 text-[#E8D9A8] ring-1 ring-[#9085c4]/40"
                    : "bg-[#5B8DA8]/20 text-foreground ring-1 ring-[#5B8DA8]/45"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <span className="text-xs font-bold sm:text-sm">{face.tab}</span>
              <span className="hidden text-[9px] leading-tight opacity-80 sm:block">
                {face.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
