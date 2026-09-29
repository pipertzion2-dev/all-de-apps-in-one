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
                My son at the computer
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                He helped design the zzai zzai logo
              </p>
            </div>
          </div>

          <div className="order-1 space-y-6 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#5B8DA8]">
              Founder story
            </div>

            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              Built at the computer — focused on evidence you can stand on
            </h2>

            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                The photo is my son at the computer — the same session where he helped shape the
                zzai zzai logo. The product story on this site is not hype; it is Poor Man
                Protection: seal a file, keep custody notes, and export a pack a lawyer can read.
              </p>
              <p>
                That workflow is for designers, musicians, and builders who need a timestamped
                record before formal patent or copyright filings. We also partner with Bed Stuy
                Vybez in Brooklyn for fashion and storefront creators who want the same discipline
                on early sketches.
              </p>
              <p>
                Klean Sneaks and Hybrid² Lab stay available as demos and beta tools. The homepage
                leads with Poor Man Protection because that is the clearest promise we can keep in
                plain language.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
