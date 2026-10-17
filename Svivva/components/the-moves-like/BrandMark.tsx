"use client";

import Image from "next/image";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";

type Props = {
  /** header | hero | inline */
  size?: "header" | "hero" | "inline";
  className?: string;
  priority?: boolean;
};

const SIZES = {
  header: { width: 160, height: 80, className: "h-9 w-auto sm:h-10" },
  hero: { width: 720, height: 360, className: "h-auto w-[min(94vw,560px)]" },
  inline: { width: 240, height: 120, className: "h-12 w-auto" },
} as const;

/** Transparent spray-paint mark (no white plate) for dark stages. */
export function BrandMark({ size = "header", className = "", priority = false }: Props) {
  const s = SIZES[size];
  return (
    <Image
      src={MOVES_LIKE.logoLightPath}
      alt={MOVES_LIKE.name}
      width={s.width}
      height={s.height}
      priority={priority}
      className={`${s.className} object-contain object-left ${className}`}
      style={{ background: "transparent" }}
    />
  );
}
