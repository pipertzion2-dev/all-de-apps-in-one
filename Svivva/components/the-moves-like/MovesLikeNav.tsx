"use client";

import type { MovesLikeScreen } from "@/lib/the-moves-like/types";

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
      {/* Desktop / tablet top nav */}
      <nav
        aria-label="THE MOVES LIKE"
        className={`hidden gap-1 overflow-x-auto px-3 py-2 sm:flex sm:px-6 ${
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

      {/* Mobile bottom thumb nav — camera-first destinations emphasized */}
      <nav
        aria-label="THE MOVES LIKE mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-black/85 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md sm:hidden"
      >
        {ITEMS.map((item) => {
          const active = screen === item.id;
          const cameraTab = item.id === "learn" || item.id === "create";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                active ? (cameraTab ? "text-[#E8A0D0]" : "text-[#90C4D8]") : "text-[#7A9098]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`mb-0.5 h-1 w-1 rounded-full ${
                  active ? (cameraTab ? "bg-[#C44A9A]" : "bg-[#5B8DA8]") : "bg-transparent"
                }`}
              />
              {item.short}
            </button>
          );
        })}
      </nav>
    </>
  );
}
