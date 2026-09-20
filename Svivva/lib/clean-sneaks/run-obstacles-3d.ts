import * as THREE from "three";
import { OBSTACLE_META } from "./constants";
import type { ObstacleKind } from "./types";

function puddleMaterial(color: string): THREE.MeshPhysicalMaterial {
  // Keep spills self-contained — do not pull asphalt canvas textures (breaks Node tests).
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.12,
    metalness: 0.2,
    clearcoat: 0.85,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
}

function setShadows(obj: THREE.Object3D) {
  obj.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
}

/** Deterministic 0–1 noise from an integer seed. */
function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function matPlastic(color: number, rough = 0.55): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0.08,
  });
}

function matMetal(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.72,
  });
}

function matPaper(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.02,
  });
}

/** Crushed soda can lying on its side. */
export function buildCrushedCan3D(seed = 1): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.2, 10),
    matMetal(seed % 2 === 0 ? 0x88a0b0 : 0xc45c26),
  );
  body.rotation.z = 1.15 + hash01(seed) * 0.4;
  body.position.set(0, 0.06, 0);
  const dent = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matMetal(0x6a7a88));
  dent.scale.set(1.4, 0.55, 0.9);
  dent.position.set(0.02, 0.07, 0.02);
  g.add(body, dent);
  return g;
}

/** Plastic bottle with cap — tipped on the asphalt. */
export function buildPlasticBottle3D(seed = 2): THREE.Group {
  const g = new THREE.Group();
  const tint = [0x7ec8d9, 0xe8e8ec, 0xa8d5a2][seed % 3]!;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.06, 0.28, 12),
    new THREE.MeshPhysicalMaterial({
      color: tint,
      roughness: 0.25,
      metalness: 0.05,
      transparent: true,
      opacity: 0.78,
      transmission: 0.35,
      thickness: 0.2,
    }),
  );
  body.rotation.z = Math.PI / 2 + hash01(seed + 3) * 0.35;
  body.position.y = 0.055;
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.07, 8),
    matPlastic(tint, 0.35),
  );
  neck.position.set(0.16, 0.06, 0);
  neck.rotation.z = Math.PI / 2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), matPlastic(0x2d3748));
  cap.position.set(0.2, 0.06, 0);
  cap.rotation.z = Math.PI / 2;
  g.add(body, neck, cap);
  return g;
}

/** Crumpled food wrapper / newspaper wad. */
export function buildCrumpledWrapper3D(seed = 3): THREE.Group {
  const g = new THREE.Group();
  const colors = [0xb8c4a8, 0xe8dcc0, 0xd4af37, 0xc4a35a, 0x9ca3af];
  for (let i = 0; i < 5; i++) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.06 + hash01(seed * 10 + i) * 0.05, 0),
      matPaper(colors[(seed + i) % colors.length]!),
    );
    blob.position.set(
      (hash01(seed + i * 2) - 0.5) * 0.18,
      0.04 + hash01(seed + i * 3) * 0.05,
      (hash01(seed + i * 5) - 0.5) * 0.14,
    );
    blob.scale.set(
      0.8 + hash01(seed + i) * 0.6,
      0.45 + hash01(seed + i * 7) * 0.5,
      0.9 + hash01(seed + i * 11) * 0.4,
    );
    blob.rotation.set(hash01(seed + i), hash01(seed + i * 2), hash01(seed + i * 3));
    g.add(blob);
  }
  return g;
}

/** Black trash bag — lumpy, tied at the top. */
export function buildTrashBag3D(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const bagMat = new THREE.MeshPhysicalMaterial({
    color: 0x2d3748,
    roughness: 0.88,
    metalness: 0.04,
    clearcoat: 0.12,
  });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.32 * scale, 14, 12), bagMat);
  bag.scale.set(1.05, 0.9, 0.95);
  bag.position.y = 0.26 * scale;
  const bulge = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 10, 8), bagMat);
  bulge.position.set(0.12 * scale, 0.2 * scale, 0.08 * scale);
  const tie = new THREE.Mesh(
    new THREE.TorusGeometry(0.1 * scale, 0.025 * scale, 6, 14),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 }),
  );
  tie.position.y = 0.48 * scale;
  tie.rotation.x = Math.PI / 2;
  g.add(bag, bulge, tie);
  return g;
}

/** Tipped takeaway cup with a small spill puddle. */
export function buildDrinkCup3D(color = "#c45c26"): THREE.Group {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.055, 0.16, 12),
    matPlastic(new THREE.Color(color).getHex(), 0.45),
  );
  cup.rotation.z = 1.35;
  cup.position.set(0, 0.07, 0);
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.02, 12),
    matPlastic(0xe8e8ec, 0.4),
  );
  lid.position.set(-0.08, 0.12, 0);
  lid.rotation.z = 1.35;
  const spill = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), puddleMaterial(color));
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0.12, 0.02, 0.02);
  g.add(cup, lid, spill);
  return g;
}

/** Mixed debris pile — cans, wrappers, bottle shards (no flat boxes). */
export function buildDebrisPile3D(seed = 4, scaleW = 1): THREE.Group {
  const pile = new THREE.Group();
  pile.add(buildCrushedCan3D(seed));
  const wrap = buildCrumpledWrapper3D(seed + 2);
  wrap.position.set(-0.22 * scaleW, 0, 0.12);
  wrap.scale.setScalar(0.85);
  pile.add(wrap);
  const bottle = buildPlasticBottle3D(seed + 5);
  bottle.position.set(0.2 * scaleW, 0, -0.08);
  bottle.scale.setScalar(0.75);
  pile.add(bottle);
  // Cardboard flap — thin, slightly bent via two panels
  const cardMat = matPaper(0xc4a35a);
  const flapA = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.16), cardMat);
  flapA.position.set(-0.05, 0.03, -0.18);
  flapA.rotation.set(0.15, 0.4, 0.2);
  const flapB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.12), cardMat);
  flapB.position.set(0.08, 0.025, -0.2);
  flapB.rotation.set(-0.2, -0.5, 0.1);
  pile.add(flapA, flapB);
  return pile;
}

/** Muddy grass clumps — organic blobs, not cubes. */
export function buildMudClumps3D(color: string, scaleW = 1): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.02,
  });
  for (let i = 0; i < 5; i++) {
    const clump = new THREE.Mesh(new THREE.SphereGeometry(0.1 + hash01(i * 9) * 0.08, 10, 8), mat);
    clump.scale.set(1.2, 0.45 + hash01(i) * 0.25, 1.1);
    clump.position.set((hash01(i * 2) - 0.5) * 0.55 * scaleW, 0.04, (hash01(i * 3) - 0.5) * 0.4);
    g.add(clump);
  }
  return g;
}

/**
 * Decorative asphalt litter piece for the scrolling road (not a collision obstacle).
 * kind 0–4 cycles through common street garbage shapes.
 */
export function buildStreetLitterPiece3D(kind: number, seed: number): THREE.Object3D {
  const k = ((kind % 5) + 5) % 5;
  let piece: THREE.Group;
  if (k === 0) piece = buildCrushedCan3D(seed);
  else if (k === 1) piece = buildCrumpledWrapper3D(seed);
  else if (k === 2) piece = buildPlasticBottle3D(seed);
  else if (k === 3) piece = buildTrashBag3D(0.45 + hash01(seed) * 0.2);
  else piece = buildDrinkCup3D(k === 4 ? "#c45c26" : "#5b8da8");

  piece.rotation.y = hash01(seed + 17) * Math.PI * 2;
  const s = 0.85 + hash01(seed + 23) * 0.45;
  piece.scale.setScalar(s);
  setShadows(piece);
  return piece;
}

/** Detailed 3D obstacle meshes with PBR materials. */
export function buildObstacle3D(kind: ObstacleKind): THREE.Object3D {
  const meta = OBSTACLE_META[kind];
  const scaleW = meta.w / 40;
  const scaleH = meta.h / 20;
  const root = new THREE.Group();

  if (kind === "pothole" || kind === "mud" || kind === "water" || kind === "paint") {
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(0.35 * scaleW, 0.55 * scaleW, 24),
      new THREE.MeshStandardMaterial({ color: "#2a3038", roughness: 0.9 }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.04;
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(0.45 * scaleW, 24),
      puddleMaterial(meta.color),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.05;
    root.add(rim, pool);
  } else if (kind === "pedestrian") {
    const cloth = new THREE.MeshPhysicalMaterial({
      color: meta.color,
      roughness: 0.75,
      sheen: 0.3,
      sheenColor: new THREE.Color(0xffffff),
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.75, 8, 12), cloth);
    body.position.y = 1.05;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xc4b8a8, roughness: 0.65 }),
    );
    head.position.y = 1.62;
    root.add(body, head);
  } else if (kind === "bike") {
    const frameMat = new THREE.MeshPhysicalMaterial({
      color: meta.color,
      roughness: 0.35,
      metalness: 0.4,
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 12, 32), tireMat);
    w1.rotation.x = Math.PI / 2;
    const w2 = w1.clone();
    w2.position.x = 0.58;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8), frameMat);
    bar.position.set(0.29, 0.35, 0);
    bar.rotation.z = Math.PI / 2;
    root.position.y = 0.35;
    root.add(w1, w2, bar);
  } else if (kind === "trash" || kind === "bag") {
    const bag = buildTrashBag3D(0.85 * scaleW);
    // Loose wrappers / cans around the bag so the street reads messy.
    for (let i = 0; i < 3; i++) {
      const scrap =
        i === 0
          ? buildCrushedCan3D(10 + i)
          : i === 1
            ? buildCrumpledWrapper3D(20 + i)
            : buildPlasticBottle3D(30 + i);
      scrap.scale.setScalar(0.55);
      scrap.position.set((i - 1) * 0.32, 0, 0.22 + i * 0.04);
      scrap.rotation.y = i * 0.7;
      root.add(scrap);
    }
    root.add(bag);
  } else if (kind === "debris" || kind === "street") {
    root.add(buildDebrisPile3D(kind === "street" ? 42 : 7, scaleW));
  } else if (kind === "drink") {
    root.add(buildDrinkCup3D(meta.color));
  } else if (kind === "grass") {
    root.add(buildMudClumps3D(meta.color, scaleW));
  } else if (kind === "gum") {
    const gum = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 8),
      new THREE.MeshPhysicalMaterial({
        color: meta.color,
        roughness: 0.2,
        metalness: 0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
      }),
    );
    gum.scale.y = 0.35;
    gum.position.y = 0.06;
    root.add(gum);
  } else {
    // Unknown / future kinds — still look like street mess, never a bare cube.
    const pile = buildDebrisPile3D(99, scaleW);
    pile.scale.setScalar(0.9 + scaleH * 0.1);
    root.add(pile);
  }

  setShadows(root);
  return root;
}

export function buildPowerUp3D(color: string): THREE.Group {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22, 1),
    new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.2,
      transmission: 0.35,
      thickness: 0.3,
      clearcoat: 1,
    }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.015, 8, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }),
  );
  ring.rotation.x = Math.PI / 2;
  const light = new THREE.PointLight(color, 0.6, 3);
  g.add(core, ring, light);
  return g;
}
