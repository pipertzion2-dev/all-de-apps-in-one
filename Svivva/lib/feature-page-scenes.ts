import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import { buildConceptDepth } from "@/lib/feature-concept-depth";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";

export type SceneTick = (t: number, scrollOverride?: number) => void;

/** Full-page ambient depth — subtle line-based metaphor, not bloom filler behind UI. */
export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Object3D,
  _mouse: { x: number; y: number },
): Promise<SceneTick> {
  const palette = getGraphicPalette(variant);
  const depth = buildConceptDepth(variant, palette);
  depth.group.position.set(0, 0, -10);
  depth.group.scale.setScalar(variant === "seeds" ? 1.05 : 0.95);
  scene.add(depth.group);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? pageScrollProgress();
    depth.tick(t, scroll);
  });
}
