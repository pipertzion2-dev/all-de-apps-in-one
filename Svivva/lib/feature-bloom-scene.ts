import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import {
  createAccentPhysical,
  createBloomLayerMaterial,
  createCamoTileTexture,
  paletteColors,
  type BloomLayerMaterial,
} from "@/lib/feature-bloom-material";

export type FeatureBloomScene = {
  root: THREE.Group;
  tick: (t: number, scroll: number, mouse?: { x: number; y: number }) => void;
};

type PetalShape = "pointed" | "rounded" | "curved" | "layered" | "star" | "teardrop" | "panel" | "crystal";
type BloomPart = { mesh: THREE.Mesh; material: BloomLayerMaterial; phase: number; baseBloom: number };

function petalGeometry(shape: PetalShape, w: number, l: number, layer = 0): THREE.BufferGeometry {
  switch (shape) {
    case "pointed":
      return new THREE.ConeGeometry(w * 0.6, l, 5, 1);
    case "rounded": {
      const g = new THREE.SphereGeometry(w * 0.8, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.62);
      g.scale(1, 0.32, l / (w * 0.8));
      return g;
    }
    case "curved":
      return new THREE.BoxGeometry(w * 0.75, 0.06, l * 1.15);
    case "layered": {
      const g = new THREE.CircleGeometry(w * (1 - layer * 0.18), 7);
      g.rotateX(-Math.PI / 2.4);
      return g;
    }
    case "star":
      return new THREE.ConeGeometry(w * 0.42, l * 0.95, 3, 1);
    case "teardrop": {
      const g = new THREE.SphereGeometry(w * 0.52, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.72);
      g.scale(1.15, 0.28, l / (w * 0.52));
      return g;
    }
    case "panel":
      return new THREE.BoxGeometry(w * 1.6, 0.12, l * 0.35);
    case "crystal":
      return new THREE.OctahedronGeometry(w * 0.55, 0);
    default:
      return new THREE.BoxGeometry(w, 0.06, l);
  }
}

function addBloomCluster(
  parent: THREE.Group,
  position: THREE.Vector3,
  palette: ReturnType<typeof getGraphicPalette>,
  config: {
    petalCount: number;
    shape: PetalShape;
    scale: number;
    openAngle: number;
    petalWidth: number;
    petalLength: number;
    layers?: number;
  },
  parts: BloomPart[],
) {
  const group = new THREE.Group();
  group.position.copy(position);
  const colors = paletteColors(palette);
  const layers = config.layers ?? 1;
  for (let layer = 0; layer < layers; layer++) {
    const layerScale = 1 - layer * 0.14;
    for (let p = 0; p < config.petalCount; p++) {
      const angle = (p / config.petalCount) * Math.PI * 2 + layer * 0.4;
      const w = config.petalWidth * config.scale * layerScale;
      const l = config.petalLength * config.scale * layerScale;
      const mat = createBloomLayerMaterial(colors, 0.12 + layer * 0.03);
      const mesh = new THREE.Mesh(petalGeometry(config.shape, w, l, layer), mat);
      const radius = 0.18 * config.scale * layerScale;
      mesh.position.set(Math.cos(angle) * radius, 0.22 * config.scale + layer * 0.07, Math.sin(angle) * radius);
      mesh.rotation.y = angle;
      mesh.rotation.z = config.openAngle + layer * 0.12;
      if (config.shape === "pointed" || config.shape === "star") mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
      parts.push({ mesh, material: mat, phase: p + layer * 10, baseBloom: 0.15 + layer * 0.08 });
    }
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.12 * config.scale, 8, 6), createAccentPhysical(palette.highlight, 0.88));
  core.position.y = 0.28 * config.scale;
  group.add(core);
  parent.add(group);
}

function addCamoVeil(parent: THREE.Group, palette: ReturnType<typeof getGraphicPalette>, count: number, spread: number) {
  const tex = createCamoTileTexture(17, palette);
  for (let i = 0; i < count; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8 + (i % 3) * 0.6, 1.8 + (i % 2) * 0.5),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.24, depthWrite: false }),
    );
    plane.position.set(Math.sin(i * 1.7) * 0.5 * spread, Math.cos(i * 2.1) * 0.35 * spread, -6 - i * 1.4);
    plane.rotation.set(Math.sin(i) * 0.2, Math.cos(i * 0.8) * 0.35, 0);
    plane.userData.camoIndex = i;
    parent.add(plane);
  }
}

function addMotes(parent: THREE.Group, palette: ReturnType<typeof getGraphicPalette>, count: number) {
  const cols = [palette.primary, palette.tertiary, palette.highlight, palette.wire];
  for (let i = 0; i < count; i++) {
    const mote = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 + (i % 3) * 0.02, 6, 5),
      new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true, opacity: 0.55 }),
    );
    mote.position.set(Math.sin(i * 2.3) * 5.5, Math.cos(i * 1.9) * 3.2, -3 - (i % 8) * 0.9);
    mote.userData.motePhase = i;
    parent.add(mote);
  }
}

function buildVariant(root: THREE.Group, variant: FeatureId, parts: BloomPart[]) {
  const palette = getGraphicPalette(variant);
  addCamoVeil(root, palette, 5, 7);
  addMotes(root, palette, 28);

  if (variant === "play") {
    for (let i = 0; i < 9; i++) {
      addBloomCluster(root, new THREE.Vector3((i - 4) * 1.35, Math.sin(i * 0.9) * 0.5, -4 - i * 0.55), palette, {
        petalCount: 6, shape: "curved", scale: 0.9, openAngle: 0.35, petalWidth: 0.22, petalLength: 0.75,
      }, parts);
    }
  } else if (variant === "seeds") {
    for (let b = 0; b < 12; b++) {
      const ang = (b / 12) * Math.PI * 2;
      const g = new THREE.Group();
      addBloomCluster(g, new THREE.Vector3(0, 0, 0), palette, {
        petalCount: b % 2 === 0 ? 5 : 7, shape: b % 3 === 0 ? "teardrop" : "rounded", scale: 0.75, openAngle: 0.42, petalWidth: 0.28, petalLength: 0.65, layers: 2,
      }, parts);
      g.position.set(Math.cos(ang) * 2.2, Math.sin(ang) * 1.6 - 0.5, -5 - b * 0.35);
      g.rotation.z = ang + Math.PI / 2;
      root.add(g);
    }
  } else if (variant === "orbit") {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      addBloomCluster(root, new THREE.Vector3(Math.cos(a) * 2.5, Math.sin(a) * 1.2, -5.5 - (i % 4) * 0.6), palette, {
        petalCount: 8, shape: "star", scale: 0.65, openAngle: 0.28, petalWidth: 0.16, petalLength: 0.5,
      }, parts);
    }
    [2.8, 3.8, 4.6].forEach((r, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 48), createAccentPhysical(i % 2 ? palette.tertiary : palette.secondary, 0.62));
      ring.position.z = -6;
      ring.rotation.x = Math.PI / 2.2;
      ring.userData.ringIndex = i;
      root.add(ring);
    });
  } else if (variant === "security") {
    for (let i = 0; i < 3; i++) {
      addBloomCluster(root, new THREE.Vector3(0, 0, -5 - i * 1.2), palette, {
        petalCount: 12, shape: "layered", scale: 1.05 - i * 0.12, openAngle: 0.32, petalWidth: 0.3, petalLength: 0.42, layers: 3,
      }, parts);
    }
    for (let i = 0; i < 14; i++) {
      const barb = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 16), createAccentPhysical(palette.highlight, 0.78));
      barb.position.set((i - 7) * 0.85, Math.sin(i * 0.8) * 0.4, -9 - i * 0.45);
      barb.rotation.set(Math.PI / 2, i * 0.4, 0);
      barb.userData.barbIndex = i;
      root.add(barb);
    }
  } else if (variant === "api") {
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Group();
      c.position.set((i - 2) * 1.1, 0, -4 - i * 1.1);
      c.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.14), createAccentPhysical(i % 2 ? palette.primary : palette.secondary, 0.65)));
      const lidMat = createBloomLayerMaterial(paletteColors(palette), 0.11);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.1), lidMat);
      lid.position.set(0, 0.85, 0.02);
      lid.userData.isLid = true;
      c.add(lid);
      parts.push({ mesh: lid, material: lidMat, phase: i, baseBloom: 0.25 });
      addBloomCluster(c, new THREE.Vector3(0, 0.15, 0.12), palette, { petalCount: 5, shape: "panel", scale: 0.55, openAngle: 0.2, petalWidth: 0.35, petalLength: 0.4 }, parts);
      root.add(c);
    }
  } else {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const mat = createBloomLayerMaterial(paletteColors(palette), 0.13);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mat);
        gem.position.set((col - 2) * 1.25, (row - 1.5) * 0.95, -5 - row * 0.85);
        gem.userData.gemPhase = row + col;
        root.add(gem);
        parts.push({ mesh: gem, material: mat, phase: row + col, baseBloom: 0.18 });
      }
    }
    addBloomCluster(root, new THREE.Vector3(0, 0.5, -3), palette, {
      petalCount: 10, shape: "crystal", scale: 1.2, openAngle: 0.45, petalWidth: 0.38, petalLength: 0.55, layers: 2,
    }, parts);
  }
}

export function buildFeatureBloomScene(variant: FeatureId, mode: "hero" | "page" = "page"): FeatureBloomScene {
  const root = new THREE.Group();
  const parts: BloomPart[] = [];
  buildVariant(root, variant, parts);
  root.scale.setScalar(mode === "hero" ? 0.92 : variant === "seeds" ? 1.12 : 1.05);

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    parts.forEach(({ material, phase, baseBloom }) => {
      material.userData.bloomUniform.value = Math.min(1, baseBloom + scroll * 0.65 + Math.sin(t * 0.35 + phase) * 0.22);
      material.userData.timeUniform.value = t;
    });
    root.rotation.y = scroll * 0.28 + (mouse?.x ?? 0) * 0.08 + Math.sin(t * 0.1) * 0.03;
    root.rotation.x = -0.04 + scroll * 0.1 + (mouse?.y ?? 0) * 0.04;
    root.children.forEach((ch) => {
      if (ch instanceof THREE.Mesh && ch.userData.barbIndex !== undefined) {
        ch.position.z = -9 - ch.userData.barbIndex * 0.45 + ((t * 0.5 + scroll * 3) % 6);
        ch.rotation.y = t * 0.3;
      }
      if (ch instanceof THREE.Mesh && ch.userData.gemPhase !== undefined) {
        ch.rotation.x = t * 0.22 + scroll * 0.5;
        ch.rotation.y = t * 0.16;
      }
      if (ch instanceof THREE.Mesh && ch.userData.ringIndex !== undefined) {
        ch.rotation.z = t * (0.15 + ch.userData.ringIndex * 0.05) + scroll * 0.8;
      }
    });
  };

  return { root, tick };
}
