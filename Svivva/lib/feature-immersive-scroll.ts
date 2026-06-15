import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { floatGeo } from "@/lib/feature-graphic-builders";
import { buildFlyThroughCorridor } from "@/lib/feature-corridor";

function lineMat(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

/** Pyracrypt crown-of-thorns — interlocking loops with barbs (security graphic). */
function buildThornCrown(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  const gold = lineMat(palette.tertiary, 0.92);
  const burg = lineMat(palette.highlight, 0.88);
  const teal = lineMat(palette.wire, 0.75);

  const rings = [
    { r: 2.8, rot: 0, mat: gold },
    { r: 2.35, rot: Math.PI / 6, mat: burg },
    { r: 3.2, rot: -Math.PI / 8, mat: teal },
    { r: 1.9, rot: Math.PI / 4, mat: gold },
  ];

  rings.forEach(({ r, rot, mat }, idx) => {
    const pts: THREE.Vector3[] = [];
    const teeth = 48;
    for (let i = 0; i <= teeth; i++) {
      const a = (i / teeth) * Math.PI * 2 + rot;
      const spike = i % 4 === 0 ? 0.35 : 0;
      pts.push(new THREE.Vector3(Math.cos(a) * (r + spike), Math.sin(a) * (r + spike * 0.7), idx * 0.08));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));

    for (let i = 0; i < teeth; i += 4) {
      const a = (i / teeth) * Math.PI * 2 + rot;
      const x = Math.cos(a) * (r + 0.35);
      const y = Math.sin(a) * (r + 0.25);
      const bx = Math.cos(a + 0.4) * 0.55;
      const by = Math.sin(a + 0.4) * 0.55;
      g.add(new THREE.LineSegments(floatGeo([x, y, idx * 0.08, x + bx, y + by, idx * 0.08]), burg));
    }
  });
  return g;
}

/** Play — stacked waveform ribbons (BREATH AWAY scan lines). */
function buildWaveRibbon(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  for (let band = 0; band < 5; band++) {
    const pts: THREE.Vector3[] = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments - 0.5) * 14;
      const y = Math.sin(x * 0.55 + band * 0.9) * (0.35 + band * 0.12) + band * 0.22 - 0.5;
      pts.push(new THREE.Vector3(x, y, band * 0.06));
    }
    const col = band % 2 === 0 ? palette.primary : palette.tertiary;
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(col, 0.7 - band * 0.06)));
  }
  return g;
}

/** Seeds — radiating branch crown (SETTLE DOWN filaments). */
function buildBranchCrown(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  for (let b = 0; b < 16; b++) {
    const ang = (b / 16) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 32; s++) {
      const f = s / 32;
      const wobble = Math.sin(f * 8 + b) * 0.15 * f;
      pts.push(
        new THREE.Vector3(
          Math.cos(ang) * f * 3.2 - Math.sin(ang) * wobble,
          Math.sin(ang) * f * 3.2 + Math.cos(ang) * wobble,
          Math.sin(f * 4) * 0.12,
        ),
      );
    }
    g.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat(b % 3 === 0 ? palette.secondary : palette.primary, 0.55 + (b % 4) * 0.06),
      ),
    );
  }
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), lineMat(palette.tertiary, 0.85)));
  return g;
}

/** Orbit — constellation web band. */
function buildOrbitWebBand(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 1.8 + (i % 3) * 0.55;
    nodes.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.55, (i % 2) * 0.1));
  }
  const webPts: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].distanceTo(nodes[j]) < 2.8) {
        webPts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
      }
    }
  }
  g.add(new THREE.LineSegments(floatGeo(webPts), lineMat(palette.secondary, 0.65)));
  nodes.forEach((n, i) => {
    const star = new THREE.LineSegments(
      floatGeo([n.x - 0.15, n.y, n.z, n.x + 0.15, n.y, n.z, n.x, n.y - 0.15, n.z, n.x, n.y + 0.15, n.z]),
      lineMat(i % 2 === 0 ? palette.tertiary : palette.highlight, 0.8),
    );
    g.add(star);
  });
  return g;
}

/** API — folding jewel-case panels. */
function buildPackagingBand(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  for (let p = 0; p < 4; p++) {
    const panel = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 1.6, 0.12)),
      lineMat(p % 2 === 0 ? palette.primary : palette.secondary, 0.72),
    );
    panel.position.set((p - 1.5) * 2.8, 0, p * 0.08);
    panel.rotation.y = (p - 1.5) * 0.25;
    g.add(panel);
    const hinge = new THREE.LineSegments(
      floatGeo([panel.position.x - 1.2, 0.8, panel.position.z, panel.position.x - 1.2, 1.2, panel.position.z + 0.4]),
      lineMat(palette.highlight, 0.55),
    );
    g.add(hinge);
  }
  return g;
}

/** Hardware — interlocking diamond lattice. */
function buildDiamondBand(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const x = (col - 2.5) * 1.4;
      const y = (row - 1) * 1.1;
      const geo = new THREE.OctahedronGeometry(0.45, 0);
      const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(
        [palette.primary, palette.secondary, palette.tertiary][row],
        0.75,
      ));
      mesh.position.set(x, y, row * 0.1);
      mesh.rotation.z = (col + row) * 0.35;
      g.add(mesh);
    }
  }
  return g;
}

function heroBandFor(variant: FeatureId, palette: GraphicPalette): THREE.Group {
  switch (variant) {
    case "security":
      return buildThornCrown(palette);
    case "play":
      return buildWaveRibbon(palette);
    case "seeds":
      return buildBranchCrown(palette);
    case "orbit":
      return buildOrbitWebBand(palette);
    case "api":
      return buildPackagingBand(palette);
    case "hardware":
      return buildDiamondBand(palette);
  }
}

export type ImmersiveScrollScene = {
  root: THREE.Group;
  hero: THREE.Group;
  tick: (t: number, scroll: number) => void;
};

/** Full immersive scene: hero band + depth tunnel, scroll-driven like Pyracrypt. */
export function buildImmersiveScrollScene(variant: FeatureId, palette: GraphicPalette): ImmersiveScrollScene {
  const root = new THREE.Group();

  const hero = heroBandFor(variant, palette);
  hero.position.z = 2;
  root.add(hero);

  const corridor = buildFlyThroughCorridor(palette);
  corridor.group.position.z = -14;
  corridor.group.scale.setScalar(variant === "security" ? 1 : 0.85);
  root.add(corridor.group);

  const tick = (t: number, scroll: number) => {
    corridor.tick(t, scroll);
    hero.rotation.y = scroll * Math.PI * 1.4 + t * 0.08;
    hero.rotation.x = Math.sin(t * 0.25) * 0.06 + scroll * 0.2;
    hero.position.x = Math.sin(t * 0.35 + scroll * 2) * 0.4;
    hero.position.z = 2 - scroll * 1.5;
    hero.scale.setScalar(1 + scroll * 0.15);
  };

  return { root, hero, tick };
}

export function buildScrollBandScene(variant: FeatureId, palette: GraphicPalette): ImmersiveScrollScene {
  return buildImmersiveScrollScene(variant, palette);
}
