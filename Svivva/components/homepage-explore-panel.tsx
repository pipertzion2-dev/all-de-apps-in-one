"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";

type HomepageExplorePanelProps = {
  mountBackground?: boolean;
  children?: React.ReactNode;
};

/** Home face — digi camo backdrop plus site links / footer. */
export function HomepageExplorePanel({
  mountBackground = true,
  children,
}: HomepageExplorePanelProps) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-background">
      <HomepageScrollHint
        label="Flip up · game"
        direction="up"
        onActivate={() => scrollToHomepagePanel("home-game")}
      />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {mountBackground ? (
          <CamoThreeOverlay
            preset="features"
            eagerMount
            keepMounted
            className="h-full w-full opacity-70"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.82) 45%, hsl(var(--background)) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
        <div className="mx-auto w-full max-w-3xl space-y-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#5B8DA8]">
            Explore zzai zzai
          </p>
          <h2 className="text-2xl font-bold sm:text-3xl">From seed to symphony</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Flip down for the product cube, or jump directly into the stack.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#5B8DA8]/40"
              onClick={() => scrollToHomepagePanel("nav-cube")}
            >
              Product cube
            </Button>
            <Link href="/seeds">
              <Button size="sm" variant="outline" className="border-[#5B8DA8]/40">
                ZZAI Seeds
              </Button>
            </Link>
            <Link href="/play">
              <Button size="sm" variant="outline" className="border-[#5B8DA8]/40">
                Play
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="sm" variant="outline" className="border-[#5B8DA8]/40">
                Blog
              </Button>
            </Link>
            <Link href="/tools">
              <Button size="sm" variant="outline" className="border-[#5B8DA8]/40">
                Free tools
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-[#5B8DA8]">
                Dashboard
              </Button>
            </Link>
            <a href="/signup">
              <Button size="sm" variant="outline">
                Start Free
              </Button>
            </a>
          </div>
        </div>

        {children ? <div className="mt-10 w-full">{children}</div> : null}
      </div>

      <HomepageScrollHint
        label="Flip · cube"
        direction="down"
        onActivate={() => scrollToHomepagePanel("nav-cube")}
      />
    </section>
  );
}
