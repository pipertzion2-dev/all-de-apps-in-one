import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";

export type SceneTick = (t: number, scrollOverride?: number) => void;

function scrollNorm(): number {
  return pageScrollProgress();
}

/** Full-page background: mesh-only clusters (no wireframe clutter). */
export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Object3D,
  mouse: { x: number; y: number },
): Promise<SceneTick> {
  const palette = getGraphicPalette(variant);
  const advanced = buildAdvancedGraphicCluster(variant, palette);
  advanced.group.position.z = -1.5;
  advanced.group.scale.setScalar(variant === "seeds" ? 1.55 : 1.25);
  scene.add(advanced.group);

  const satellites = buildAdvancedGraphicCluster(variant, palette);
  satellites.group.position.set(4.5, -2.2, -6);
  satellites.group.scale.setScalar(0.65);
  satellites.group.rotation.y = 0.8;
  scene.add(satellites.group);

  const satellitesB = buildAdvancedGraphicCluster(variant, palette);
  satellitesB.group.position.set(-4.8, 2.4, -7);
  satellitesB.group.scale.setScalar(0.55);
  satellitesB.group.rotation.y = -1.1;
  scene.add(satellitesB.group);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? scrollNorm();
    advanced.tick(t, scroll, mouse);
    satellites.tick(t, scroll * 0.85, mouse);
    satellitesB.tick(t, scroll * 0.7, mouse);

    advanced.group.rotation.y = scroll * Math.PI * 0.65 + t * 0.08 + mouse.x * 0.15;
    advanced.group.rotation.x = -0.1 + scroll * 0.22 + mouse.y * 0.08;
    advanced.group.position.y = scroll * 0.8;

    satellites.group.rotation.y = 0.8 + t * 0.12 + scroll * 0.4;
    satellitesB.group.rotation.y = -1.1 - t * 0.1 - scroll * 0.35;
  });
}
