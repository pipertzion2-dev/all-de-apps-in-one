"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";

const SIZE = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 64,
  xl: 96,
} as const;

type SizeKey = keyof typeof SIZE;

type BrandMarkProps = {
  size?: SizeKey | number;
  className?: string;
  priority?: boolean;
  /** When false, do not wrap in a link. Default: "/". */
  href?: string | false;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  testId?: string;
};

/**
 * Square ZZAI crest — replaces the old horizontal SVIVVA wordmark.
 * Always use this (or zzaiLogo directly) instead of SVIVVA_OFFICIAL_LOGO.
 */
export function BrandMark({
  size = "md",
  className = "",
  priority = false,
  href = "/",
  showWordmark = false,
  wordmarkClassName = "text-sm font-bold tracking-[0.2em] text-foreground/90",
  testId,
}: BrandMarkProps) {
  const dim = typeof size === "number" ? size : SIZE[size];
  const mark = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={zzaiLogo}
        alt={BRAND.name}
        width={dim}
        height={dim}
        priority={priority}
        className="object-contain drop-shadow-[0_0_12px_rgba(0,229,255,0.35)]"
        style={{ width: dim, height: dim }}
      />
      {showWordmark && <span className={wordmarkClassName}>{BRAND.name}</span>}
    </span>
  );

  if (href === false) return mark;
  return (
    <Link
      href={href}
      className="inline-flex items-center"
      aria-label={BRAND.name}
      data-testid={testId}
    >
      {mark}
    </Link>
  );
}

export { zzaiLogo };
