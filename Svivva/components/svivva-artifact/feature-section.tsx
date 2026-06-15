"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { FeatureDef, FeatureId } from "./feature-defs";
import { FeatureScrollBand } from "@/components/feature-scroll-band";

type Props = {
  feature: FeatureDef;
  index: number;
  reverse?: boolean;
};

const FEATURE_STATS: Record<FeatureId, [string, string, string]> = {
  play: ["Hocket voices", "Meend bends", "∞ Real-time"],
  seeds: ["PDF → Apps", "Parallel build", "∞ Branches"],
  orbit: ["8 Systems", "50+ Mini-apps", "∞ Traffic"],
  security: ["Feed Shield", "Threat scan", "∞ Sealed"],
  api: ["Schema lock", "200 Evals", "∞ Versions"],
  hardware: ["AI Schematics", "Suppliers", "∞ Tangible"],
};

const FEATURE_HEADLINE: Record<FeatureId, [string, string]> = {
  play: ["ONE STUDIO.", "INFINITE SOUND."],
  seeds: ["ONE SPEC.", "MANY APPS."],
  orbit: ["ONE ENGINE.", "FULL FUNNEL."],
  security: ["ONE VAULT.", "COMPLETE COVERAGE."],
  api: ["ONE PROMPT.", "PRODUCTION API."],
  hardware: ["ONE CONCEPT.", "REAL PRODUCT."],
};

export function FeatureSection({ feature, index, reverse }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stats = FEATURE_STATS[feature.id];
  const [headA, headB] = FEATURE_HEADLINE[feature.id];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={`feature-${feature.id}`}
      className="relative w-full py-16 sm:py-24 px-4 overflow-hidden border-b border-border/20"
      style={{
        opacity: 0,
        transform: "translateY(28px)",
        transition: "opacity 0.85s ease, transform 0.85s ease",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 55% at ${reverse ? "75%" : "25%"} 40%, ${feature.accentColor}10 0%, transparent 65%)`,
        }}
      />

      <div className="max-w-5xl mx-auto space-y-10">
        {/* Stats bar — Pyracrypt-style */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {stats.map((label) => (
            <div key={label} className="space-y-1">
              <p
                className="text-lg sm:text-xl font-light tracking-widest font-mono"
                style={{ color: feature.accentColor }}
              >
                {label.includes("∞") ? "∞" : label.split(" ")[0].toUpperCase()}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {label.includes("∞") ? label.replace("∞ ", "") : label}
              </p>
            </div>
          ))}
        </div>

        {/* Scroll-driven 3D band */}
        <FeatureScrollBand variant={feature.id} accentColor={feature.accentColor} height={300} />

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start ${reverse ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""}`}
        >
          <div className="space-y-5">
            <p
              className="text-[10px] uppercase tracking-[0.35em] font-mono"
              style={{ color: feature.accentColor }}
            >
              — {feature.artworkTitle} —
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              <span className="text-foreground">{headA}</span>
              <br />
              <span style={{ color: feature.accentColor }}>{headB}</span>
            </h2>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed max-w-md">
              {feature.description}
            </p>
            <p className="text-xs italic text-muted-foreground/70">{feature.tagline}</p>
          </div>

          <div
            className="rounded-2xl border bg-card/80 backdrop-blur-md p-6 space-y-4"
            style={{ borderColor: `${feature.accentColor}35` }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.25em] font-bold font-mono"
              style={{ color: feature.accentColor }}
            >
              I {feature.motif} motif
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.signatureMotion} — procedural geometry derived from the{" "}
              <strong className="text-foreground font-medium">{feature.artworkTitle}</strong> graphic,
              animated as you scroll.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span
                className="text-[10px] px-2.5 py-1 rounded-full border font-semibold"
                style={{
                  borderColor: `${feature.accentColor}40`,
                  color: feature.accentColor,
                  background: `${feature.accentColor}10`,
                }}
              >
                Three.js
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                Scroll reactive
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                Feature {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <Link
              href={feature.cta.href}
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${feature.accentColor}, ${feature.accentColor}cc)`,
                boxShadow: `0 4px 24px -4px ${feature.accentColor}60`,
              }}
            >
              {feature.cta.label}
              <span className="opacity-80">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
