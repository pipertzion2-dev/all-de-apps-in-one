import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeatureBloomScene } from "@/lib/feature-bloom-scene";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";

export type SceneTick = (t: number, scrollOverride?: number) => void;

/** Full-page ambient 3D — soft bloom petals + distant mesh cluster behind glass UI. */
export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Object3D,
  mouse: { x: number; y: number },
): Promise<SceneTick> {
  const palette = getGraphicPalette(variant);
  const bloom = buildFeatureBloomScene(variant, "page");
  bloom.root.position.set(0, 0, -4);
  bloom.root.scale.setScalar(variant === "seeds" ? 1.05 : 0.95);
  scene.add(bloom.root);

  const cluster = buildAdvancedGraphicCluster(variant, palette);
  cluster.group.position.set(0, 0, -7);
  cluster.group.scale.setScalar(0.55);
  scene.add(cluster.group);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? pageScrollProgress();
    bloom.tick(t, scroll * 0.6, mouse);
    cluster.tick(t, scroll * 0.4, mouse);
    cluster.group.rotation.y = scroll * 0.25 + mouse.x * 0.06;
  });
}
