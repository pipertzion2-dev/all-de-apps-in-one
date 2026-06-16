import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeatureBloomScene } from "@/lib/feature-bloom-scene";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";

export type SceneTick = (t: number, scrollOverride?: number) => void;

/** Full-page bloom background — layered shader petals + camo veil. */
export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Object3D,
  mouse: { x: number; y: number },
): Promise<SceneTick> {
  const bloom = buildFeatureBloomScene(variant, "page");
  bloom.root.position.set(0, 0, -2.5);
  scene.add(bloom.root);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? pageScrollProgress();
    bloom.tick(t, scroll, mouse);
  });
}
