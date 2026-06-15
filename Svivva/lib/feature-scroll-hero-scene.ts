import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";

export type ScrollHeroScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Hero scroll band: dominant mesh cluster only. */
export function buildGraphicScrollHeroScene(
  variant: FeatureId,
  palette: GraphicPalette,
): ScrollHeroScene {
  const advanced = buildAdvancedGraphicCluster(variant, palette);
  advanced.group.scale.setScalar(variant === "seeds" ? 1.35 : 1.15);

  const tick = (t: number, scroll: number, mouse: { x: number; y: number }) => {
    advanced.tick(t, scroll, mouse);
    advanced.group.position.x = mouse.x * 0.65 + Math.sin(t * 0.28 + scroll * 2.5) * 0.35;
    advanced.group.position.y = mouse.y * 0.45 + scroll * 0.45;
    advanced.group.rotation.y = scroll * Math.PI * 1.1 + t * 0.1;
    advanced.group.rotation.x = -0.15 + scroll * 0.35 + mouse.y * 0.12;
  };

  return { root: advanced.group, tick };
}
