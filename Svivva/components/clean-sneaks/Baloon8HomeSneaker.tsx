"use client";

import { useEffect, useState } from "react";
import { loadBaloon8TransparentSideSpriteUrl } from "@/lib/clean-sneaks/baloon8-textures";

export function Baloon8HomeSneaker() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadBaloon8TransparentSideSpriteUrl().then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      className="flex min-h-[112px] items-center justify-center px-2 py-3 sm:min-h-[140px] sm:px-4 sm:py-4"
      data-testid="baloon8-home-sneaker"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Baloon8 side profile — transparent in-game sneaker sprite"
          className="mx-auto block h-auto max-h-[108px] w-auto max-w-full object-contain sm:max-h-[136px]"
          draggable={false}
        />
      ) : (
        <div
          className="mx-auto h-[96px] w-[min(100%,260px)] animate-pulse rounded-lg bg-white/5 sm:h-[120px]"
          aria-hidden
        />
      )}
    </div>
  );
}
