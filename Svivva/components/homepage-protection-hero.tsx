"use client";

import Link from "next/link";
import {
  HOMEPAGE_SCROLL_TO_PROTECTION,
  PRODUCT_HERO_HEADLINE,
  PRODUCT_NAME_LINE,
  PRODUCT_PROTECTION_PATH,
  PRODUCT_PROTECTION_PITCH,
  PRODUCT_TAGLINE,
} from "@/lib/product-positioning";
import { Button } from "@/components/ui/button";

/** Second-home lead — one product name, one job, one disclaimer. */
export function HomepageProtectionHero() {
  return (
    <section
      className="relative snap-start scroll-mt-4 border-b border-border/40 bg-gradient-to-b from-[#5B8DA8]/8 to-background px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10"
      data-testid="homepage-protection-hero"
    >
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#5B8DA8]">
          {PRODUCT_NAME_LINE}
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
          {PRODUCT_HERO_HEADLINE}
        </h1>
        <p className="text-base font-medium leading-snug text-foreground/90">{PRODUCT_TAGLINE}</p>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {PRODUCT_PROTECTION_PITCH}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Button asChild className="bg-[#5B8DA8] text-white">
            <Link href={PRODUCT_PROTECTION_PATH} data-testid="link-open-poor-man-protection">
              {HOMEPAGE_SCROLL_TO_PROTECTION}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/protect/verify">Verify a seal</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
