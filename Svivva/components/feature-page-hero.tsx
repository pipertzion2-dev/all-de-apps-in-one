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
    <section className="relative pt-6 pb-6 sm:pt-8 sm:pb-8 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">
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
      </div>

      <div className="my-8 sm:my-10">
        <FeatureScrollBand variant={variant} accentColor={feature.accentColor} height={520} />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4 text-center sm:text-left">
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
    </section>
  );
}
