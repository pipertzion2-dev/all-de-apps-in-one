"use client";

import dynamic from "next/dynamic";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";

const SvivvaArtifact = dynamic(
  () => import("@/components/svivva-artifact").then((m) => m.SvivvaArtifact),
  { ssr: false },
);

type HomepageHeroBlockProps = {
  /** When true, cube face buttons are clickable (end of intro flip). */
  interactive?: boolean;
  className?: string;
};

/** Homepage hero: digi camo + ZZAI6 navigation cube — used on intro back face and main flow. */
export function HomepageHeroBlock({ interactive = true, className = "" }: HomepageHeroBlockProps) {
  return (
    <div
      className={`relative w-full min-h-[100svh] overflow-x-hidden bg-background ${className}`}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-0" aria-hidden>
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden opacity-80 md:opacity-65">
          <CamoThreeOverlay preset="oaas" eagerMount keepMounted className="h-full w-full" />
        </div>
      </div>
      <div className="relative z-10">
        <SvivvaArtifact />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 z-[1]"
        style={{
          background:
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 35%, transparent 100%)",
        }}
      />
    </div>
  );
}
