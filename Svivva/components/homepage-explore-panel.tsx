"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";

type HomepageExplorePanelProps = {
  mountBackground?: boolean;
  children?: React.ReactNode;
  journeyMode?: boolean;
  onBack?: () => void;
  onBegin?: () => void;
};

/** Home face — digi camo backdrop plus site links / footer. */
export function HomepageExplorePanel({
  mountBackground = true,
  children,
  journeyMode = false,
  onBack,
  onBegin,
}: HomepageExplorePanelProps) {
  return (
    <section
      data-homepage-scroll-panel={journeyMode ? undefined : ""}
      className={`relative overflow-hidden bg-background ${
        journeyMode ? "min-h-[60svh]" : "homepage-scroll-panel min-h-[100svh]"
      }`}
    >
      {journeyMode ? (
        <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 flex-wrap justify-center gap-2">
          {onBack ? (
            <Button size="sm" variant="outline" className="border-[#5B8DA8]/40" onClick={onBack}>
              ← Game
            </Button>
          ) : null}
          {onBegin ? (
            <Button size="sm" variant="outline" className="border-[#5B8DA8]/40" onClick={onBegin}>
              ← Begin
            </Button>
          ) : null}
        </div>
      ) : (
        <HomepageScrollHint
          label="Scroll up · game"
          direction="up"
          onActivate={() => scrollToHomepagePanel("home-game")}
        />
      )}

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

      <div
        className={`relative z-10 flex flex-col justify-between px-4 pb-8 sm:px-6 ${
          journeyMode ? "pt-20" : "min-h-[100svh] pt-24 sm:pt-28"
        }`}
      >
        <div className="mx-auto w-full max-w-3xl space-y-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#5B8DA8]">
            Explore zzai zzai
          </p>
          <h2 className="text-2xl font-bold sm:text-3xl">From seed to symphony</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {journeyMode
              ? "Rotate the cube back to Begin for product navigation, or jump directly into the stack."
              : "Spin the cube to open any channel, play Klean Sneaks on the next screen, or jump directly into the stack."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {journeyMode && onBegin ? (
              <Button size="sm" variant="outline" className="border-[#5B8DA8]/40" onClick={onBegin}>
                Back to begin
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-[#5B8DA8]/40"
                onClick={() => scrollToHomepagePanel("nav-cube")}
              >
                Back to cube
              </Button>
            )}
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
    </section>
  );
}
