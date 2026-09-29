"use client";

import Image from "next/image";
import { FOUNDER_SON_COMPUTER_ALT, FOUNDER_SON_COMPUTER_SRC } from "@/lib/brand/founder-media";

/** Son at the computer — sits on the cube homepage immediately before pricing. */
export function HomepageFounderSonSection() {
  return (
    <section
      id="founder-story"
      className="relative overflow-hidden border-t border-border/40 py-14 sm:py-20"
      data-testid="homepage-founder-son-section"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-2 pb-8 lg:order-1">
            <div className="mx-auto max-w-sm overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 lg:max-w-none">
              <Image
                src={FOUNDER_SON_COMPUTER_SRC}
                alt={FOUNDER_SON_COMPUTER_ALT}
                width={1600}
                height={2000}
                className="block h-auto w-full object-cover object-center"
              />
            </div>
            <div className="absolute bottom-0 right-2 max-w-[220px] rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-xl backdrop-blur-xl sm:right-0">
              <p className="text-xs font-semibold leading-snug text-foreground">
                Logo designer at the computer
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Age 6 · zzai zzai mark</p>
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
                logo in this photo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
