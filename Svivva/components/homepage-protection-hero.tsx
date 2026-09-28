"use client";

import Image from "next/image";
import Link from "next/link";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";
import { PRODUCT_PROTECTION_PITCH, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { Button } from "@/components/ui/button";

/** Homepage hero — Poor Man Protection first; founder photo lives once above pricing. */
export function HomepageProtectionHero() {
  return (
    <section
      className="relative border-b border-border/40 bg-gradient-to-b from-[#5B8DA8]/8 to-background px-4 py-10 sm:px-6 sm:py-14"
      data-testid="homepage-protection-hero"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5 text-center lg:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#5B8DA8]">
            Poor Man Protection
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {PRODUCT_TAGLINE}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {PRODUCT_PROTECTION_PITCH} Use it for sketches, sneaker colorways, lyrics, or API
            schemas — anything you may need to prove you had first.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild className="bg-[#5B8DA8] text-white">
              <Link href="/dashboard/poor-man-protection">Open Poor Man Protection</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/protect/verify">Verify a seal</Link>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground">
              <Link href="/clean-sneaks">Klean Sneaks demo</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-4 lg:max-w-none lg:items-end">
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-6 py-5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
            <Image
              src={zzaiLogo}
              alt="zzai zzai official logo"
              width={96}
              height={96}
              className="h-24 w-24 rounded-lg object-contain"
              priority
            />
            <div className="text-left">
              <p className="text-sm font-semibold leading-snug">Logo at the computer</p>
              <p className="mt-1 text-xs text-muted-foreground">My son helped design the mark</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
