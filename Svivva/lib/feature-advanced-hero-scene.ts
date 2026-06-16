import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";
import { buildFeatureBloomScene } from "@/lib/feature-bloom-scene";

export type AdvancedHeroScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse?: { x: number; y: number }) => void;
};

const HERO_SCALE: Record<FeatureId, { cluster: number; bloom: number }> = {
  seeds: { cluster: 1.12, bloom: 0.88 },
  play: { cluster: 1.05, bloom: 0.92 },
  security: { cluster: 1.08, bloom: 0.85 },
  orbit: { cluster: 1.0, bloom: 0.9 },
  api: { cluster: 1.02, bloom: 0.88 },
  hardware: { cluster: 1.05, bloom: 0.86 },
};

/**
 * Hero scroll band — MeshPhysicalMaterial clusters + shader bloom petals.
 * Solid glass/metal geometry in front, layered petals and camo depth behind.
 */
export function buildAdvancedHeroScene(variant: FeatureId, palette: GraphicPalette): AdvancedHeroScene {
  const root = new THREE.Group();
  const scales = HERO_SCALE[variant];

  const cluster = buildAdvancedGraphicCluster(variant, palette);
  cluster.group.scale.setScalar(scales.cluster);
  cluster.group.position.set(0, 0, 0.8);
  root.add(cluster.group);

  const bloom = buildFeatureBloomScene(variant, "hero");
  bloom.root.scale.setScalar(scales.bloom);
  bloom.root.position.set(0, variant === "seeds" ? -0.15 : 0, -3.2);
  root.add(bloom.root);

  const mouse = { x: 0, y: 0 };

  const tick = (t: number, scroll: number, mouseIn?: { x: number; y: number }) => {
    if (mouseIn) {
      mouse.x = mouseIn.x;
      mouse.y = mouseIn.y;
    }
    cluster.tick(t, scroll, mouse);
    bloom.tick(t, scroll, mouse);
    cluster.group.position.x = mouse.x * 0.22;
    cluster.group.position.y = mouse.y * 0.14;
    cluster.group.rotation.y = scroll * 0.35 + mouse.x * 0.12;
    cluster.group.rotation.x = mouse.y * 0.08 - scroll * 0.06;
    bloom.root.rotation.y = scroll * 0.18 - mouse.x * 0.05;
  };

  return { root, tick };
}
