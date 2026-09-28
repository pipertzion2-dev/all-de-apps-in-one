"use client";

import Image from "next/image";
import Link from "next/link";
import introImage from "@/attached_assets/IMG_1493_1770509047497.png";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";
import { BED_STUY_VYBES } from "@/lib/brand/bed-stuy-vybes";
import {
  PRODUCT_PROTECTION_PITCH,
  PRODUCT_TAGLINE,
} from "@/lib/product-positioning";
import { Button } from "@/components/ui/button";

/** Main homepage message: asset protection + son who designed the logo at the computer. */
export function HomepageProtectionHero() {
  return (
    <section
      className="relative border-b border-border/40 bg-gradient-to-b from-[#5B8DA8]/8 to-background px-4 py-10 sm:px-6 sm:py-14"
      data-testid="homepage-protection-hero"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5 text-center lg:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#5B8DA8]">
            {BED_STUY_VYBES.name} · {BED_STUY_VYBES.fullAddress}
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {PRODUCT_TAGLINE}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {PRODUCT_PROTECTION_PITCH} As a fashion designer, I collaborate with{" "}
            <strong className="text-foreground">{BED_STUY_VYBES.name}</strong> to make it easy to
            protect your work through blockchain and our protection coin — before you ever need a
            courtroom.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild className="bg-[#5B8DA8] text-white">
              <Link href="/dashboard/poor-man-protection">Protect an idea</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/clean-sneaks">Protect sneakers in-game</Link>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground">
              <Link href="/protect/verify">Verify evidence</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl ring-1 ring-black/5">
            <Image
              src={introImage}
              alt="Young logo designer at the computer — co-created the zzai zzai mark"
              width={1024}
              height={1024}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:left-6">
            <Image
              src={zzaiLogo}
              alt="zzai zzai official logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-md object-contain"
            />
            <div className="text-left">
              <p className="text-xs font-semibold leading-snug">Logo by my son</p>
              <p className="text-[10px] text-muted-foreground">Designed at the computer · Age 6</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
