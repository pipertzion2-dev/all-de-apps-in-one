"use client";

import type { MovesLikeScreen } from "@/lib/the-moves-like/types";

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
  overlay = false,
}: {
  screen: MovesLikeScreen;
  onChange: (s: MovesLikeScreen) => void;
  overlay?: boolean;
}) {
  return (
    <nav
      aria-label="THE MOVES LIKE"
      className={`flex gap-1 overflow-x-auto px-3 py-2 sm:px-6 ${
        overlay ? "bg-transparent" : "border-b border-white/10 bg-black/50 backdrop-blur-md"
      }`}
    >
      {ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              active ? "text-[#90C4D8]" : "text-[#8A9EA6] hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`border-b-2 pb-1 ${active ? "border-[#5B8DA8]" : "border-transparent"}`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
