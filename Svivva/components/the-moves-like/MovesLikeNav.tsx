"use client";

import type { MovesLikeScreen } from "@/lib/the-moves-like/types";
import { cn } from "@/lib/utils";

const ITEMS: { id: MovesLikeScreen; label: string; short: string }[] = [
  { id: "train", label: "Train", short: "Train" },
  { id: "moves", label: "Moves", short: "Moves" },
  { id: "studio", label: "Studio", short: "Studio" },
  { id: "cypher", label: "Cypher", short: "Cypher" },
  { id: "profile", label: "Profile", short: "You" },
];

export function MovesLikeNav({
  screen,
  onChange,
}: {
  screen: MovesLikeScreen;
  onChange: (s: MovesLikeScreen) => void;
}) {
  return (
    <>
      <nav
        aria-label="THE MOVES LIKE"
        className="hidden items-center gap-1 border-b border-[#2A2E38] px-4 py-2 sm:flex sm:px-6"
      >
        {ITEMS.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition",
                active
                  ? "bg-[#C6FF00]/15 text-[#C6FF00]"
                  : "text-[#8B919A] hover:bg-white/5 hover:text-white",
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
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#2A2E38] bg-[#08090B]/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md sm:hidden"
      >
        {ITEMS.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.1em]",
                active ? "text-[#C6FF00]" : "text-[#8B919A]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "mb-0.5 h-0.5 w-5 rounded-full",
                  active ? "bg-[#C6FF00]" : "bg-transparent",
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
