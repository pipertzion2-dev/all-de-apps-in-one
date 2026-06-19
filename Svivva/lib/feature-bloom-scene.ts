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

type PetalShape =
  | "pointed"
  | "rounded"
  | "curved"
  | "layered"
  | "star"
  | "teardrop"
  | "panel"
  | "crystal";
type BloomPart = {
  mesh: THREE.Mesh;
  material: BloomLayerMaterial;
  phase: number;
  baseBloom: number;
};

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
      mesh.position.set(
        Math.cos(angle) * radius,
        0.22 * config.scale + layer * 0.07,
        Math.sin(angle) * radius,
      );
      mesh.rotation.y = angle;
      mesh.rotation.z = config.openAngle + layer * 0.12;
      if (config.shape === "pointed" || config.shape === "star") mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
      parts.push({ mesh, material: mat, phase: p + layer * 10, baseBloom: 0.15 + layer * 0.08 });
    }
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * config.scale, 8, 6),
    createAccentPhysical(palette.highlight, 0.88),
  );
  core.position.y = 0.28 * config.scale;
  group.add(core);
  parent.add(group);
}

function addCamoVeil(
  parent: THREE.Group,
  palette: ReturnType<typeof getGraphicPalette>,
  count: number,
  spread: number,
) {
  const tex = createCamoTileTexture(17, palette);
  for (let i = 0; i < count; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8 + (i % 3) * 0.6, 1.8 + (i % 2) * 0.5),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    plane.position.set(
      Math.sin(i * 1.7) * 0.5 * spread,
      Math.cos(i * 2.1) * 0.35 * spread,
      -6 - i * 1.4,
    );
    plane.rotation.set(Math.sin(i) * 0.2, Math.cos(i * 0.8) * 0.35, 0);
    plane.userData.camoIndex = i;
    parent.add(plane);
  }
}

function addMotes(
  parent: THREE.Group,
  palette: ReturnType<typeof getGraphicPalette>,
  count: number,
) {
  const cols = [palette.primary, palette.tertiary, palette.highlight, palette.wire];
  for (let i = 0; i < count; i++) {
    const mote = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 + (i % 3) * 0.02, 6, 5),
      new THREE.MeshBasicMaterial({
        color: cols[i % cols.length],
        transparent: true,
        opacity: 0.55,
      }),
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
    // Orchestra seating chart: melodic (curved), rhythmic (pointed), harmonic (star) clusters
    // at varying depths suggesting front-to-back ensemble staging
    const PLAY_CONFIGS: Array<{ shape: PetalShape; count: number; row: number; yOff: number }> = [
      { shape: "curved", count: 5, row: 0, yOff: 0.2 }, // melodic voices
      { shape: "star", count: 4, row: 1, yOff: -0.15 }, // harmonic layers
      { shape: "teardrop", count: 3, row: 2, yOff: 0.35 }, // percussion contour
    ];
    PLAY_CONFIGS.forEach(({ shape, count, row, yOff }) => {
      for (let i = 0; i < count; i++) {
        addBloomCluster(
          root,
          new THREE.Vector3(
            (i - (count - 1) / 2) * (1.4 + row * 0.3),
            Math.sin(i * 0.9 + row) * 0.55 + yOff,
            -4.5 - row * 1.4 - i * 0.22,
          ),
          palette,
          {
            petalCount: shape === "curved" ? 6 : shape === "star" ? 8 : 5,
            shape,
            scale: 0.88 - row * 0.06,
            openAngle: 0.32 + row * 0.04,
            petalWidth: 0.22,
            petalLength: 0.72 - row * 0.06,
            layers: row === 1 ? 2 : 1,
          },
          parts,
        );
      }
    });
    // Grand staff lines behind everything
    for (let s = 0; s < 5; s++) {
      const staffMat = createAccentPhysical(
        s % 2 === 0 ? palette.primary : palette.highlight,
        0.55,
      );
      const staffLine = new THREE.Mesh(new THREE.BoxGeometry(14, 0.03, 0.02), staffMat);
      staffLine.position.set(0, 1.6 - s * 0.55, -8.5);
      root.add(staffLine);
    }
  } else if (variant === "seeds") {
    // Living blueprint: inner ring of organic growths + outer ring of architectural panels
    for (let b = 0; b < 8; b++) {
      const ang = (b / 8) * Math.PI * 2;
      const g = new THREE.Group();
      addBloomCluster(
        g,
        new THREE.Vector3(0, 0, 0),
        palette,
        {
          petalCount: b % 2 === 0 ? 7 : 5,
          shape: b % 4 === 0 ? "teardrop" : b % 4 === 2 ? "crystal" : "rounded",
          scale: 0.78,
          openAngle: 0.44,
          petalWidth: 0.28,
          petalLength: 0.68,
          layers: 2,
        },
        parts,
      );
      g.position.set(Math.cos(ang) * 2.0, Math.sin(ang) * 1.45 - 0.3, -5 - b * 0.3);
      g.rotation.z = ang + Math.PI / 2;
      root.add(g);
    }
    // Outer architectural panel ring (farther, larger)
    for (let b = 0; b < 6; b++) {
      const ang = (b / 6) * Math.PI * 2 + Math.PI / 6;
      const g2 = new THREE.Group();
      addBloomCluster(
        g2,
        new THREE.Vector3(0, 0, 0),
        palette,
        {
          petalCount: 4,
          shape: "panel",
          scale: 0.62,
          openAngle: 0.22,
          petalWidth: 0.42,
          petalLength: 0.52,
        },
        parts,
      );
      g2.position.set(Math.cos(ang) * 3.8, Math.sin(ang) * 2.4 - 0.4, -7.5 - b * 0.4);
      g2.rotation.z = ang;
      root.add(g2);
    }
    // Rising vertical rods (architecture columns growing upward)
    for (let r = 0; r < 5; r++) {
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.5 + r * 0.5, 8),
        createAccentPhysical(r % 2 === 0 ? palette.wire : palette.primary, 0.58),
      );
      rod.position.set(-2 + r * 1.0, -0.5, -7.2 - r * 0.3);
      rod.userData.rodIndex = r;
      root.add(rod);
    }
  } else if (variant === "orbit") {
    // Planetary orbit system: 3 rings at different inclinations + signal node clusters
    const ORBIT_RINGS = [
      { r: 2.5, incline: Math.PI / 2.2, speed: 0.12 },
      { r: 3.6, incline: Math.PI / 3.5, speed: 0.08 },
      { r: 4.8, incline: Math.PI / 2.8, speed: 0.055 },
    ];
    ORBIT_RINGS.forEach(({ r, incline }, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.035 + i * 0.01, 10, 56),
        createAccentPhysical(
          i === 0 ? palette.tertiary : i === 1 ? palette.secondary : palette.primary,
          0.58,
        ),
      );
      ring.position.z = -6 - i * 0.5;
      ring.rotation.x = incline;
      ring.userData.ringIndex = i;
      root.add(ring);
    });
    // Satellite node clusters orbiting the rings — panel shapes (like radar screens)
    for (let i = 0; i < 12; i++) {
      const tier = i % 3;
      const a = (i / 4) * Math.PI * 2 + tier * (Math.PI / 6);
      const r = ORBIT_RINGS[tier]!.r;
      addBloomCluster(
        root,
        new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.42, -6 - tier * 0.5),
        palette,
        {
          petalCount: i % 3 === 0 ? 8 : 5,
          shape: i % 3 === 0 ? "star" : i % 3 === 1 ? "panel" : "rounded",
          scale: 0.52 + tier * 0.04,
          openAngle: 0.25,
          petalWidth: 0.16,
          petalLength: 0.44,
        },
        parts,
      );
    }
    // Growth trajectory guide lines (faint arcs in background)
    for (let g = 0; g < 3; g++) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(1.2 + g * 0.8, 0.012, 6, 24, Math.PI * 0.65),
        createAccentPhysical(palette.highlight, 0.38),
      );
      arc.position.set(-0.5, -1.0 + g * 0.5, -8 - g * 0.4);
      arc.rotation.z = Math.PI / 4 + g * 0.2;
      root.add(arc);
    }
  } else if (variant === "security") {
    // Ornate seal: concentric layered blooms + crystal lattice cage + cipher rings
    for (let i = 0; i < 4; i++) {
      addBloomCluster(
        root,
        new THREE.Vector3(Math.sin(i * 0.6) * 0.4, Math.cos(i * 0.8) * 0.3, -5 - i * 1.0),
        palette,
        {
          petalCount: i % 2 === 0 ? 12 : 8,
          shape: i % 2 === 0 ? "layered" : "crystal",
          scale: 1.08 - i * 0.1,
          openAngle: 0.3 + i * 0.02,
          petalWidth: 0.28 + i * 0.02,
          petalLength: 0.42,
          layers: 3,
        },
        parts,
      );
    }
    // Cipher rings (hexagonal locking rings at various tilts)
    [
      [3.2, Math.PI / 2, 0],
      [4.2, Math.PI / 2.6, 0.4],
      [2.1, Math.PI / 1.8, -0.3],
    ].forEach(([r, rx, rz], i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r as number, 0.038, 6, 36),
        createAccentPhysical(i % 2 === 0 ? palette.secondary : palette.highlight, 0.72),
      );
      ring.position.z = -7.5 - i * 0.6;
      ring.rotation.x = rx as number;
      ring.rotation.z = rz as number;
      ring.userData.barbIndex = i + 20; // reuse barb animation
      root.add(ring);
    });
    // Crystal spike field in background
    for (let i = 0; i < 18; i++) {
      const mat = createBloomLayerMaterial(paletteColors(palette), 0.14);
      const spike = new THREE.Mesh(new THREE.OctahedronGeometry(0.18 + (i % 3) * 0.06, 0), mat);
      spike.position.set(
        ((i % 6) - 2.5) * 1.1,
        Math.sin(i * 0.9) * 0.7,
        -9 - Math.floor(i / 6) * 0.8,
      );
      spike.scale.y = 1.6 + (i % 3) * 0.4;
      spike.userData.gemPhase = i;
      root.add(spike);
      parts.push({ mesh: spike, material: mat, phase: i, baseBloom: 0.16 });
    }
  } else if (variant === "api") {
    // API manifest: structured grid of endpoint panels + connector manifold
    const GRID_ROWS = 3;
    const GRID_COLS = 4;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const panelGroup = new THREE.Group();
        const mat = createBloomLayerMaterial(paletteColors(palette), 0.12);
        const card = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.85, 0.08), mat);
        panelGroup.add(card);
        parts.push({ mesh: card, material: mat, phase: row * GRID_COLS + col, baseBloom: 0.2 });

        // Method gem on card
        const gemMat = createBloomLayerMaterial(paletteColors(palette), 0.18);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), gemMat);
        gem.position.set(-0.5, 0.22, 0.08);
        gem.userData.gemPhase = row + col;
        panelGroup.add(gem);
        parts.push({ mesh: gem, material: gemMat, phase: row + col + 8, baseBloom: 0.22 });

        panelGroup.position.set(
          (col - 1.5) * 1.85,
          (row - 1) * 1.15,
          -5.5 - row * 0.9 - col * 0.22,
        );
        root.add(panelGroup);
      }
    }
    // Horizontal manifold connector between columns
    for (let row = 0; row < GRID_ROWS; row++) {
      const manifold = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.025, 0.025),
        createAccentPhysical(palette.wire, 0.55),
      );
      manifold.position.set(0, (row - 1) * 1.15, -5.5 - row * 0.9);
      root.add(manifold);
    }
    // Bloom clusters erupting between rows (routing hubs)
    for (let i = 0; i < 4; i++) {
      addBloomCluster(
        root,
        new THREE.Vector3((i - 1.5) * 1.85, 0, -7.2 - i * 0.4),
        palette,
        {
          petalCount: 5,
          shape: "panel",
          scale: 0.48,
          openAngle: 0.18,
          petalWidth: 0.38,
          petalLength: 0.38,
        },
        parts,
      );
    }
  } else {
    // hardware — PCB component landscape: IC grid, bloom solder joints, trace lines
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const idx = row * 5 + col;
        const shape: PetalShape =
          idx % 5 === 0
            ? "crystal"
            : idx % 5 === 2
              ? "panel"
              : idx % 3 === 0
                ? "rounded"
                : "teardrop";
        const mat = createBloomLayerMaterial(paletteColors(palette), 0.13);
        const comp = new THREE.Mesh(
          shape === "crystal"
            ? new THREE.OctahedronGeometry(0.28, 0)
            : shape === "panel"
              ? new THREE.BoxGeometry(0.75, 0.44, 0.1)
              : new THREE.SphereGeometry(0.2, 10, 8),
          mat,
        );
        comp.position.set((col - 2) * 1.32, (row - 1) * 1.05, -5 - row * 0.9);
        comp.userData.gemPhase = idx;
        root.add(comp);
        parts.push({ mesh: comp, material: mat, phase: idx, baseBloom: 0.18 });

        // Bloom cluster at each component site
        addBloomCluster(
          root,
          new THREE.Vector3((col - 2) * 1.32, (row - 1) * 1.05, -5 - row * 0.9 + 0.4),
          palette,
          {
            petalCount: shape === "crystal" ? 8 : 5,
            shape: shape === "crystal" ? "star" : "rounded",
            scale: 0.35,
            openAngle: 0.28,
            petalWidth: 0.14,
            petalLength: 0.32,
          },
          parts,
        );
      }
    }
    // PCB trace lines connecting components
    for (let t = 0; t < 4; t++) {
      const trace = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 0.022, 0.022),
        createAccentPhysical(t % 2 === 0 ? palette.secondary : palette.wire, 0.52),
      );
      trace.position.set(0, -1 + t * 0.65, -6.2 - t * 0.3);
      root.add(trace);
    }
    // Hybridizer crystal at center
    addBloomCluster(
      root,
      new THREE.Vector3(0, 0.2, -3.5),
      palette,
      {
        petalCount: 10,
        shape: "crystal",
        scale: 1.1,
        openAngle: 0.42,
        petalWidth: 0.35,
        petalLength: 0.52,
        layers: 2,
      },
      parts,
    );
  }
}

export function buildFeatureBloomScene(
  variant: FeatureId,
  mode: "hero" | "page" = "page",
): FeatureBloomScene {
  const root = new THREE.Group();
  const parts: BloomPart[] = [];
  buildVariant(root, variant, parts);
  root.scale.setScalar(mode === "hero" ? 0.92 : variant === "seeds" ? 1.12 : 1.05);

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    parts.forEach(({ material, phase, baseBloom }) => {
      material.userData.bloomUniform.value = Math.min(
        1,
        baseBloom + scroll * 0.65 + Math.sin(t * 0.35 + phase) * 0.22,
      );
      material.userData.timeUniform.value = t;
    });
    root.rotation.y = scroll * 0.28 + (mouse?.x ?? 0) * 0.08 + Math.sin(t * 0.1) * 0.03;
    root.rotation.x = -0.04 + scroll * 0.1 + (mouse?.y ?? 0) * 0.04;
    root.children.forEach((ch) => {
      if (ch instanceof THREE.Mesh && ch.userData.barbIndex !== undefined) {
        // Security cipher rings (barbIndex >= 20) and legacy barbs
        const bi = ch.userData.barbIndex as number;
        if (bi >= 20) {
          ch.rotation.z = t * (0.1 + (bi - 20) * 0.08) * (bi % 2 === 0 ? 1 : -1);
        } else {
          ch.position.z = -9 - bi * 0.45 + ((t * 0.5 + scroll * 3) % 6);
          ch.rotation.y = t * 0.3;
        }
      }
      if (ch instanceof THREE.Mesh && ch.userData.gemPhase !== undefined) {
        ch.rotation.x = t * 0.22 + scroll * 0.5;
        ch.rotation.y = t * 0.16;
      }
      if (ch instanceof THREE.Mesh && ch.userData.ringIndex !== undefined) {
        const ri = ch.userData.ringIndex as number;
        ch.rotation.z = t * (0.12 + ri * 0.04) + scroll * 0.7;
        // Orbit rings also precess slightly
        if (variant === "orbit") {
          ch.rotation.y = t * (0.02 + ri * 0.01);
        }
      }
      if (ch instanceof THREE.Mesh && ch.userData.rodIndex !== undefined) {
        // Seeds architecture rods grow on scroll
        const ri = ch.userData.rodIndex as number;
        ch.scale.y = 1 + scroll * 0.4 + Math.sin(t * 0.6 + ri) * 0.04;
      }
    });
  };

  return { root, tick };
}
