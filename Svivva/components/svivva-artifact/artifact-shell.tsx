"use client";

import { Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

export { FEATURES as ARTIFACT_FEATURES } from "./feature-defs";
export { FeatureSection } from "./feature-section";
export type { FeatureDef, FeatureId } from "./feature-defs";

const ArtifactCanvas = lazy(() =>
  import("./artifact-canvas").then((m) => ({ default: m.ArtifactCanvas })),
);

/** Canvas renders at 1.85× the box; pull up following sections without clipping the cube. */
const CUBE_SIZE = "min(520px, 92vw)";
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
      id="nav-cube"
      data-svivva-artifact
      className="w-full flex flex-col items-center gap-0 pt-24 sm:pt-28 pb-8 px-4 overflow-visible"
      style={{ marginBottom: CUBE_SCROLL_BLEED }}
    >
      <div className="text-center mb-4 select-none pointer-events-none relative z-[1] max-w-xl">
        <p
          className="text-[10px] uppercase tracking-[0.35em] mb-3 font-mono font-semibold"
          style={{ color: "#5B8DA8", letterSpacing: "0.28em" }}
        >
          Main navigation · 6 faces
        </p>
        <h2
          className="text-3xl md:text-4xl font-light tracking-tight text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          Six products. One cube.
        </h2>
        <p
          className="mt-3 text-sm font-light text-muted-foreground"
          style={{ letterSpacing: "0.04em" }}
        >
          Each face is a product. Drag to rotate. Tap a face — or a name below — to open it.
        </p>
      </div>

      <p className="text-muted-foreground/50 text-[10px] tracking-widest uppercase mb-0 select-none pointer-events-none relative z-[1]">
        Play · Seeds · Hardware · Digital · Orbit · Protect
      </p>

      <div
        style={{
          position: "relative",
          width: CUBE_SIZE,
          height: CUBE_SIZE,
          overflow: "visible",
          zIndex: 10,
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
              loading cube…
            </div>
          }
        >
          <ArtifactCanvas active="play" onSelect={handleSelect} />
        </Suspense>
      </div>

      <nav
        aria-label="Cube faces"
        className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-xl relative z-20"
      >
        {FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleSelect(f.id)}
            aria-label={`Open ${f.name}`}
            className="group flex flex-col items-start gap-0.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-2.5 text-left hover:border-[#5B8DA8]/60 transition-colors"
          >
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: f.accentColor }}
            >
              Face
            </span>
            <span className="text-sm font-semibold text-foreground group-hover:text-[#5B8DA8]">
              {f.shortLabel}
            </span>
            <span className="text-[11px] text-muted-foreground leading-snug">{f.name}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
