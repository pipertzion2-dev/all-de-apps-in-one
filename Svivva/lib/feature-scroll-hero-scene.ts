import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildCubeGraphicScene } from "@/lib/feature-graphic-scene";

export type ScrollHeroScene = {
  root: import("three").Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Hero scroll band — graphic-faithful motifs + immersive depth (Pyracrypt-style). */
export function buildGraphicScrollHeroScene(variant: FeatureId, _palette: GraphicPalette): ScrollHeroScene {
  const graphic = buildCubeGraphicScene(variant, "hero");
  return { root: graphic.root, tick: graphic.tick };
}
