import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildCubeGraphicScene } from "@/lib/feature-graphic-scene";

export type ScrollHeroScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Hero scroll band — same graphic layout as the homepage cube face. */
export function buildGraphicScrollHeroScene(
  variant: FeatureId,
  _palette: GraphicPalette,
): ScrollHeroScene {
  const graphic = buildCubeGraphicScene(variant, "hero");
  return { root: graphic.root, tick: graphic.tick };
}
