"use client";

import dynamic from "next/dynamic";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";

const SvivvaArtifact = dynamic(
  () => import("@/components/svivva-artifact").then((m) => m.SvivvaArtifact),
  { ssr: false },
);

type HomepageHeroBlockProps = {
  /** When true, cube face buttons are clickable (end of intro flip). */
  interactive?: boolean;
  /** Defer WebGL cube until intro completes. */
  mountCanvas?: boolean;
  /** Show stack navigation hint (disabled when parent wraps cube + pricing). */
  showFlipHint?: boolean;
  /** Shorter hero when about/pricing sections follow below the cube. */
  layout?: "fullscreen" | "stacked";
  className?: string;
};

/** Homepage hero: digi camo + ZZAI6 navigation cube — used on intro back face and main flow. */
export function HomepageHeroBlock({
  interactive = true,
  mountCanvas = true,
  showFlipHint = true,
  layout = "fullscreen",
  className = "",
}: HomepageHeroBlockProps) {
  const stacked = layout === "stacked";

  return (
    <div
      data-homepage-scroll-panel=""
      className={`homepage-scroll-panel relative w-full overflow-x-hidden bg-background ${
        stacked ? "min-h-0 pb-2" : "min-h-[100svh]"
      } ${className}`}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0"
        aria-hidden
        style={stacked ? { bottom: 0 } : undefined}
      >
        <div
          className={`w-full overflow-hidden opacity-80 md:opacity-65 ${stacked ? "h-full min-h-[520px]" : "sticky top-0 h-[100svh]"}`}
        >
          <CamoThreeOverlay preset="oaas" eagerMount keepMounted className="h-full w-full" />
        </div>
      </div>
      <div className="relative z-10">
        <SvivvaArtifact mountCanvas={mountCanvas} />
      </div>
      {interactive && showFlipHint ? (
        <HomepageScrollHint
          label="Flip up · game"
          direction="up"
          onActivate={() => scrollToHomepagePanel("home-game")}
        />
      ) : null}
      {stacked ? null : (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 z-[1]"
          style={{
            background:
              "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 35%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
}
