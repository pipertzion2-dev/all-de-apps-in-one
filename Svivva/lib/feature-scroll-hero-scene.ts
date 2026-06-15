import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import {
  animateSeedBranches,
  buildGraphicElement,
  createSeedBranchField,
  type SeedBranch,
} from "@/lib/feature-graphic-builders";
import { buildImmersiveScrollScene } from "@/lib/feature-immersive-scroll";

export type ScrollHeroScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Graphic-faithful hero cluster for scroll bands — manifest motifs + signature geometry. */
export function buildGraphicScrollHeroScene(
  variant: FeatureId,
  palette: GraphicPalette,
): ScrollHeroScene {
  const root = new THREE.Group();
  const manifest = ARTWORK_MANIFESTS[variant];
  const motifs: THREE.Group[] = [];

  for (const el of manifest.sceneElements) {
    const group = buildGraphicElement(variant, el.id, palette);
    if (!group) continue;
    group.position.set(el.x * 0.55, el.y * 0.55, el.z * 0.35);
    group.userData.base = { x: group.position.x, y: group.position.y, z: group.position.z };
    group.userData.parallax = el.parallax ?? 1;
    group.userData.phase = el.phase ?? 0;
    group.userData.rotZ = el.rotZ ?? 0;
    group.userData.baseScale = el.scale * 0.42;
    group.scale.setScalar(group.userData.baseScale as number);
    root.add(group);
    motifs.push(group);
  }

  const immersive = buildImmersiveScrollScene(variant, palette);
  immersive.hero.scale.setScalar(variant === "seeds" ? 1.45 : 1.2);
  immersive.hero.position.set(0, -0.15, 1.5);
  root.add(immersive.hero);

  let seedBranches: SeedBranch[] | undefined;
  if (variant === "seeds") {
    seedBranches = createSeedBranchField(palette);
    seedBranches.forEach((br) => {
      br.line.scale.setScalar(0.55);
      root.add(br.line);
    });
  }

  const tick = (t: number, scroll: number, mouse: { x: number; y: number }) => {
    immersive.tick(t, scroll);

    motifs.forEach((g) => {
      const base = g.userData.base as { x: number; y: number; z: number };
      const parallax = g.userData.parallax as number;
      const phase = g.userData.phase as number;
      const rotZ = g.userData.rotZ as number;
      const baseScale = g.userData.baseScale as number;
      const sway = Math.sin(t * 0.55 + phase) * 0.12;
      g.position.x = base.x + mouse.x * parallax * 0.35 + sway;
      g.position.y = base.y + mouse.y * parallax * 0.28 + Math.cos(t * 0.45 + phase) * 0.1;
      g.position.z = base.z - scroll * parallax * 1.8;
      g.rotation.y = scroll * Math.PI * 0.55 + t * 0.12 + phase * 0.2;
      g.rotation.z = rotZ + Math.sin(t * 0.35 + phase) * 0.08;
      g.scale.setScalar(baseScale * (1 + scroll * 0.08));
    });

    if (seedBranches) animateSeedBranches(seedBranches, t, scroll);
  };

  return { root, tick };
}
