import * as THREE from "three";

/** Shared corridor constants — matches Pyracrypt bobwire fly-through. */
export const CORRIDOR = {
  CW: 18,
  CH: 12,
  TILE_LEN: 28,
  TILES_N: 8,
  BASE_SPEED: 0.07,
} as const;

export function floatGeo(pts: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

export function lineMat(color: number, opacity = 0.55): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

export function gridPanel(
  fixedAxis: "x" | "y",
  fixedVal: number,
  yFrom: number,
  yTo: number,
  ySteps: number,
  zFrom: number,
  zTo: number,
  zSteps: number,
  mat: THREE.LineBasicMaterial,
): THREE.LineSegments {
  const pts: number[] = [];
  const addLine = (ax1: number, ax2: number, bx1: number, bx2: number) => {
    if (fixedAxis === "x") pts.push(fixedVal, ax1, ax2, fixedVal, bx1, bx2);
    else pts.push(ax1, fixedVal, ax2, bx1, fixedVal, bx2);
  };
  for (let i = 0; i <= ySteps; i++) {
    const y = yFrom + (i / ySteps) * (yTo - yFrom);
    addLine(y, zFrom, y, zTo);
  }
  for (let j = 0; j <= zSteps; j++) {
    const z = zFrom + (j / zSteps) * (zTo - zFrom);
    addLine(yFrom, z, yTo, z);
  }
  return new THREE.LineSegments(floatGeo(pts), mat);
}

export function barbedWireX(
  y: number,
  z: number,
  mat: THREE.LineBasicMaterial,
  barbMat: THREE.LineBasicMaterial,
): THREE.Group {
  const g = new THREE.Group();
  const hw = CORRIDOR.CW / 2;
  const BARB_SP = 1.3;
  const BS = 0.38;
  g.add(new THREE.LineSegments(floatGeo([-hw, y, z, hw, y, z]), mat));
  const barbPts: number[] = [];
  const count = Math.floor(CORRIDOR.CW / BARB_SP);
  for (let b = 0; b <= count; b++) {
    const x = -hw + b * BARB_SP;
    barbPts.push(x - BS, y + BS, z, x + BS, y - BS, z);
    barbPts.push(x - BS, y - BS, z, x + BS, y + BS, z);
  }
  g.add(new THREE.LineSegments(floatGeo(barbPts), barbMat));
  return g;
}

export function barbedWireY(
  x: number,
  z: number,
  mat: THREE.LineBasicMaterial,
  barbMat: THREE.LineBasicMaterial,
): THREE.Group {
  const g = new THREE.Group();
  const hh = CORRIDOR.CH / 2;
  const BARB_SP = 1.1;
  const BS = 0.32;
  g.add(new THREE.LineSegments(floatGeo([x, -hh, z, x, hh, z]), mat));
  const barbPts: number[] = [];
  const count = Math.floor(CORRIDOR.CH / BARB_SP);
  for (let b = 0; b <= count; b++) {
    const y = -hh + b * BARB_SP;
    barbPts.push(x, y - BS, z + BS, x, y + BS, z - BS);
    barbPts.push(x, y - BS, z - BS, x, y + BS, z + BS);
  }
  g.add(new THREE.LineSegments(floatGeo(barbPts), barbMat));
  return g;
}

/** Base corridor grid shell — walls, floor, ceiling. */
export function createCorridorShell(accent: number): THREE.Group {
  const g = new THREE.Group();
  const { CW, CH, TILE_LEN } = CORRIDOR;
  const hw = CW / 2;
  const hh = CH / 2;

  const matWall = lineMat(accent, 0.5);
  const matFloor = lineMat(accent, 0.32);
  const matCeil = lineMat(accent, 0.2);

  g.add(gridPanel("x", -hw, -hh, hh, 11, 0, -TILE_LEN, 6, matWall));
  g.add(gridPanel("x", hw, -hh, hh, 11, 0, -TILE_LEN, 6, matWall));
  g.add(gridPanel("y", -hh, -hw, hw, 9, 0, -TILE_LEN, 14, matFloor));
  g.add(gridPanel("y", hh, -hw, hw, 9, 0, -TILE_LEN, 7, matCeil));

  return g;
}

/** Pyracrypt-grade security tile — barbed wire corridor. */
export function createSecurityTile(accent: number, barbColor: number): THREE.Group {
  const g = createCorridorShell(accent);
  const { CW, CH, TILE_LEN } = CORRIDOR;
  const hw = CW / 2;

  const matWire = lineMat(accent, 0.85);
  const matBarb = lineMat(barbColor, 0.95);

  const zSlots = [-5, -12, -19];
  const yLevels = [-1.8, 1.8];
  for (const z of zSlots) {
    for (const y of yLevels) g.add(barbedWireX(y, z, matWire, matBarb));
    if (z === -12) g.add(barbedWireX(0, z, matWire, matBarb));
  }

  const vertZ = [-6, -18];
  const vertX = [-hw + 2.5, -hw + 6, hw - 2.5, hw - 6];
  for (const z of vertZ) {
    for (const x of vertX) g.add(barbedWireY(x, z, matWire, matBarb));
  }

  // Ornate vault ring at end of tile
  const ringPts: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ringPts.push(Math.cos(a) * 4.5, Math.sin(a) * 3.2, -TILE_LEN + 2);
  }
  g.add(new THREE.Line(floatGeo(ringPts), lineMat(barbColor, 0.7)));

  return g;
}

/** Seeds — branching filaments growing through the corridor. */
export function createSeedsTile(teal: number, rose: number): THREE.Group {
  const g = createCorridorShell(teal);
  const branchCount = 10;
  const segments = 48;

  for (let b = 0; b < branchCount; b++) {
    const positions = new Float32Array(segments * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const line = new THREE.Line(geo, lineMat(b % 3 === 0 ? rose : teal, 0.45 + (b % 4) * 0.08));
    line.userData = { angle: (b / branchCount) * Math.PI * 2, spread: 0.4 + (b % 5) * 0.1, phase: b };
    g.add(line);
  }

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: teal, wireframe: true, transparent: true, opacity: 0.75 }),
  );
  core.position.set(0, -2, -14);
  g.add(core);

  return g;
}

/** Play — oscilloscope wave bands on walls + floating note wireframes. */
export function createPlayTile(accent: number): THREE.Group {
  const g = createCorridorShell(accent);
  const { CW, CH, TILE_LEN } = CORRIDOR;
  const hw = CW / 2;
  const hh = CH / 2;

  for (let band = 0; band < 6; band++) {
    const positions = new Float32Array(80 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const line = new THREE.Line(geo, lineMat(0x9b7fd4 + band * 0x020204, 0.5));
    line.userData = { band, wall: band % 2 === 0 ? -hw + 0.2 : hw - 0.2, y: -hh + 2 + band * 1.6 };
    g.add(line);
  }

  const notePositions = [
    [-3, 1, -8],
    [2, -0.5, -16],
    [-1.5, 2.5, -22],
  ];
  notePositions.forEach(([x, y, z], i) => {
    const note = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.8 });
    note.add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mat));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), mat);
    stem.position.set(0.3, 0.8, 0);
    note.add(stem);
    note.position.set(x, y, z);
    note.userData.phase = i;
    g.add(note);
  });

  return g;
}

/** Orbit — orbital nodes + web lines through corridor. */
export function createOrbitTile(accent: number, secondary: number): THREE.Group {
  const g = createCorridorShell(accent);
  const nodes: THREE.Mesh[] = [];

  for (let i = 0; i < 8; i++) {
    const ring = 3 + (i % 3) * 1.5;
    const a = (i / 8) * Math.PI * 2;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 10),
      new THREE.MeshBasicMaterial({ color: i % 2 ? secondary : accent, wireframe: true, transparent: true, opacity: 0.85 }),
    );
    node.position.set(Math.cos(a) * ring, Math.sin(a) * ring * 0.5, -4 - i * 2.8);
    node.userData = { ring, a, i };
    g.add(node);
    nodes.push(node);
  }

  const web = new THREE.LineSegments(floatGeo([]), lineMat(accent, 0.35));
  web.userData.isWeb = true;
  g.add(web);

  return g;
}

/** API — wireframe product boxes along the corridor. */
export function createApiTile(accent: number): THREE.Group {
  const g = createCorridorShell(accent);
  const specs: [number, number, number, number, number][] = [
    [-4, 0, -6, 1.8, 1.2],
    [3, 1.5, -14, 2, 1.4],
    [-2, -2, -22, 2.2, 1.6],
  ];

  specs.forEach(([x, y, z, w, h], i) => {
    const box = new THREE.Group();
    box.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, w * 0.7)),
        lineMat(accent, 0.7),
      ),
    );
    const lid = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.15, w * 0.7)),
      lineMat(0xd782b2, 0.85),
    );
    lid.position.y = h / 2;
    lid.userData.isLid = true;
    box.add(lid);
    box.position.set(x, y, z);
    box.userData.index = i;
    g.add(box);
  });

  return g;
}

/** Hardware — crystal octahedra + lattice truss. */
export function createHardwareTile(accent: number): THREE.Group {
  const g = createCorridorShell(accent);
  const colors = [0xb5547a, 0x5a9e6a, 0xc04040, 0xd4a85a];
  const gems: THREE.Mesh[] = [];

  const spots: [number, number, number, number][] = [
    [-4, 0, -7, 0.9],
    [4, 2, -12, 0.75],
    [-2, -2.5, -18, 1],
    [3, -1, -24, 0.85],
  ];
  spots.forEach(([x, y, z, s], i) => {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(s, 0),
      new THREE.MeshBasicMaterial({ color: colors[i % colors.length], wireframe: true, transparent: true, opacity: 0.8 }),
    );
    gem.position.set(x, y, z);
    gem.userData.i = i;
    g.add(gem);
    gems.push(gem);
  });

  const latticePts: number[] = [];
  for (let a = 0; a < gems.length; a++) {
    for (let b = a + 1; b < gems.length; b++) {
      latticePts.push(
        gems[a].position.x, gems[a].position.y, gems[a].position.z,
        gems[b].position.x, gems[b].position.y, gems[b].position.z,
      );
    }
  }
  g.add(new THREE.LineSegments(floatGeo(latticePts), lineMat(accent, 0.45)));

  return g;
}

export type TileBuilder = (accent: number, secondary?: number) => THREE.Group;

export const TILE_BUILDERS: Record<string, TileBuilder> = {
  security: (accent) => createSecurityTile(accent, 0x9b3a5e),
  seeds: (accent) => createSeedsTile(accent, 0x6b2c4a),
  play: (accent) => createPlayTile(accent),
  orbit: (accent, secondary = 0xe8a040) => createOrbitTile(accent, secondary),
  api: (accent) => createApiTile(accent),
  hardware: (accent) => createHardwareTile(accent),
};
