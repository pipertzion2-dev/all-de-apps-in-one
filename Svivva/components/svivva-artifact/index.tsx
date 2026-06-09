"use client";

import { useState, Suspense, lazy } from "react";
import Link from "next/link";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

// Re-exports consumed by app/page.tsx
export { FEATURES as ARTIFACT_FEATURES } from "./feature-defs";
export { FeatureSection } from "./feature-section";
export type { FeatureDef, FeatureId } from "./feature-defs";

const ArtifactCanvas = lazy(() =>
  import("./artifact-canvas").then((m) => ({ default: m.ArtifactCanvas })),
);

export function SvivvaArtifact() {
  const [active, setActive] = useState<FeatureId | null>(null);
  const feature = active ? (FEATURES.find((f) => f.id === active) ?? null) : null;

  const handleSelect = (id: FeatureId) => {
    // tapping the same face again dismisses the card
    setActive((prev) => (prev === id ? null : id));
  };

  return (
    <section className="w-full flex flex-col items-center gap-0 py-20 px-4">
      {/* ── Instruction line ───────────────────────────────────────────────── */}
      <p className="text-white/30 text-xs tracking-widest uppercase mb-8 select-none">
        drag to rotate &nbsp;·&nbsp; tap a face to explore
      </p>

      {/* ── Cube — no overflow clip so it never gets cut off ─────────────── */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: "min(460px, 90vw)", height: "min(460px, 90vw)" }}
      >
        {/* Subtle ambient glow behind the cube */}
        <div
          className="absolute inset-[-18%] rounded-full pointer-events-none"
          style={{
            background: feature
              ? `radial-gradient(circle, ${feature.accentColor}22 0%, transparent 70%)`
              : "radial-gradient(circle, #ffffff0a 0%, transparent 70%)",
            transition: "background 0.6s ease",
          }}
        />

        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-white/15 text-xs tracking-widest">
              loading…
            </div>
          }
        >
          <ArtifactCanvas active={active ?? "play"} onSelect={handleSelect} />
        </Suspense>
      </div>

      {/* ── Feature reveal card — appears on tap ───────────────────────────── */}
      <div
        className="mt-8 w-full"
        style={{
          maxWidth: "min(460px, 90vw)",
          minHeight: "4.5rem",
        }}
      >
        {feature ? (
          <div
            key={feature.id}
            className="rounded-2xl border px-6 py-5 flex flex-col gap-3"
            style={{
              borderColor: `${feature.accentColor}40`,
              background: `${feature.accentColor}0d`,
              animation: "artifactReveal 0.3s ease forwards",
            }}
          >
            <h3
              className="text-lg font-light tracking-tight"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {feature.name}
            </h3>
            <p className="text-white/45 text-sm leading-relaxed">{feature.description}</p>
            <Link
              href={feature.cta.href}
              className="self-start inline-flex items-center gap-2 text-sm font-light px-5 py-2 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 mt-1"
              style={{
                color: feature.accentColor,
                borderColor: `${feature.accentColor}55`,
                background: `${feature.accentColor}14`,
              }}
            >
              {feature.cta.label}
              <span className="opacity-50 text-xs">→</span>
            </Link>
          </div>
        ) : (
          <p className="text-center text-white/18 text-xs tracking-widest select-none">
            tap any face
          </p>
        )}
      </div>

      {/* ── 6 dot indicators — no text, just coloured dots ─────────────────── */}
      <div className="flex gap-5 mt-8">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            onClick={() => handleSelect(f.id)}
            aria-label={f.name}
            className="group flex flex-col items-center gap-2 transition-all"
          >
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: active === f.id ? 10 : 7,
                height: active === f.id ? 10 : 7,
                background: active === f.id ? f.accentColor : "rgba(255,255,255,0.18)",
                boxShadow: active === f.id ? `0 0 10px 2px ${f.accentColor}80` : "none",
              }}
            />
          </button>
        ))}
      </div>

      <style>{`
        @keyframes artifactReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
