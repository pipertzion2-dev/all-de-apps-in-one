"use client";

import Link from "next/link";
import { PRODUCT_ONE_LINER } from "@/lib/product-positioning";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";

/** Shown on experimental modules while the core guardrails product is GA. */
export function BetaSurfaceBanner() {
  return (
    <div
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-foreground/90"
      role="status"
      data-testid="banner-product-beta"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <FeatureBetaBadge />
        <span>
          This module is in <strong>beta</strong>.{" "}
          <span className="text-muted-foreground">{PRODUCT_ONE_LINER}</span>
        </span>
        <Link href="/" className="font-semibold text-[#5B8DA8] hover:underline">
          Core product →
        </Link>
      </div>
    </div>
  );
}
