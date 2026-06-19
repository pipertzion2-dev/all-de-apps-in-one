import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { floatGeo } from "@/lib/feature-graphic-builders";
import { buildFlyThroughCorridor } from "@/lib/feature-corridor";

export type ConceptDepth = {
  group: THREE.Group;
  tick: (t: number, scroll: number) => void;
};

function lineMat(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

/** Security — Pyracrypt HD bob-wire perimeter tunnel (Feed Shield / threat scan). */
function securityDepth(palette: GraphicPalette): ConceptDepth {
  const corridor = buildFlyThroughCorridor(palette);
  corridor.group.position.z = -14;
  return {
    group: corridor.group,
    tick: corridor.tick,
  };
}

/** Play — oscilloscope breath monitor: scan lines + sweeping playhead (BREATH AWAY). */
function playDepth(palette: GraphicPalette): ConceptDepth {
  const group = new THREE.Group();
  const waves: THREE.Line[] = [];
  const op = palette.lineOpacity;

  for (let row = 0; row < 12; row++) {
    const z = -row * 1.8 - 2;
    const pos = new Float32Array(128 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(
      geo,
      lineMat(row % 2 === 0 ? palette.primary : palette.tertiary, op * (0.35 + (row / 12) * 0.25)),
    );
    line.position.z = z;
    line.userData.row = row;
    group.add(line);
    waves.push(line);
  }

  const playheadPts = new Float32Array(6);
  const playheadGeo = new THREE.BufferGeometry();
  playheadGeo.setAttribute("position", new THREE.BufferAttribute(playheadPts, 3));
  const playhead = new THREE.Line(playheadGeo, lineMat(palette.highlight, 0.85));
  group.add(playhead);

  const tick = (t: number, scroll: number) => {
    const headX = Math.sin(t * 0.9 + scroll * 4) * 6;
    playheadPts[0] = headX;
    playheadPts[1] = -4;
    playheadPts[2] = 0;
    playheadPts[3] = headX;
    playheadPts[4] = 4;
    playheadPts[5] = 0;
    (playheadGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    waves.forEach((line, row) => {
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      const phase = t * 1.6 + row * 0.4 + scroll * 5;
      for (let i = 0; i < pos.count; i++) {
        const x = (i / (pos.count - 1) - 0.5) * 14;
        const breath = Math.sin(x * 0.55 + phase) * (0.35 + scroll * 0.4);
        const proximity = 1 - Math.min(1, Math.abs(x - headX) / 3);
        pos.setXYZ(i, x, breath * (0.6 + proximity * 0.5), 0);
      }
      pos.needsUpdate = true;
    });
  };

  return { group, tick };
}

/** Seeds — spec tree: staff ceiling + branching filaments + four collage frames (SETTLE DOWN). */
function seedsDepth(palette: GraphicPalette): ConceptDepth {
  const group = new THREE.Group();
  const branches: THREE.Line[] = [];
  const op = palette.lineOpacity;

  for (let s = 0; s < 5; s++) {
    const y = 3.5 - s * 0.55;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      pts.push(new THREE.Vector3((i / 40 - 0.5) * 14, y, -8));
    }
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat(palette.primary, op * 0.5),
      ),
    );
  }

  for (let b = 0; b < 16; b++) {
    const ang = (b / 16) * Math.PI * 2;
    const pos = new Float32Array(48 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const col = b % 3 === 0 ? palette.tertiary : b % 3 === 1 ? palette.primary : palette.secondary;
    const line = new THREE.Line(geo, lineMat(col, op * 0.75));
    line.userData.angle = ang;
    line.userData.phase = b;
    group.add(line);
    branches.push(line);
  }

  const frames: [number, number, number, number][] = [
    [-3.5, 1.5, palette.tertiary, palette.primary],
    [3.5, 1.5, palette.highlight, palette.secondary],
    [-3.5, -1.5, 0x8b7355, palette.wire],
    [3.5, -1.5, palette.primary, palette.wire],
  ];
  frames.forEach(([x, y, c1, c2], i) => {
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.2, 1.7)),
      lineMat(c1, op * 0.55),
    );
    frame.position.set(x, y, -6 - i * 0.3);
    group.add(frame);
    const inner = new THREE.LineSegments(
      floatGeo([-0.8, 0, 0.05, 0.8, 0, 0.05, 0, -0.5, 0.05, 0, 0.5, 0.05]),
      lineMat(c2, op * 0.4),
    );
    inner.position.set(x, y, -6 - i * 0.3);
    group.add(inner);
  });

  const core = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.4, 0)),
    lineMat(palette.tertiary, 0.9),
  );
  group.add(core);

  const tick = (t: number, scroll: number) => {
    const grow = 4 + scroll * 10;
    branches.forEach((line, b) => {
      const ang = line.userData.angle as number;
      const phase = line.userData.phase as number;
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      for (let s = 0; s < pos.count; s++) {
        const f = s / (pos.count - 1);
        const wobble = Math.sin(f * 8 + t + phase) * 0.15 * f;
        const r = f * grow;
        pos.setXYZ(
          s,
          Math.cos(ang) * r - Math.sin(ang) * wobble,
          Math.sin(ang) * r * 0.85 + Math.cos(ang) * wobble - 0.5,
          -4 - f * 6,
        );
      }
      pos.needsUpdate = true;
    });
    core.rotation.y = t * 0.2;
    core.scale.setScalar(1 + Math.sin(t * 0.5) * 0.08 + scroll * 0.1);
  };

  return { group, tick };
}

/** Orbit — growth radar: constellation nodes + rotating sweep (marketing intelligence). */
function orbitDepth(palette: GraphicPalette): ConceptDepth {
  const group = new THREE.Group();
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 2 + (i % 3) * 0.7;
    nodes.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.6, -5 - (i % 4) * 0.5));
  }

  const webPts: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].distanceTo(nodes[j]) < 2.6) {
        webPts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
      }
    }
  }
  const web = new THREE.LineSegments(
    floatGeo(webPts),
    lineMat(palette.secondary, palette.lineOpacity * 0.5),
  );
  group.add(web);

  nodes.forEach((n, i) => {
    const star = new THREE.LineSegments(
      floatGeo([
        n.x - 0.12,
        n.y,
        n.z,
        n.x + 0.12,
        n.y,
        n.z,
        n.x,
        n.y - 0.12,
        n.z,
        n.x,
        n.y + 0.12,
        n.z,
      ]),
      lineMat(i % 2 === 0 ? palette.tertiary : palette.highlight, 0.75),
    );
    group.add(star);
  });

  const sweep = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -4),
      new THREE.Vector3(0, 0, -4),
    ]),
    lineMat(palette.wire, 0.7),
  );
  group.add(sweep);

  const tick = (t: number, scroll: number) => {
    const angle = t * 0.5 + scroll * 2.5;
    const r = 3.2;
    const pts = sweep.geometry.attributes.position as THREE.BufferAttribute;
    pts.setXYZ(0, 0, 0, -4);
    pts.setXYZ(1, Math.cos(angle) * r, Math.sin(angle) * r * 0.6, -4);
    pts.needsUpdate = true;
    group.rotation.z = Math.sin(t * 0.15) * 0.03;
  };

  return { group, tick };
}

/** API — schema packaging line: jewel cases on conveyor (prompt → production API). */
function apiDepth(palette: GraphicPalette): ConceptDepth {
  const group = new THREE.Group();
  const panels: THREE.LineSegments[] = [];

  for (let i = 0; i < 5; i++) {
    const panel = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, 1.4, 0.1)),
      lineMat(i % 2 === 0 ? palette.primary : palette.secondary, palette.lineOpacity * 0.65),
    );
    panel.position.set((i - 2) * 0.5, 0, -i * 3.5 - 3);
    panel.userData.baseZ = panel.position.z;
    panel.userData.index = i;
    group.add(panel);
    panels.push(panel);

    const hinge = new THREE.LineSegments(
      floatGeo([-1.1, 0.7, 0, -1.1, 1.1, 0.35]),
      lineMat(palette.highlight, 0.5),
    );
    hinge.position.copy(panel.position);
    group.add(hinge);
  }

  const sweep = new THREE.LineSegments(
    floatGeo([-7, -2, -2, 7, -2, -2]),
    lineMat(palette.tertiary, 0.45),
  );
  group.add(sweep);

  const tick = (t: number, scroll: number) => {
    panels.forEach((panel, i) => {
      const baseZ = panel.userData.baseZ as number;
      panel.position.z = baseZ + ((t * 0.8 + scroll * 4 + i * 0.5) % 14) - 7;
      panel.rotation.x = -0.15 - scroll * 0.35 - Math.sin(t * 0.3 + i) * 0.05;
      panel.rotation.y = (i - 2) * 0.2 + Math.sin(t * 0.2 + i) * 0.04;
    });
    sweep.position.y = -2 + scroll * 3;
  };

  return { group, tick };
}

/** Hardware — crystal forge lattice: interlocking diamonds (concept → product). */
function hardwareDepth(palette: GraphicPalette): ConceptDepth {
  const group = new THREE.Group();
  const gems: THREE.LineSegments[] = [];
  const colors = [palette.primary, palette.secondary, palette.tertiary];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = (col - 2) * 1.6;
      const y = (row - 1.5) * 1.2;
      const z = -row * 2.5 - 3;
      const geo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.38, 0));
      const gem = new THREE.LineSegments(geo, lineMat(colors[row % 3], palette.lineOpacity * 0.7));
      gem.position.set(x, y, z);
      gem.userData.phase = row + col;
      group.add(gem);
      gems.push(gem);
    }
  }

  const tick = (t: number, scroll: number) => {
    gems.forEach((gem) => {
      const ph = gem.userData.phase as number;
      gem.rotation.x = t * 0.25 + scroll * 0.6 + ph * 0.1;
      gem.rotation.y = t * 0.18 + ph * 0.15;
      gem.rotation.z = Math.sin(t * 0.4 + ph) * 0.2;
    });
    group.position.y = Math.sin(t * 0.2) * 0.1;
  };

  return { group, tick };
}

/** App-specific depth environment — one purposeful metaphor per feature. */
export function buildConceptDepth(variant: FeatureId, palette: GraphicPalette): ConceptDepth {
  switch (variant) {
    case "security":
      return securityDepth(palette);
    case "play":
      return playDepth(palette);
    case "seeds":
      return seedsDepth(palette);
    case "orbit":
      return orbitDepth(palette);
    case "api":
      return apiDepth(palette);
    case "hardware":
      return hardwareDepth(palette);
  }
}
