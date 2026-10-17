"use client";

import { cn } from "@/lib/utils";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";

type Props = {
  size?: "header" | "hero" | "inline";
  className?: string;
};

/** Bold wordmark for the dark workstation shell. */
export function BrandMark({ size = "header", className = "" }: Props) {
  return (
    <span
      className={cn(
        "font-black uppercase tracking-[-0.04em] text-white",
        size === "header" && "text-sm sm:text-base",
        size === "inline" && "text-lg",
        size === "hero" && "text-3xl sm:text-5xl leading-[0.95]",
        className,
      )}
      aria-label={MOVES_LIKE.name}
    >
      THE MOVES <span className="text-[#C6FF00]">LIKE</span>
    </span>
  );
}
