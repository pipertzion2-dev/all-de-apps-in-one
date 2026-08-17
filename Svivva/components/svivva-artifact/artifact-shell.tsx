"use client";

import { Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

// Re-exports consumed by app/page.tsx
export { FEATURES as ARTIFACT_FEATURES } from "./feature-defs";
export { FeatureSection } from "./feature-section";
export type { FeatureDef, FeatureId } from "./feature-defs";

const ArtifactCanvas = lazy(() =>
  import("./artifact-canvas").then((m) => ({ default: m.ArtifactCanvas })),
);

/** Canvas renders at 1.85× the box; pull up following sections without clipping the cube. */
const CUBE_SIZE = "min(500px, 90vw)";
const CANVAS_OVERFLOW = `calc(0.425 * ${CUBE_SIZE})`;
const CUBE_SCROLL_BLEED = `calc(-1 * ${CANVAS_OVERFLOW})`;

export function SvivvaArtifact() {
  const router = useRouter();

  const handleSelect = (id: FeatureId) => {
    const target = FEATURES.find((f) => f.id === id);
    if (!target) return;
    router.push(target.cta.href);
    window.scrollTo(0, 0);
  };

  return (
    <section
      data-svivva-artifact
      className="w-full flex flex-col items-center gap-0 pt-16 pb-20 px-4 overflow-visible"
      style={{ marginBottom: CUBE_SCROLL_BLEED }}
    >
      <div className="text-center mb-4 select-none pointer-events-none relative z-[1]">
        <p
          className="text-[10px] uppercase tracking-[0.35em] mb-3 font-mono font-semibold"
          style={{ color: "#5B8DA8", letterSpacing: "0.28em" }}
        >
          ZZAI6
        </p>
        <h2
          className="text-3xl md:text-4xl font-light tracking-tight text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          Six Worlds. One Platform.
        </h2>
        <p
          className="mt-3 text-sm font-light text-muted-foreground"
          style={{ letterSpacing: "0.04em" }}
        >
          Every face is a feature. Rotate to explore.
        </p>
      </div>

      <p className="text-muted-foreground/50 text-[10px] tracking-widest uppercase mb-0 select-none pointer-events-none relative z-[1]">
        drag to rotate &nbsp;·&nbsp; tap a face to open
      </p>

      <div
        style={{
          position: "relative",
          width: CUBE_SIZE,
          height: CUBE_SIZE,
          overflow: "visible",
          zIndex: 10,
          // Keep the 1.85× WebGL canvas from painting over the caption above.
          marginTop: CANVAS_OVERFLOW,
        }}
      >
        <div
          className="absolute inset-[-18%] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, #ffffff0a 0%, transparent 70%)",
          }}
        />

        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-white/15 text-xs tracking-widest">
              loading…
            </div>
          }
        >
          <ArtifactCanvas active="play" onSelect={handleSelect} />
        </Suspense>
      </div>

      <div className="flex gap-5 mt-10 relative z-20">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleSelect(f.id)}
            aria-label={f.name}
            className="group flex flex-col items-center gap-2 transition-all"
          >
            <div
              className="rounded-full transition-all duration-300 group-hover:scale-110"
              style={{
                width: 8,
                height: 8,
                background: f.accentColor,
                opacity: 0.55,
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
