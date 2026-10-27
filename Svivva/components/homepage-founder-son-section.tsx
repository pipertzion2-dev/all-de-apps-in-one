"use client";

import Image from "next/image";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";
import { FOUNDER_SON_COMPUTER_ALT, FOUNDER_SON_COMPUTER_SRC } from "@/lib/brand/founder-media";

/** Son at the computer — logo credit sits beside his photo. */
export function HomepageFounderSonSection() {
  return (
    <section
      id="founder-story"
      className="relative overflow-hidden border-t border-border/40 py-14 sm:py-20"
      data-testid="homepage-founder-son-section"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-2 space-y-4 lg:order-1">
            <div className="mx-auto flex max-w-sm flex-col items-stretch gap-4 sm:max-w-none sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
                <Image
                  src={FOUNDER_SON_COMPUTER_SRC}
                  alt={FOUNDER_SON_COMPUTER_ALT}
                  width={1600}
                  height={2000}
                  className="block h-auto w-full object-cover object-center"
                />
              </div>

              <div
                className="mx-auto flex w-full max-w-[11rem] shrink-0 flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-5 shadow-xl backdrop-blur-sm sm:mx-0 sm:mb-1"
                data-testid="founder-son-logo-credit"
              >
                <Image
                  src={zzaiLogo}
                  alt="zzai zzai official logo"
                  width={96}
                  height={96}
                  className="h-20 w-20 rounded-md object-contain sm:h-24 sm:w-24"
                />
                <div className="text-center">
                  <p className="text-xs font-semibold leading-snug text-foreground">
                    Logo by my son
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Designed at the computer · Age 6
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 space-y-6 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#5B8DA8]">
              My son
            </div>

            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              He designed the logo at the computer
            </h2>

            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                My six-year-old son sat with me at the computer and helped shape the zzai zzai logo
                — the crest, the colors, and the mark you see across this site.
              </p>
              <p>
                He picks palettes the way other kids pick cartoons: bold, honest, a little
                unexpected. The cyan and magenta you notice in the app? Those were his calls.
              </p>
              <p className="font-medium text-foreground/85">
                We are building something he can point to and say he helped make — starting with the
                logo beside this photo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
