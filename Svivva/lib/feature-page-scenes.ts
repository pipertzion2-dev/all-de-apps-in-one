import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildCubeGraphicScene } from "@/lib/feature-graphic-scene";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";

export type SceneTick = (t: number, scrollOverride?: number) => void;

/** Full-page background — one cube-faithful composition, no random satellites. */
export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Object3D,
  mouse: { x: number; y: number },
): Promise<SceneTick> {
  const graphic = buildCubeGraphicScene(variant, "page");
  graphic.root.position.set(0, 0, -2.5);
  graphic.root.scale.setScalar(variant === "seeds" ? 1.15 : 0.95);
  scene.add(graphic.root);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? pageScrollProgress();
    graphic.tick(t, scroll, mouse);
  });
}
