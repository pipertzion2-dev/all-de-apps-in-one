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
  // Play gets a closer, fuller view so the vibraphone bars and notes are legible
  const clusterZ = variant === "play" ? -5 : -7;
  const clusterScale = variant === "play" ? 0.62 : 0.55;
  cluster.group.position.set(0, variant === "play" ? -0.3 : 0, clusterZ);
  cluster.group.scale.setScalar(clusterScale);
  scene.add(cluster.group);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? pageScrollProgress();
    bloom.tick(t, scroll * 0.6, mouse);
    cluster.tick(t, scroll * 0.4, mouse);
    cluster.group.rotation.y =
      scroll * (variant === "play" ? 0.1 : 0.25) + mouse.x * (variant === "play" ? 0.04 : 0.06);
    // Play cluster: slight horizontal drift with mouse for immersion
    if (variant === "play") {
      cluster.group.position.x = mouse.x * 0.3;
    }
  });
}
