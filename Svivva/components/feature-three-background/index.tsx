"use client";

/**
 * Per-feature interactive Three.js background.
 *
 * Each of the six features renders a WebGL background whose elements are pulled
 * directly from its corresponding cube-face graphic (accent color + signature
 * motif) and react to scroll — e.g. Play's waveform swells, Security's lock
 * rings rotate closed, Hardware's diamonds spin and refract.
 *
 * Falls back to the ambient gradient + procedural motif canvas if the WebGL
 * layer is still loading (or unavailable), so pages always have a backdrop.
 */

import dynamic from "next/dynamic";
import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { MOTIF_LAYERS, type MotifId } from "@/components/feature-motif-layers";

export type FeatureVariant = FeatureId;

type Props = { variant: FeatureVariant };

const WEBGL_BACKGROUNDS: Record<FeatureId, ReturnType<typeof dynamic>> = {
  play: dynamic(() => import("@/components/backgrounds/play-background"), { ssr: false }),
  seeds: dynamic(() => import("@/components/backgrounds/seeds-background"), { ssr: false }),
  orbit: dynamic(() => import("@/components/backgrounds/orbit-background"), { ssr: false }),
  security: dynamic(() => import("@/components/backgrounds/security-background"), { ssr: false }),
  api: dynamic(() => import("@/components/backgrounds/api-background"), { ssr: false }),
  hardware: dynamic(() => import("@/components/backgrounds/hardware-background"), { ssr: false }),
};

function ambientGradient(accent: string, secondary?: string): string {
  const sec = secondary ?? accent;
  return [
    `radial-gradient(ellipse 110% 70% at 18% 22%, ${accent}18 0%, transparent 52%)`,
    `radial-gradient(ellipse 90% 60% at 82% 78%, ${sec}12 0%, transparent 48%)`,
    `radial-gradient(ellipse 70% 50% at 50% 100%, ${accent}08 0%, transparent 55%)`,
    "hsl(var(--background))",
  ].join(", ");
}

export function FeatureThreeBackground({ variant }: Props) {
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];
  const Motif = MOTIF_LAYERS[feature.motif as MotifId] ?? MOTIF_LAYERS.waveform;
  const WebglBg = WEBGL_BACKGROUNDS[feature.id] ?? WEBGL_BACKGROUNDS.play;
  const secondary = variant === "seeds" ? "#6B2C4A" : variant === "orbit" ? "#5BA8A0" : undefined;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ background: ambientGradient(feature.accentColor, secondary) }}
    >
      {/* Procedural motif canvas — instant backdrop while WebGL loads */}
      <div className="absolute inset-0 opacity-[0.35]">
        <Motif color={feature.accentColor} opacity={0.7} />
      </div>

      {/* Interactive, graphic-derived WebGL layer (client only) */}
      <WebglBg />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 12%, transparent 88%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
}
