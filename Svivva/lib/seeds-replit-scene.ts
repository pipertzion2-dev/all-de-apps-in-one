import * as THREE from "three";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

const TEAL = 0x5ba8a0;
const BURGUNDY = 0x6b2c4a;
const WIRE = 0x8b9cb3;

export type SeedsReplitScene = {
  root: THREE.Group;
  tick: (t: number, state: SeedsWorkflowState, mouse: { x: number; y: number }, scroll: number) => void;
};

type AppTile = {
  group: THREE.Group;
  screen: THREE.Mesh;
  rim: THREE.LineSegments;
  codeBars: THREE.Mesh[];
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
};

type DataStream = {
  curve: THREE.CatmullRomCurve3;
  particles: THREE.Points;
  positions: Float32Array;
  speeds: Float32Array;
};

function panelMat(accent: number, emissive = 0.22) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0c1018,
    metalness: 0.92,
    roughness: 0.18,
    transparent: true,
    opacity: 0.94,
    emissive: new THREE.Color(accent),
    emissiveIntensity: emissive,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  });
}

function createSpecMonolith(): {
  group: THREE.Group;
  body: THREE.Mesh;
  scan: THREE.Mesh;
  lines: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.14), panelMat(TEAL, 0.35));
  group.add(body);

  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.24, 3.24, 0.16)),
    new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.9 }),
  );
  group.add(rim);

  const lines: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const w = 1.5 - (i % 4) * 0.18;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.035, 0.02),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? TEAL : i % 3 === 1 ? BURGUNDY : WIRE,
        transparent: true,
        opacity: 0.35 + (i % 3) * 0.12,
      }),
    );
    bar.position.set(-0.05, 1.35 - i * 0.2, 0.09);
    group.add(bar);
    lines.push(bar);
  }

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.06),
    new THREE.MeshBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scan.position.z = 0.1;
  group.add(scan);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.22),
    new THREE.MeshBasicMaterial({ color: BURGUNDY, transparent: true, opacity: 0.55 }),
  );
  label.position.set(0, -1.35, 0.09);
  group.add(label);

  group.position.set(0, 0.4, 0);
  return { group, body, scan, lines };
}

function createAppTile(index: number): AppTile {
  const group = new THREE.Group();
  const accent = index % 2 === 0 ? TEAL : BURGUNDY;

  const chrome = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 0.12, 0.095),
    panelMat(accent, 0.12),
  );
  chrome.position.y = 0.58;
  group.add(chrome);

  for (let d = 0; d < 3; d++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({
        color: d === 0 ? 0xef4444 : d === 1 ? 0xeab308 : 0x22c55e,
        transparent: true,
        opacity: 0.85,
      }),
    );
    dot.position.set(-0.62 + d * 0.12, 0.58, 0.05);
    group.add(dot);
  }

  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.05, 0.09), panelMat(accent, 0.18));
  group.add(screen);

  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.67, 1.07, 0.1)),
    new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.85 }),
  );
  group.add(rim);

  const codeBars: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.1 - i * 0.12, 0.028, 0.015),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.45 - i * 0.06,
      }),
    );
    bar.position.set(0, 0.32 - i * 0.14, 0.055);
    group.add(bar);
    codeBars.push(bar);
  }

  const ang = (index / 8) * Math.PI * 2 - Math.PI / 2;
  const radius = 4.2 + (index % 3) * 0.55;
  const y = Math.sin(index * 1.3) * 1.1;
  const basePos = new THREE.Vector3(Math.cos(ang) * radius, y, Math.sin(ang) * radius * 0.35 - 1.5);
  const baseRot = new THREE.Euler(0, -ang + Math.PI / 2, 0);

  group.position.copy(basePos);
  group.rotation.copy(baseRot);

  return { group, screen, rim, codeBars, basePos, baseRot };
}

function createDataStream(from: THREE.Vector3, to: THREE.Vector3): DataStream {
  const mid = from.clone().lerp(to, 0.5);
  mid.y += 1.2;
  mid.z -= 0.8;
  const curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()]);
  const count = 48;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    speeds[i] = 0.15 + (i % 7) * 0.04;
    const p = curve.getPoint((i / count) % 1);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: TEAL,
      size: 0.06,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  return { curve, particles, positions, speeds };
}

function buildWorkspaceGrid(): THREE.Group {
  const g = new THREE.Group();
  const grid = new THREE.GridHelper(48, 48, 0x2a3544, 0x141c28);
  grid.position.y = -2.8;
  grid.material.opacity = 0.35;
  (grid.material as THREE.Material).transparent = true;
  g.add(grid);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x05080c,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.81;
  g.add(floor);
  return g;
}

/** Replit-style workspace: spec monolith + orbiting deploy tiles + data streams on a full-page grid. */
export function buildSeedsReplitScene(): SeedsReplitScene {
  const root = new THREE.Group();
  root.add(buildWorkspaceGrid());

  const spec = createSpecMonolith();
  root.add(spec.group);

  const maxTiles = 8;
  const tiles: AppTile[] = [];
  const streams: DataStream[] = [];

  for (let i = 0; i < maxTiles; i++) {
    const tile = createAppTile(i);
    tile.group.visible = false;
    tile.group.scale.setScalar(0.01);
    root.add(tile.group);
    tiles.push(tile);

    const stream = createDataStream(
      spec.group.position.clone(),
      tile.basePos.clone(),
    );
    stream.particles.visible = false;
    root.add(stream.particles);
    streams.push(stream);
  }

  const dustCount = 120;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 22;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: WIRE,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  root.add(dust);

  const tick = (t: number, state: SeedsWorkflowState, mouse: { x: number; y: number }, scroll: number) => {
    const activeCount = Math.min(maxTiles, state.seedCount);
    const buildEnergy =
      state.phase === "building"
        ? 0.6 + state.avgBuildProgress * 0.4
        : state.phase === "uploading"
          ? 0.5 + Math.sin(t * 5) * 0.3
          : state.phase === "verifying"
            ? 0.45
            : state.phase === "complete"
              ? 1
              : 0.2;

    root.position.x = mouse.x * 0.45;
    root.position.y = mouse.y * 0.22 - scroll * 2.2;
    root.rotation.y = mouse.x * 0.06 + scroll * 0.35;

    spec.group.rotation.y = Math.sin(t * 0.15) * 0.08;
    spec.scan.position.y = ((t * 0.8) % 2.8) * 1.15 - 1.4;
    (spec.scan.material as THREE.MeshBasicMaterial).opacity =
      state.phase === "uploading" ? 0.85 : state.phase === "verifying" ? 0.55 : 0.25;

    const bodyMat = spec.body.material as THREE.MeshPhysicalMaterial;
    bodyMat.emissiveIntensity = 0.25 + buildEnergy * 0.45;

    spec.lines.forEach((line, i) => {
      line.position.x = Math.sin(t * 0.4 + i) * 0.02 * buildEnergy;
    });

    tiles.forEach((tile, i) => {
      const active = i < activeCount;
      const targetScale = active ? 1 : 0.01;
      const s = tile.group.scale.x;
      const next = THREE.MathUtils.lerp(s, targetScale, active ? 0.06 : 0.12);
      tile.group.scale.setScalar(next);
      tile.group.visible = next > 0.02;

      if (!active) return;

      const built = i < state.builtCount;
      const building = state.phase === "building" && !built;
      const float = Math.sin(t * 0.9 + i * 0.7) * 0.12;

      tile.group.position.x = tile.basePos.x + float * 0.35;
      tile.group.position.y = tile.basePos.y + float;
      tile.group.position.z = tile.basePos.z + Math.cos(t * 0.7 + i) * 0.08;
      tile.group.rotation.y = tile.baseRot.y + Math.sin(t * 0.25 + i) * 0.06;

      const accent = built ? TEAL : building ? BURGUNDY : WIRE;
      (tile.screen.material as THREE.MeshPhysicalMaterial).emissive.set(accent);
      (tile.screen.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
        built ? 0.55 : building ? 0.4 + Math.sin(t * 4 + i) * 0.15 : 0.2;

      tile.codeBars.forEach((bar, b) => {
        bar.scale.x = 0.85 + Math.sin(t * 2 + i + b) * 0.08 * (building ? 1.5 : 1);
      });
    });

    streams.forEach((stream, i) => {
      const active = i < activeCount;
      stream.particles.visible = active && buildEnergy > 0.25;
      if (!active) return;

      const speedMul = state.phase === "building" ? 2.2 : state.phase === "uploading" ? 1.6 : 1;
      const pos = stream.positions;
      for (let p = 0; p < stream.speeds.length; p++) {
        const phase = ((t * stream.speeds[p] * speedMul + p * 0.02) % 1);
        const pt = stream.curve.getPoint(phase);
        pos[p * 3] = pt.x;
        pos[p * 3 + 1] = pt.y;
        pos[p * 3 + 2] = pt.z;
      }
      (stream.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (stream.particles.material as THREE.PointsMaterial).opacity =
        0.35 + buildEnergy * 0.45;
    });

    const dustAttr = dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustCount; i++) {
      dustAttr.setY(i, dustPos[i * 3 + 1] + Math.sin(t * 0.2 + i) * 0.002);
    }
    dustAttr.needsUpdate = true;
    dust.rotation.y = t * 0.02;
  };

  return { root, tick };
}
