"use client";

import { useState, Suspense, lazy } from "react";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";
import { FeatureArtworkLayer } from "./feature-artwork-layer";

// Re-export for consumers
export { FEATURES as ARTIFACT_FEATURES } from "./feature-defs";
export { FeatureSection } from "./feature-section";
export type { FeatureDef, FeatureId } from "./feature-defs";

// Lazy-load the WebGL canvas so it doesn't block SSR
const ArtifactCanvas = lazy(() =>
  import("./artifact-canvas").then((m) => ({ default: m.ArtifactCanvas })),
);

export function SvivvaArtifact() {
  const [active, setActive] = useState<FeatureId>("play");
  const feature = FEATURES.find((f) => f.id === active)!;

  return (
    <section className="w-full py-24 px-4 flex flex-col items-center gap-16">
      {/* ─── Heading ─── */}
      <div className="text-center max-w-2xl">
        <p className="uppercase tracking-[0.25em] text-xs text-white/30 mb-3">Six Worlds</p>
        <h2 className="text-3xl md:text-5xl font-light text-white/90 tracking-tight">
          The Svivva Artifact
        </h2>
        <p className="mt-4 text-white/45 text-sm leading-relaxed">
          Drag · rotate · explore every feature
        </p>
      </div>

      {/* ─── Main layout ─── */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_440px_1fr] gap-10 items-center">
        {/* LEFT — artwork */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <FeatureArtworkLayer feature={feature} visible />
        </div>

        {/* CENTRE — artifact cube */}
        <div className="flex flex-col items-center gap-8">
          <div
            className="w-full aspect-square max-w-[400px] rounded-2xl overflow-hidden"
            style={{
              background: "radial-gradient(circle at 50% 50%, #ffffff08 0%, transparent 70%)",
            }}
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                  Loading Artifact…
                </div>
              }
            >
              <ArtifactCanvas active={active} onSelect={setActive} />
            </Suspense>
          </div>

          {/* Feature indicators */}
          <div className="flex gap-3 flex-wrap justify-center">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className="group relative flex flex-col items-center gap-1.5 transition-all"
                aria-label={f.name}
              >
                <div
                  className="w-2 h-2 rounded-full border transition-all duration-300"
                  style={{
                    background: active === f.id ? f.accentColor : "transparent",
                    borderColor: active === f.id ? f.accentColor : "rgba(255,255,255,0.2)",
                    boxShadow: active === f.id ? `0 0 10px ${f.accentColor}` : "none",
                    transform: active === f.id ? "scale(1.6)" : "scale(1)",
                  }}
                />
                <span
                  className="text-[10px] uppercase tracking-widest transition-all duration-300"
                  style={{ color: active === f.id ? f.accentColor : "rgba(255,255,255,0.25)" }}
                >
                  {f.id}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — feature preview */}
        <div
          className="flex flex-col gap-6 text-left max-w-sm mx-auto lg:mx-0"
          key={active}
          style={{ animation: "svivvaFadeSlideIn 0.4s ease forwards" }}
        >
          <div>
            <p
              className="text-xs uppercase tracking-[0.22em] font-light mb-2"
              style={{ color: feature.accentColor }}
            >
              {feature.artworkTitle}
            </p>
            <h3 className="text-2xl md:text-3xl font-light text-white/90 leading-tight">
              {feature.name}
            </h3>
            <p className="mt-1 text-white/30 text-sm italic">{feature.tagline}</p>
          </div>
          <p className="text-white/55 leading-relaxed text-sm">{feature.description}</p>
          <a
            href={feature.cta.href}
            className="self-start inline-flex items-center gap-2 text-sm font-light px-6 py-2.5 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              color: feature.accentColor,
              borderColor: `${feature.accentColor}60`,
              background: `${feature.accentColor}10`,
            }}
          >
            {feature.cta.label}
            <span className="text-xs opacity-60">→</span>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes svivvaFadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
