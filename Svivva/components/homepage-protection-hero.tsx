"use client";

import Image from "next/image";
import Link from "next/link";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";
import { PRODUCT_PROTECTION_PITCH, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { Button } from "@/components/ui/button";

/** Homepage hero — Poor Man Protection copy only (shirt photo is on the intro flip). */
export function HomepageProtectionHero() {
  return (
    <section
      className="relative scroll-mt-4 border-b border-border/40 bg-gradient-to-b from-[#5B8DA8]/8 to-background px-4 pb-10 pt-8 sm:snap-start sm:px-6 sm:pb-14 sm:pt-10"
      data-testid="homepage-protection-hero"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 lg:max-w-6xl lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-5 text-center lg:max-w-xl lg:text-left">
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

        <div className="flex shrink-0 flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-6 py-5 shadow-lg backdrop-blur-sm">
          <Image
            src={zzaiLogo}
            alt="zzai zzai official logo"
            width={96}
            height={96}
            className="h-20 w-20 rounded-md object-contain sm:h-24 sm:w-24"
          />
          <div className="text-center">
            <p className="text-xs font-semibold leading-snug">Logo by my son</p>
            <p className="text-[10px] text-muted-foreground">Designed at the computer · Age 6</p>
          </div>
        </div>
      </div>
    </section>
  );
}
