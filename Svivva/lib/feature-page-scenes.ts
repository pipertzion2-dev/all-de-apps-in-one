import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import {
  addSignatureBackdrop,
  buildGraphicElement,
} from "@/lib/feature-graphic-builders";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";
import { buildImmersiveScrollScene, type ImmersiveScrollScene } from "@/lib/feature-immersive-scroll";

export type SceneTick = (t: number, scrollOverride?: number) => void;

export type PlacedMotif = {
  object: THREE.Group;
  ox: number;
  oy: number;
  oz: number;
  parallax: number;
  phase: number;
  rotZ: number;
  bob: number;
  scale: number;
};

import { pageScrollProgress } from "@/lib/feature-scroll-progress";

function scrollNorm(): number {
  return pageScrollProgress();
}

function tickMotifs(
  motifs: PlacedMotif[],
  mouse: { x: number; y: number },
  t: number,
  scroll: number,
) {
  motifs.forEach((m) => {
    const sway = Math.sin(t * 0.85 + m.phase) * m.bob;
    const scrollLift = scroll * m.parallax * 2;
    m.object.position.x = m.ox + mouse.x * m.parallax * 1.2 + sway * 0.25;
    m.object.position.y = m.oy + mouse.y * m.parallax * 0.9 + Math.cos(t * 0.65 + m.phase) * m.bob - scrollLift;
    m.object.position.z = m.oz + Math.sin(t * 0.45 + m.phase) * 0.15 + scroll * 0.5;
    m.object.rotation.y = Math.sin(t * 0.3 + m.phase) * 0.1 + scroll * 0.25;
    m.object.rotation.z = m.rotZ + Math.sin(t * 0.35 + m.phase) * 0.04;
  });
}

function tickElementInternals(motifs: PlacedMotif[], variant: FeatureId, t: number, scroll: number) {
  if (variant === "api") {
    motifs.forEach((m) => {
      m.object.children.forEach((child) => {
        if (child instanceof THREE.Group && child.userData.isLid) {
          child.rotation.x = -scroll * Math.PI * 0.4 + Math.sin(t * 0.4) * 0.06;
        }
      });
    });
  }
  if (variant === "hardware") {
    motifs.forEach((m) => {
      if (m.object.children[0] instanceof THREE.Mesh) {
        m.object.rotation.x = t * 0.3 + scroll * 1.5;
        m.object.rotation.y = t * 0.4;
      }
    });
  }
  if (variant === "orbit") {
    motifs.forEach((m) => {
      if (m.object.children.length > 3) {
        m.object.rotation.z = t * 0.06;
      }
    });
  }
}

export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Object3D,
  mouse: { x: number; y: number },
): Promise<SceneTick> {
  const manifest = ARTWORK_MANIFESTS[variant];
  const palette = getGraphicPalette(variant);
  const motifs: PlacedMotif[] = [];

  for (const el of manifest.sceneElements) {
    const group = buildGraphicElement(variant, el.id, palette);
    if (!group) continue;

    const scale = el.scale * 0.28;
    group.scale.setScalar(scale);
    group.position.set(el.x, el.y, el.z);
    scene.add(group);

    motifs.push({
      object: group,
      ox: el.x,
      oy: el.y,
      oz: el.z,
      parallax: (el.parallax ?? 0.8) * 0.65,
      phase: el.phase ?? 0,
      rotZ: el.rotZ ?? 0,
      bob: 0.06 + (el.parallax ?? 0.8) * 0.06,
      scale,
    });
  }

  addSignatureBackdrop(variant, scene, palette);

  const advanced = buildAdvancedGraphicCluster(variant, palette);
  advanced.group.position.z = -2;
  advanced.group.scale.setScalar(variant === "seeds" ? 1.25 : 1.05);
  scene.add(advanced.group);

  const immersive: ImmersiveScrollScene = buildImmersiveScrollScene(variant, palette);
  immersive.root.position.z = -8;
  scene.add(immersive.root);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? scrollNorm();
    immersive.tick(t, scroll);
    advanced.tick(t, scroll, mouse);
    tickMotifs(motifs, mouse, t, scroll);
    tickElementInternals(motifs, variant, t, scroll);
    advanced.group.rotation.y = scroll * Math.PI * 0.5 + t * 0.05;
  });
}
