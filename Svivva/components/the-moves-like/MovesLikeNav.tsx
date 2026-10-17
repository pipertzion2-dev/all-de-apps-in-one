"use client";

import type { MovesLikeScreen } from "@/lib/the-moves-like/types";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";

const ITEMS: { id: MovesLikeScreen; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "learn", label: "Learn" },
  { id: "create", label: "Create" },
  { id: "studio", label: "Studio" },
  { id: "play", label: "Play" },
  { id: "community", label: "Community" },
  { id: "profile", label: "Profile" },
];

export function MovesLikeNav({
  screen,
  onChange,
}: {
  screen: MovesLikeScreen;
  onChange: (s: MovesLikeScreen) => void;
}) {
  return (
    <nav
      aria-label="THE MOVES LIKE"
      className="flex gap-1 overflow-x-auto border-b border-white/10 bg-black/40 px-2 py-2 backdrop-blur-md sm:px-4"
    >
      {ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors sm:text-[11px] ${
              active
                ? "bg-[color:var(--tml-teal)] text-[#071014]"
                : "text-[#C8D8DE] hover:bg-white/10 hover:text-white"
            }`}
            style={
              active
                ? ({ ["--tml-teal" as string]: MOVES_LIKE.teal } as React.CSSProperties)
                : undefined
            }
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
