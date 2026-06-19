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

  // Per-variant camera framing tuned to each cluster's geometry
  const CLUSTER_CFG: Record<FeatureId, { z: number; scale: number; y: number }> = {
    play: { z: -5, scale: 0.62, y: -0.3 },
    seeds: { z: -5.5, scale: 0.58, y: -0.1 },
    orbit: { z: -5.2, scale: 0.6, y: 0.0 },
    security: { z: -4.8, scale: 0.64, y: 0.0 },
    api: { z: -5.5, scale: 0.6, y: 0.0 },
    hardware: { z: -4.5, scale: 0.66, y: 0.2 },
  };
  const cfg = CLUSTER_CFG[variant];
  cluster.group.position.set(0, cfg.y, cfg.z);
  cluster.group.scale.setScalar(cfg.scale);
  scene.add(cluster.group);

  // Per-variant rotation sensitivity
  const ROTATION_SCROLL = {
    play: 0.1,
    seeds: 0.18,
    orbit: 0.2,
    security: 0.15,
    api: 0.18,
    hardware: 0.22,
  };
  const ROTATION_MOUSE = {
    play: 0.04,
    seeds: 0.05,
    orbit: 0.06,
    security: 0.05,
    api: 0.05,
    hardware: 0.06,
  };

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? pageScrollProgress();
    bloom.tick(t, scroll * 0.6, mouse);
    cluster.tick(t, scroll * 0.4, mouse);
    cluster.group.rotation.y =
      scroll * (ROTATION_SCROLL[variant] ?? 0.2) + mouse.x * (ROTATION_MOUSE[variant] ?? 0.05);
    // Subtle mouse drift for all variants (play is strongest)
    cluster.group.position.x = mouse.x * (variant === "play" ? 0.3 : 0.15);
    cluster.group.position.y = cfg.y + mouse.y * (variant === "hardware" ? 0.08 : 0.05);
  });
}
