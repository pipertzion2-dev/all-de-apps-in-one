"use client";

import type { MovesLikeScreen } from "@/lib/the-moves-like/types";
import { cn } from "@/lib/utils";

const ITEMS: { id: MovesLikeScreen; label: string; short: string }[] = [
  { id: "discover", label: "Discover", short: "Home" },
  { id: "learn", label: "Learn", short: "Cam" },
  { id: "create", label: "Create", short: "Rec" },
  { id: "studio", label: "Studio", short: "Edit" },
  { id: "play", label: "Play", short: "Play" },
  { id: "community", label: "Community", short: "Crew" },
  { id: "profile", label: "Profile", short: "You" },
];

export function MovesLikeNav({
  screen,
  onChange,
  overlay = false,
}: {
  screen: MovesLikeScreen;
  onChange: (s: MovesLikeScreen) => void;
  overlay?: boolean;
}) {
  return (
    <>
      <nav
        aria-label="THE MOVES LIKE"
        className={cn(
          "hidden gap-1 overflow-x-auto px-3 py-2 sm:flex sm:px-6",
          overlay ? "bg-transparent" : "border-b border-border/30 bg-card/30 backdrop-blur-xl",
        )}
      >
        {ITEMS.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                active
                  ? "border border-primary/40 bg-primary/20 text-[#d8eef6]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <nav
        aria-label="THE MOVES LIKE mobile"
        className="tml-glass-nav fixed inset-x-0 bottom-0 z-40 flex border-t px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:hidden"
      >
        {ITEMS.map((item) => {
          const active = screen === item.id;
          const cameraTab = item.id === "learn" || item.id === "create";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] transition",
                active
                  ? cameraTab
                    ? "bg-[hsl(315_60%_45%/0.22)] text-[#E8A0D0]"
                    : "bg-primary/20 text-[#90C4D8]"
                  : "text-[#7A9098]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "mb-0.5 h-1 w-4 rounded-full",
                  active ? (cameraTab ? "bg-[#C44A9A]" : "bg-primary") : "bg-transparent",
                )}
              />
              {item.short}
            </button>
          );
        })}
      </nav>
    </>
  );
}
