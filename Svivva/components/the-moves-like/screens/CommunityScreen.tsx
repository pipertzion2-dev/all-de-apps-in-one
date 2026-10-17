"use client";

import { MOVES_LIBRARY } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";

const CREATORS = [
  { name: "Nova Step", focus: "House foundations", crew: "Teal Pulse" },
  { name: "Magenta Wave", focus: "Contemporary rolls", crew: "Spray Form" },
  { name: "Cyan Lock", focus: "Popping isolations", crew: "Bar Line" },
];

export function CommunityScreen() {
  const challenges = useMovesLikeStore((s) => s.challenges);
  const setScreen = useMovesLikeStore((s) => s.setScreen);
  const favorites = useMovesLikeStore((s) => s.favorites);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-8">
      <header>
        <h2 className="text-2xl font-bold text-white">Community</h2>
        <p className="mt-1 text-sm text-[#9BB0B8]">
          Creators, crews, and challenge responses — local discovery for this build. Share routines
          via exported text from Studio.
        </p>
      </header>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Featured creators
        </h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {CREATORS.map((c) => (
            <li key={c.name} className="border border-white/10 bg-white/[0.03] p-4">
              <p className="font-semibold text-white">{c.name}</p>
              <p className="mt-1 text-xs text-[#9BB0B8]">{c.focus}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#C44A9A]">
                {c.crew}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Open Style Clash challenges
        </h3>
        {challenges.length === 0 ? (
          <p className="mt-2 text-sm text-[#9BB0B8]">
            No challenges yet.{" "}
            <button
              type="button"
              className="text-[#5B8DA8] underline-offset-2 hover:underline"
              onClick={() => setScreen("play")}
            >
              Start one in Play
            </button>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {challenges.map((c) => (
              <li key={c.id} className="border border-white/10 px-4 py-3">
                <p className="text-sm text-white">{c.prompt}</p>
                <p className="mt-1 text-xs text-[#9BB0B8]">
                  {MOVES_LIBRARY.find((m) => m.id === c.moveId)?.name} · {c.responses.length}{" "}
                  responses · {new Date(c.createdAt).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  onClick={() => setScreen("play")}
                  className="mt-2 text-xs uppercase tracking-[0.12em] text-[#90C4D8]"
                >
                  Open in Play →
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Shared movement collections
        </h3>
        {favorites.length === 0 ? (
          <p className="mt-2 text-sm text-[#9BB0B8]">
            Save Motion DNA combos in Studio to surface them here.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {favorites.map((f) => (
              <li key={f.id} className="border border-white/10 px-3 py-2 text-sm text-[#C8D8DE]">
                {f.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
