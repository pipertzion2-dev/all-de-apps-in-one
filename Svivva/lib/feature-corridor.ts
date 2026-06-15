import * as THREE from "three";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { floatGeo } from "@/lib/feature-graphic-builders";

const TILE_LEN = 24;
const CW = 16;
const CH = 10;

function lineMat(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

function gridPanel(
  fixedAxis: "x" | "y",
  fixedVal: number,
  aFrom: number,
  aTo: number,
  aSteps: number,
  bFrom: number,
  bTo: number,
  bSteps: number,
  mat: THREE.LineBasicMaterial,
): THREE.LineSegments {
  const pts: number[] = [];
  const seg = (ax1: number, ax2: number, bx1: number, bx2: number) => {
    if (fixedAxis === "x") pts.push(fixedVal, ax1, ax2, fixedVal, bx1, bx2);
    else pts.push(ax1, fixedVal, ax2, bx1, fixedVal, bx2);
  };
  for (let i = 0; i <= aSteps; i++) {
    const a = aFrom + (i / aSteps) * (aTo - aFrom);
    seg(a, bFrom, a, bTo);
  }
  for (let j = 0; j <= bSteps; j++) {
    const b = bFrom + (j / bSteps) * (bTo - bFrom);
    seg(aFrom, b, aTo, b);
  }
  return new THREE.LineSegments(floatGeo(pts), mat);
}

function barbedWireX(
  y: number,
  z: number,
  hw: number,
  wire: THREE.LineBasicMaterial,
  barb: THREE.LineBasicMaterial,
): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.LineSegments(floatGeo([-hw, y, z, hw, y, z]), wire));
  const barbPts: number[] = [];
  const BS = 0.32;
  for (let b = 0; b <= Math.floor(CW / 1.2); b++) {
    const x = -hw + b * 1.2;
    barbPts.push(x - BS, y + BS, z, x + BS, y - BS, z, x - BS, y - BS, z, x + BS, y + BS, z);
  }
  g.add(new THREE.LineSegments(floatGeo(barbPts), barb));
  return g;
}

function createCorridorTile(palette: GraphicPalette): THREE.Group {
  const g = new THREE.Group();
  const hw = CW / 2;
  const hh = CH / 2;
  const wall = lineMat(palette.wire, palette.lineOpacity * 0.55);
  const floor = lineMat(palette.primary, palette.lineOpacity * 0.35);
  const ceil = lineMat(palette.secondary, palette.lineOpacity * 0.22);
  const wire = lineMat(palette.wire, 0.85);
  const barb = lineMat(palette.highlight, 0.9);

  g.add(gridPanel("x", -hw, -hh, hh, 9, 0, -TILE_LEN, 5, wall));
  g.add(gridPanel("x", hw, -hh, hh, 9, 0, -TILE_LEN, 5, wall));
  g.add(gridPanel("y", -hh, -hw, hw, 7, 0, -TILE_LEN, 10, floor));
  g.add(gridPanel("y", hh, -hw, hw, 7, 0, -TILE_LEN, 5, ceil));

  for (const z of [-4, -11, -18]) {
    for (const y of [-1.6, 1.6]) g.add(barbedWireX(y, z, hw, wire, barb));
    if (z === -11) g.add(barbedWireX(0, z, hw, wire, barb));
  }
  return g;
}

export type FlyCorridor = {
  group: THREE.Group;
  tiles: THREE.Group[];
  tick: (t: number, scroll: number) => void;
};

/** Pyracrypt-style fly-through corridor — scroll accelerates forward motion. */
export function buildFlyThroughCorridor(palette: GraphicPalette): FlyCorridor {
  const group = new THREE.Group();
  group.position.set(0, 0, -18);
  group.rotation.x = -0.12;

  const tiles: THREE.Group[] = [];
  const TILES_N = 7;
  for (let i = 0; i < TILES_N; i++) {
    const tile = createCorridorTile(palette);
    tile.position.z = -i * TILE_LEN;
    group.add(tile);
    tiles.push(tile);
  }

  const tick = (t: number, scroll: number) => {
    const speed = 0.045 + scroll * 0.12;
    for (const tile of tiles) {
      tile.position.z += speed;
      if (tile.position.z > 6) tile.position.z -= TILES_N * TILE_LEN;
    }
    group.rotation.y = Math.sin(t * 0.15) * 0.04 + scroll * 0.35;
  };

  return { group, tiles, tick };
}
