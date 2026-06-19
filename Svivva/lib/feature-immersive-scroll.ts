import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { floatGeo } from "@/lib/feature-graphic-builders";
import { buildConceptDepth } from "@/lib/feature-concept-depth";

function lineMat(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

/** Security — ornate vault seal: thorn crown + lock shackle (FOREVER YOURS). */
function buildVaultSeal(palette: GraphicPalette): THREE.Group {
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
      pts.push(
        new THREE.Vector3(Math.cos(a) * (r + spike), Math.sin(a) * (r + spike * 0.7), idx * 0.08),
      );
    }
    const loop = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    loop.userData.isSealRing = true;
    loop.userData.ringIndex = idx;
    g.add(loop);

    for (let i = 0; i < teeth; i += 4) {
      const a = (i / teeth) * Math.PI * 2 + rot;
      const x = Math.cos(a) * (r + 0.35);
      const y = Math.sin(a) * (r + 0.25);
      const bx = Math.cos(a + 0.4) * 0.55;
      const by = Math.sin(a + 0.4) * 0.55;
      g.add(new THREE.LineSegments(floatGeo([x, y, idx * 0.08, x + bx, y + by, idx * 0.08]), burg));
    }
  });

  const shacklePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 36; i++) {
    const a = Math.PI * (i / 36);
    shacklePts.push(new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a) * 2.2 + 2.8, 0.15));
  }
  const shackle = new THREE.Line(new THREE.BufferGeometry().setFromPoints(shacklePts), burg);
  shackle.userData.isShackle = true;
  g.add(shackle);

  return g;
}

/** Play — stacked waveform ribbons (BREATH AWAY scan lines). */
function buildWaveRibbon(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  for (let band = 0; band < 5; band++) {
    const segments = 80;
    const pos = new Float32Array((segments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const col = band % 2 === 0 ? palette.primary : palette.tertiary;
    const line = new THREE.Line(geo, lineMat(col, 0.7 - band * 0.06));
    line.userData.isWaveRibbon = true;
    line.userData.band = band;
    g.add(line);
  }
  return g;
}

/** Seeds — radiating branch crown + music staff (SETTLE DOWN filaments). */
function buildBranchCrown(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();

  for (let line = 0; line < 5; line++) {
    const y = 2.2 - line * 0.55;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const x = (i / 48 - 0.5) * 16;
      pts.push(new THREE.Vector3(x, y, 0.15));
    }
    g.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat(line % 2 === 0 ? palette.primary : palette.highlight, 0.72),
      ),
    );
  }

  for (let b = 0; b < 24; b++) {
    const ang = (b / 24) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 40; s++) {
      const f = s / 40;
      const wobble = Math.sin(f * 9 + b * 0.7) * 0.22 * f;
      const r = f * 4.8;
      pts.push(
        new THREE.Vector3(
          Math.cos(ang) * r - Math.sin(ang) * wobble,
          Math.sin(ang) * r * 0.85 + Math.cos(ang) * wobble - 0.4,
          Math.sin(f * 5 + b) * 0.18,
        ),
      );
    }
    const col = b % 3 === 0 ? palette.secondary : b % 3 === 1 ? palette.primary : palette.tertiary;
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(col, 0.82)));
  }

  const core = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.45, 0)),
    lineMat(palette.tertiary, 0.9),
  );
  g.add(core);

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
    g.add(
      new THREE.LineSegments(
        floatGeo([
          n.x - 0.15,
          n.y,
          n.z,
          n.x + 0.15,
          n.y,
          n.z,
          n.x,
          n.y - 0.15,
          n.z,
          n.x,
          n.y + 0.15,
          n.z,
        ]),
        lineMat(i % 2 === 0 ? palette.tertiary : palette.highlight, 0.8),
      ),
    );
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
    panel.userData.isPackPanel = true;
    panel.userData.panelIndex = p;
    g.add(panel);
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
      const mesh = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.45, 0)),
        lineMat([palette.primary, palette.secondary, palette.tertiary][row], 0.75),
      );
      mesh.position.set(x, y, row * 0.1);
      mesh.rotation.z = (col + row) * 0.35;
      mesh.userData.isDiamond = true;
      g.add(mesh);
    }
  }
  return g;
}

function heroBandFor(variant: FeatureId, palette: GraphicPalette): THREE.Group {
  switch (variant) {
    case "security":
      return buildVaultSeal(palette);
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

function tickHero(variant: FeatureId, hero: THREE.Group, t: number, scroll: number) {
  switch (variant) {
    case "play":
      hero.children.forEach((child) => {
        if (!(child instanceof THREE.Line) || !child.userData.isWaveRibbon) return;
        const band = child.userData.band as number;
        const pos = child.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = (i / (pos.count - 1) - 0.5) * 14;
          const y =
            Math.sin(x * 0.55 + band * 0.9 + t * 1.5 + scroll * 4) * (0.35 + band * 0.12) +
            band * 0.22 -
            0.5;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      });
      break;
    case "security":
      hero.children.forEach((child) => {
        if (child instanceof THREE.Line && child.userData.isSealRing) {
          const r = child.userData.ringIndex as number;
          child.rotation.z = (r % 2 === 0 ? 1 : -1) * (t * 0.08 + scroll * 0.4);
        }
        if (child instanceof THREE.Line && child.userData.isShackle) {
          child.position.y = -scroll * 0.8;
        }
      });
      break;
    case "api":
      hero.children.forEach((child) => {
        if (child instanceof THREE.LineSegments && child.userData.isPackPanel) {
          const p = child.userData.panelIndex as number;
          child.rotation.x = -scroll * 0.5 - 0.2 + Math.sin(t * 0.25 + p) * 0.04;
        }
      });
      break;
    case "hardware":
      hero.children.forEach((child) => {
        if (child instanceof THREE.LineSegments && child.userData.isDiamond) {
          child.rotation.x = t * 0.2 + scroll * 0.5;
          child.rotation.y = t * 0.15;
        }
      });
      break;
  }
}

export type ImmersiveScrollScene = {
  root: THREE.Group;
  hero: THREE.Group;
  tick: (t: number, scroll: number) => void;
};

/** Hero focal motif + app-specific depth field (no shared random tunnel). */
export function buildImmersiveScrollScene(
  variant: FeatureId,
  palette: GraphicPalette,
): ImmersiveScrollScene {
  const root = new THREE.Group();

  const hero = heroBandFor(variant, palette);
  hero.position.z = 1.5;
  root.add(hero);

  const depth = buildConceptDepth(variant, palette);
  depth.group.position.z = -10;
  depth.group.scale.setScalar(variant === "security" ? 1 : 0.9);
  root.add(depth.group);

  const tick = (t: number, scroll: number) => {
    depth.tick(t, scroll);
    tickHero(variant, hero, t, scroll);
    hero.rotation.y = scroll * 0.35 + Math.sin(t * 0.12) * 0.04;
    hero.rotation.x = Math.sin(t * 0.2) * 0.04 + scroll * 0.08;
    hero.position.z = 1.5 - scroll * 0.8;
    hero.scale.setScalar(1 + scroll * 0.08);
  };

  return { root, hero, tick };
}

export function buildScrollBandScene(
  variant: FeatureId,
  palette: GraphicPalette,
): ImmersiveScrollScene {
  return buildImmersiveScrollScene(variant, palette);
}
