"use client";

import Image from "next/image";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";

type Props = {
  size?: "header" | "hero" | "inline";
  className?: string;
  priority?: boolean;
  /** dark = black spray on clear (light UI). light = inverted for rare dark overlays. */
  tone?: "dark" | "light";
};

const SIZES = {
  header: { width: 160, height: 80, className: "h-9 w-auto sm:h-10" },
  hero: { width: 720, height: 360, className: "h-auto w-[min(94vw,560px)]" },
  inline: { width: 240, height: 120, className: "h-12 w-auto" },
} as const;

/** Transparent spray-paint mark — dark ink on light/white glass UI. */
export function BrandMark({
  size = "header",
  className = "",
  priority = false,
  tone = "dark",
}: Props) {
  const s = SIZES[size];
  return (
    <Image
      src={tone === "light" ? MOVES_LIKE.logoLightPath : MOVES_LIKE.logoPath}
      alt={MOVES_LIKE.name}
      width={s.width}
      height={s.height}
      priority={priority}
      className={`${s.className} object-contain object-left ${className}`}
      style={{ background: "transparent" }}
    />
  );
}
