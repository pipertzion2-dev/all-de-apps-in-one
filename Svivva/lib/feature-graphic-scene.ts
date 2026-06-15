import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import {
  addSignatureBackdrop,
  animateSeedBranches,
  buildGraphicElement,
  buildStaffLines,
  floatGeo,
  type SeedBranch,
} from "@/lib/feature-graphic-builders";
import { buildImmersiveScrollScene } from "@/lib/feature-immersive-scroll";

export type GraphicSceneMode = "hero" | "page";

export type CubeGraphicScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse?: { x: number; y: number }) => void;
};

type PlacedMotif = {
  object: THREE.Group;
  ox: number;
  oy: number;
  oz: number;
  parallax: number;
  phase: number;
  rotZ: number;
  bob: number;
};

/** Face-faithful 2×2 / poster layouts mirroring the homepage cube crops. */
const FACE_LAYOUT: Partial<Record<FeatureId, Record<string, THREE.Vector3>>> = {
  seeds: {
    "quad-tl": new THREE.Vector3(-2.55, 1.85, 0.15),
    "quad-tr": new THREE.Vector3(2.55, 1.85, 0.1),
    "quad-bl": new THREE.Vector3(-2.55, -1.85, 0.12),
    "quad-br": new THREE.Vector3(2.55, -1.85, 0.18),
  },
  api: {
    "flower-2": new THREE.Vector3(-3.2, 2.1, -0.2),
    "flower-1": new THREE.Vector3(3.0, -1.6, -0.35),
    paper: new THREE.Vector3(-1.2, -2.4, 0.1),
    fold: new THREE.Vector3(1.5, 0.5, 0.2),
  },
  hardware: {
    "red-cube": new THREE.Vector3(-3.0, 1.5, -0.1),
    "green-cube": new THREE.Vector3(3.2, 2.0, 0.05),
    "hand-cube": new THREE.Vector3(2.8, -1.4, -0.25),
    figures: new THREE.Vector3(-2.5, -1.8, 0.15),
    swim: new THREE.Vector3(0, -2.6, 0.2),
  },
};

function tickMotifs(motifs: PlacedMotif[], mouse: { x: number; y: number }, t: number, scroll: number) {
  motifs.forEach((m) => {
    const sway = Math.sin(t * 0.55 + m.phase) * m.bob;
    m.object.position.x = m.ox + mouse.x * m.parallax * 0.35 + sway * 0.15;
    m.object.position.y = m.oy + mouse.y * m.parallax * 0.28 + Math.cos(t * 0.45 + m.phase) * m.bob * 0.5;
    m.object.position.z = m.oz + scroll * m.parallax * 0.45;
    m.object.rotation.y = scroll * 0.18 + Math.sin(t * 0.25 + m.phase) * 0.04;
    m.object.rotation.z = m.rotZ;
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
          pos.setY(s, Math.sin(x * 0.45 + t * 1.8 + i * 0.15 + scroll * 4) * (0.35 + scroll * 0.5));
        }
        pos.needsUpdate = true;
      });
      break;
    }
    case "seeds": {
      const branches = scene.userData.seedBranches as SeedBranch[] | undefined;
      if (branches) animateSeedBranches(branches, t, scroll);
      const staff = scene.userData.staff as THREE.Group | undefined;
      if (staff) staff.position.y = 2.8 - scroll * 0.4;
      break;
    }
    case "security": {
      const rings = scene.userData.securityRings as THREE.LineLoop[] | undefined;
      rings?.forEach((ring, r) => {
        ring.rotation.z = (r % 2 === 0 ? 1 : -1) * (t * 0.06 + scroll * 0.25);
        (ring.material as THREE.LineBasicMaterial).opacity = op * (0.55 - r * 0.08) * (0.75 + scroll * 0.2);
      });
      break;
    }
    case "api": {
      const sweep = scene.userData.packSweep as THREE.LineSegments | undefined;
      if (sweep) sweep.position.y = -3 + scroll * 5;
      break;
    }
    case "orbit": {
      const web = scene.userData.orbitWeb as THREE.LineSegments | undefined;
      const nodes = web?.userData.orbitNodes as number[][] | undefined;
      if (web && nodes) {
        const thresh = 9 - scroll * 2.5;
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
      }
      break;
    }
  }
}

function tickElementInternals(motifs: PlacedMotif[], variant: FeatureId, scroll: number, t: number) {
  if (variant === "api") {
    motifs.forEach((m) => {
      m.object.children.forEach((child) => {
        if (child instanceof THREE.Group && child.userData.isLid) {
          child.rotation.x = -scroll * 0.55 - 0.2;
        }
      });
    });
  }
  if (variant === "hardware") {
    motifs.forEach((m) => {
      if (m.object.children[0] instanceof THREE.Mesh) {
        m.object.rotation.x = t * 0.15 + scroll * 0.6;
        m.object.rotation.y = t * 0.12;
      }
    });
  }
}

/**
 * Single cohesive scene built from the same artwork-atlas + graphic builders as the homepage cube.
 */
export function buildCubeGraphicScene(
  variant: FeatureId,
  mode: GraphicSceneMode = "page",
): CubeGraphicScene {
  const manifest = ARTWORK_MANIFESTS[variant];
  const palette = getGraphicPalette(variant);
  const root = new THREE.Group();
  const motifs: PlacedMotif[] = [];
  const faceLayout = FACE_LAYOUT[variant];
  const spread = mode === "hero" ? 0.62 : 1;
  const scaleMul = mode === "hero" ? 0.42 : 0.34;

  for (const el of manifest.sceneElements) {
    const group = buildGraphicElement(variant, el.id, palette);
    if (!group) continue;

    const facePos = faceLayout?.[el.id];
    const scale = el.scale * scaleMul;
    group.scale.setScalar(scale);

    const ox = facePos ? facePos.x * spread : el.x * spread;
    const oy = facePos ? facePos.y * spread : el.y * spread;
    const oz = facePos ? facePos.z : el.z * spread;
    group.position.set(ox, oy, oz);
    root.add(group);

    motifs.push({
      object: group,
      ox,
      oy,
      oz,
      parallax: (el.parallax ?? 0.7) * 0.4,
      phase: el.phase ?? 0,
      rotZ: el.rotZ ?? 0,
      bob: 0.03,
    });
  }

  if (variant === "seeds") {
    const staff = buildStaffLines(palette.primary, mode === "hero" ? 10 : 16);
    staff.position.set(0, mode === "hero" ? 2.8 : 4.5, 0.25);
    staff.scale.setScalar(mode === "hero" ? 0.55 : 0.45);
    root.add(staff);
    root.userData.staff = staff;
  }

  addSignatureBackdrop(variant, root, palette);

  const { hero } = buildImmersiveScrollScene(variant, palette);
  hero.scale.setScalar(mode === "hero" ? 0.52 : 0.68);
  hero.position.set(0, variant === "seeds" ? -0.35 : 0, mode === "hero" ? -1.4 : -2);
  root.add(hero);

  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(mode === "hero" ? 7.2 : 14, mode === "hero" ? 5.4 : 10)),
    new THREE.LineBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: mode === "hero" ? 0.22 : 0.12,
      depthWrite: false,
    }),
  );
  frame.position.z = -0.8;
  root.add(frame);

  const mouse = { x: 0, y: 0 };

  const tick = (t: number, scroll: number, mouseIn?: { x: number; y: number }) => {
    if (mouseIn) {
      mouse.x = mouseIn.x;
      mouse.y = mouseIn.y;
    }
    hero.rotation.y = scroll * 0.22 + t * 0.04;
    hero.rotation.x = scroll * 0.08 + Math.sin(t * 0.2) * 0.03;
    tickMotifs(motifs, mouse, t, scroll);
    tickSignature(variant, root, t, scroll);
    tickElementInternals(motifs, variant, scroll, t);
    root.rotation.y = scroll * 0.35 + mouse.x * 0.08;
    root.rotation.x = -0.04 + scroll * 0.1 + mouse.y * 0.04;
  };

  return { root, tick };
}
