"use client";

import dynamic from "next/dynamic";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { FEATURES } from "@/components/svivva-artifact/feature-defs";

const FeatureScrollBand = dynamic(
  () => import("@/components/feature-scroll-band").then((m) => m.FeatureScrollBand),
  { ssr: false },
);

const PAGE_STATS: Record<FeatureId, [string, string, string]> = {
  play: ["Hocket voices", "Meend bends", "∞ Real-time"],
  seeds: ["PDF → Apps", "Parallel build", "∞ Branches"],
  orbit: ["8 Systems", "50+ Mini-apps", "∞ Traffic"],
  security: ["Feed Shield", "Threat scan", "∞ Sealed"],
  api: ["Schema lock", "200 Evals", "∞ Versions"],
  hardware: ["AI Schematics", "Suppliers", "∞ Tangible"],
};

const PAGE_HEADLINE: Record<FeatureId, [string, string]> = {
  play: ["ONE STUDIO.", "INFINITE SOUND."],
  seeds: ["ONE SPEC.", "MANY APPS."],
  orbit: ["ONE ENGINE.", "FULL FUNNEL."],
  security: ["ONE VAULT.", "COMPLETE COVERAGE."],
  api: ["ONE PROMPT.", "PRODUCTION API."],
  hardware: ["ONE CONCEPT.", "REAL PRODUCT."],
};

type Props = {
  variant: FeatureId;
  subtitle?: string;
};

export function FeaturePageHero({ variant, subtitle }: Props) {
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];
  const stats = PAGE_STATS[variant];
  const [headA, headB] = PAGE_HEADLINE[variant];

  return (
    <section className="relative px-4 pt-6 pb-10 sm:pt-10 sm:pb-14 overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
          {stats.map((label) => (
            <div key={label} className="space-y-1">
              <p
                className="text-base sm:text-xl font-light tracking-widest font-mono"
                style={{ color: feature.accentColor }}
              >
                {label.includes("∞") ? "∞" : label.split(" ")[0].toUpperCase()}
              </p>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {label.includes("∞") ? label.replace("∞ ", "") : label}
              </p>
            </div>
          ))}
        </div>

        <FeatureScrollBand variant={variant} accentColor={feature.accentColor} height={360} />

        <div className="text-center sm:text-left space-y-4 max-w-3xl">
          <p
            className="text-[10px] uppercase tracking-[0.35em] font-mono"
            style={{ color: feature.accentColor }}
          >
            — {feature.artworkTitle} —
          </p>
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]"
            data-testid={variant === "seeds" ? "text-seeds-title" : undefined}
          >
            <span className="text-foreground">{headA}</span>
            <br />
            <span style={{ color: feature.accentColor }}>{headB}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-mono leading-relaxed max-w-2xl">
            {subtitle ?? feature.description}
          </p>
          <p className="text-xs italic text-muted-foreground/80">{feature.tagline}</p>
        </div>
      </div>
    </section>
  );
}
