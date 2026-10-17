"use client";

import dynamic from "next/dynamic";

const MovesLikeApp = dynamic(
  () => import("@/components/the-moves-like/MovesLikeApp").then((m) => m.MovesLikeApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#071014] text-sm text-[#90C4D8]">
        Loading THE MOVES LIKE…
      </div>
    ),
  },
);

export default function TheMovesLikeAppClient() {
  return <MovesLikeApp />;
}
