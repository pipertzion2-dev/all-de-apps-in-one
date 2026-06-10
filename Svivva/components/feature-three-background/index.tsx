"use client";

/**
 * Ambient feature background — accent gradients + procedural motif canvas.
 * No artwork PNG crops; motifs/colors derived from feature-defs (Clutety / Pyracrypt style).
 */

import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { MOTIF_LAYERS, type MotifId } from "@/components/feature-motif-layers";

export type FeatureVariant = FeatureId;

type Props = { variant: FeatureVariant };

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
  const secondary = variant === "seeds" ? "#6B2C4A" : variant === "orbit" ? "#5BA8A0" : undefined;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ background: ambientGradient(feature.accentColor, secondary) }}
    >
      <div className="absolute inset-0 opacity-[0.55]">
        <Motif color={feature.accentColor} opacity={0.85} />
      </div>
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
