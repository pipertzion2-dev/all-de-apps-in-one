import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import {
  addSignatureBackdrop,
  animateSeedBranches,
  buildGraphicElement,
  floatGeo,
  type SeedBranch,
} from "@/lib/feature-graphic-builders";
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

function tickSignature(variant: FeatureId, scene: THREE.Object3D, t: number, scroll: number) {
  const palette = getGraphicPalette(variant);
  const op = palette.lineOpacity;

  switch (variant) {
    case "play": {
      const lines = scene.userData.waveLines as THREE.Line[] | undefined;
      lines?.forEach((line, i) => {
        const pos = line.geometry.attributes.position as THREE.BufferAttribute;
        for (let s = 0; s < pos.count; s++) {
          const x = (s / (pos.count - 1) - 0.5) * 28;
          pos.setX(s, x);
          pos.setY(
            s,
            Math.sin(x * 0.45 + t * 2.2 + i * 0.2 + scroll * 8) * (0.4 + scroll * 0.9),
          );
        }
        pos.needsUpdate = true;
      });
      break;
    }
    case "seeds": {
      const branches = scene.userData.seedBranches as SeedBranch[] | undefined;
      if (branches) animateSeedBranches(branches, t, scroll);
      const staff = scene.userData.staff as THREE.Group | undefined;
      if (staff) staff.scale.x = 0.5 + scroll * 0.7 + Math.sin(t * 0.4) * 0.04;
      break;
    }
    case "security": {
      const rings = scene.userData.securityRings as THREE.LineLoop[] | undefined;
      rings?.forEach((ring, r) => {
        const dir = r % 2 === 0 ? 1 : -1;
        ring.rotation.z = dir * (t * 0.08 + scroll * Math.PI * 0.4);
        (ring.material as THREE.LineBasicMaterial).opacity =
          (palette.lineOpacity * (0.5 - r * 0.1)) * (0.65 + scroll * 0.35);
      });
      break;
    }
    case "api": {
      const sweep = scene.userData.packSweep as THREE.LineSegments | undefined;
      if (sweep) sweep.position.y = -4 + scroll * 8 + Math.sin(t * 0.6) * 0.4;
      break;
    }
    case "orbit": {
      const web = scene.userData.orbitWeb as THREE.LineSegments | undefined;
      const nodes = web?.userData.orbitNodes as number[][] | undefined;
      if (web && nodes) {
        const thresh = 10 - scroll * 3;
        const positions: number[] = [];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i][0] - nodes[j][0];
            const dy = nodes[i][1] - nodes[j][1];
            if (Math.sqrt(dx * dx + dy * dy) < thresh) {
              positions.push(...nodes[i], ...nodes[j]);
            }
          }
        }
        web.geometry.dispose();
        web.geometry = floatGeo(positions);
        (web.material as THREE.LineBasicMaterial).opacity = op * 0.45 + scroll * 0.2 + Math.sin(t * 1.5) * 0.05;
      }
      break;
    }
  }
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

  const immersive: ImmersiveScrollScene = buildImmersiveScrollScene(variant, palette);
  immersive.root.position.z = -6;
  scene.add(immersive.root);

  return Promise.resolve((t: number, scrollOverride?: number) => {
    const scroll = scrollOverride ?? scrollNorm();
    immersive.tick(t, scroll);
    tickMotifs(motifs, mouse, t, scroll);
    tickSignature(variant, scene, t, scroll);
    tickElementInternals(motifs, variant, t, scroll);
  });
}
