"use client";

import Image from "next/image";
import Link from "next/link";
import type { HouseCreative } from "@/lib/clean-sneaks/ads";

type Props = {
  creative: HouseCreative;
  /** compact = banner strip; featured = watch/interstitial card */
  variant?: "compact" | "featured";
  ctaAsChild?: boolean;
  onCtaClick?: () => void;
  "data-testid"?: string;
};

/**
 * Visible house ad creative — always includes image + copy so the slot never
 * reads as a blank dark rectangle.
 */
export function HouseAdCreative({
  creative,
  variant = "featured",
  onCtaClick,
  "data-testid": testId = "house-ad-creative",
}: Props) {
  if (variant === "compact") {
    return (
      <div className="flex w-full items-center gap-2.5" data-testid={testId}>
        <div
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-white/15"
          style={{ background: `${creative.accent}33` }}
        >
          <Image
            src={creative.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: creative.accent }}>
            {creative.headline}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/55">{creative.body}</p>
        </div>
        <Link
          href={creative.href}
          className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#0a0c10]"
          style={{ background: creative.accent }}
          onClick={onCtaClick}
          data-testid={`${testId}-cta`}
        >
          {creative.cta}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg border border-white/15"
      style={{ borderColor: `${creative.accent}55` }}
      data-testid={testId}
    >
      <div
        className="relative aspect-[16/9] w-full"
        style={{
          background: `linear-gradient(145deg, ${creative.accent}55 0%, #0a0c10 55%, #12151c 100%)`,
        }}
      >
        <Image
          src={creative.imageUrl}
          alt={creative.headline}
          fill
          className="object-contain p-4"
          sizes="(max-width: 420px) 90vw, 420px"
          unoptimized
          priority
        />
        <p className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.28em] text-white/70">
          Advertisement
        </p>
      </div>
      <div className="space-y-2 bg-[#0e1016] px-4 py-3">
        <p className="text-base font-semibold" style={{ color: creative.accent }}>
          {creative.headline}
        </p>
        <p className="text-xs leading-relaxed text-white/60">{creative.body}</p>
        <Link
          href={creative.href}
          className="inline-flex rounded-md px-3 py-1.5 text-xs font-semibold text-[#0a0c10]"
          style={{ background: creative.accent }}
          onClick={onCtaClick}
          data-testid={`${testId}-cta`}
        >
          {creative.cta}
        </Link>
      </div>
    </div>
  );
}
