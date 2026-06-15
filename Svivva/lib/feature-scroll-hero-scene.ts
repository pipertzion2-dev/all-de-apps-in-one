import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";
import { buildImmersiveScrollScene } from "@/lib/feature-immersive-scroll";

export type ScrollHeroScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Graphic-faithful hero: advanced mesh cluster + scroll corridor. */
export function buildGraphicScrollHeroScene(
  variant: FeatureId,
  palette: GraphicPalette,
): ScrollHeroScene {
  const root = new THREE.Group();
  const advanced = buildAdvancedGraphicCluster(variant, palette);
  advanced.group.scale.setScalar(variant === "seeds" ? 1.15 : 1.0);
  root.add(advanced.group);

  const immersive = buildImmersiveScrollScene(variant, palette);
  immersive.root.position.z = -8;
  immersive.root.scale.setScalar(0.7);
  root.add(immersive.root);

  const manifest = ARTWORK_MANIFESTS[variant];
  const accentPositions = manifest.sceneElements.slice(0, 3).map((el) => ({
    x: el.x * 0.45,
    y: el.y * 0.45,
    z: el.z * 0.3,
    phase: el.phase ?? 0,
  }));

  const tick = (t: number, scroll: number, mouse: { x: number; y: number }) => {
    immersive.tick(t, scroll);
    advanced.tick(t, scroll, mouse);

    advanced.group.position.x = mouse.x * 0.45 + Math.sin(t * 0.25 + scroll * 2) * 0.2;
    advanced.group.position.y = mouse.y * 0.3 + scroll * 0.35;
    advanced.group.rotation.y = scroll * Math.PI * 0.75 + t * 0.06;
    advanced.group.rotation.x = -0.12 + scroll * 0.25 + mouse.y * 0.08;

    accentPositions.forEach((pos, i) => {
      const child = advanced.group.children[i];
      if (!child) return;
      child.position.x += Math.sin(t * 0.5 + pos.phase) * 0.002;
    });
  };

  return { root, tick };
}
