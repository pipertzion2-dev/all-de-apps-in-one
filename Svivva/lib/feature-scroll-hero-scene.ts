import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildFeatureBloomScene } from "@/lib/feature-bloom-scene";

export type ScrollHeroScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Hero scroll band — layered bloom scene. */
export function buildGraphicScrollHeroScene(variant: FeatureId, _palette: GraphicPalette): ScrollHeroScene {
  const bloom = buildFeatureBloomScene(variant, "hero");
  return { root: bloom.root, tick: bloom.tick };
}
