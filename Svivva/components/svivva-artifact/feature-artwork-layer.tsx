"use client";

import Image from "next/image";
import type { FeatureDef } from "./feature-defs";
import { MOTIF_LAYERS, type MotifId } from "@/components/feature-motif-layers";

type Props = { feature: FeatureDef; visible: boolean };

export function FeatureArtworkLayer({ feature, visible }: Props) {
  const MotifLayer = MOTIF_LAYERS[feature.motif as MotifId] ?? MOTIF_LAYERS.waveform;
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
        boxShadow: visible ? `0 0 60px -10px ${feature.accentColor}40` : "none",
      }}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
        <Image
          src={feature.artworkSrc}
          alt={feature.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${feature.accentColor}60 0%, transparent 100%)`,
          }}
        />
        <MotifLayer color={feature.accentColor} />
      </div>
    </div>
  );
}
