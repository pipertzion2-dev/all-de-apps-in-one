"use client";

import dynamic from "next/dynamic";

const MovesLikeApp = dynamic(
  () => import("@/components/the-moves-like/MovesLikeApp").then((m) => m.MovesLikeApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F7FBFC] text-sm text-[#6D91B3]">
        Loading THE MOVES LIKE…
      </div>
    ),
  },
);

export default function TheMovesLikeAppClient() {
  return <MovesLikeApp />;
}
