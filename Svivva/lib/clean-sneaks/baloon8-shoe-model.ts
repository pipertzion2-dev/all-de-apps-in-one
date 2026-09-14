import * as THREE from "three";
import {
  BALOON8_BLUEPRINT_URL,
  prepareBlueprint,
  type PreparedBlueprint,
  type PreparedQuadrant,
} from "./baloon8-textures";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

export const BALOON8_SCENE_SCALE = 0.42;
/** Runner fill-frame scale (~1.6 m long). Homepage viewer uses BALOON8_SCENE_SCALE (0.42). */
export const BALOON8_WALKER_SCALE = 0.36;
export const BALOON8_WALKER_SCALE_MOBILE = 0.32;

const IRIDESCENCE = [0x2a9d8f, 0x5b8da8, 0x7b4397, 0x3d9970, 0x4cc9c0];

function scaledDim(value: number, scale = BALOON8_SCENE_SCALE): number {
  return value * scale;
}

/** Side-profile outline traced from the orthographic mockup (length × height). */
function buildSideProfileShape(L: number, H: number): THREE.Shape {
  const x = (t: number) => t * L;
  const y = (t: number) => t * H;
  const shape = new THREE.Shape();
  shape.moveTo(x(0), y(0.07));
  shape.lineTo(x(0.04), y(0.1));
  shape.lineTo(x(0.14), y(0.11));
  shape.quadraticCurveTo(x(0.22), y(0.14), x(0.3), y(0.38));
  shape.lineTo(x(0.42), y(0.36));
  shape.quadraticCurveTo(x(0.55), y(0.34), x(0.68), y(0.72));
  shape.quadraticCurveTo(x(0.78), y(0.92), x(0.9), y(1));
  shape.lineTo(x(0.98), y(0.94));
  shape.lineTo(x(1), y(0.12));
  shape.lineTo(x(0.96), y(0.08));
  shape.lineTo(x(0), y(0.07));
  return shape;
}

function alphaPanel(
  prep: PreparedQuadrant,
  width: number,
  height: number,
  opts?: { emissive?: number; emissiveIntensity?: number },
): THREE.Mesh {
  const mat = new THREE.MeshPhysicalMaterial({
    map: prep.map,
    alphaMap: prep.alphaMap,
    transparent: true,
    alphaTest: 0.45,
    metalness: 0.25,
    roughness: 0.38,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.15,
    side: THREE.DoubleSide,
    depthWrite: true,
    ...(opts?.emissive != null
      ? { emissive: new THREE.Color(opts.emissive), emissiveIntensity: opts.emissiveIntensity ?? 0.35 }
      : {}),
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}

function buildInteriorVolume(L: number, H: number, W: number): THREE.Mesh {
  const shape = buildSideProfileShape(L, H);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: W * 0.92,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 24,
  });
  geo.translate(0, 0, (-W * 0.92) / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    metalness: 0.15,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(-L / 2, 0, 0);
  return mesh;
}

function buildFootwellCollar(L: number, W: number, H: number): THREE.Mesh {
  const geo = new THREE.TorusGeometry(W * 0.22, W * 0.04, 8, 32, Math.PI * 1.15);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(L * 0.02, H * 0.88, 0);
  return mesh;
}

function buildSole(L: number, W: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(L * 0.98, 0.04, W * 0.95);
  const mat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.95, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.02;
  return mesh;
}

/** Optional rim shimmer — blueprint already includes bubble texture; keep count low. */
function createBubbleRim(L: number, H: number, W: number, count: number, scale: number): THREE.InstancedMesh | null {
  if (count <= 0) return null;
  const bubbleGeo = new THREE.SphereGeometry(0.018 * scale, 6, 6);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.15,
    iridescence: 1,
    iridescenceIOR: 1.3,
    transparent: true,
    opacity: 0.35,
  });
  const mesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const edge = i % 4;
    const t = Math.random();
    let px = 0;
    let py = H * (0.15 + Math.random() * 0.75);
    let pz = 0;
    if (edge === 0) {
      px = (t - 0.5) * L;
      pz = W / 2;
    } else if (edge === 1) {
      px = (t - 0.5) * L;
      pz = -W / 2;
    } else if (edge === 2) {
      px = L / 2;
      pz = (t - 0.5) * W;
    } else {
      px = -L / 2;
      pz = (t - 0.5) * W;
    }
    dummy.position.set(px, py, pz);
    dummy.scale.setScalar(0.4 + Math.random() * 0.5);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHex(IRIDESCENCE[i % IRIDESCENCE.length]!);
    mesh.setColorAt(i, color);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

export type Baloon8ShoeCore = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
  disposables: Array<{ dispose: () => void }>;
};

export type Baloon8WalkerShoe = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
};

export type Baloon8ShoeModel = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  glowMeshes: THREE.Mesh[];
  dispose: () => void;
};

/**
 * Assemble a volumetric sneaker from the four orthographic blueprint views.
 * Strategy: alpha-cut trimmed panels on each face + extruded side profile for depth.
 * Wheels/bubbles come from the artwork — no duplicate 3D wheels on top.
 */
function assembleFromBlueprint(
  blueprint: THREE.Texture,
  bubbleCount: number,
  scale = BALOON8_SCENE_SCALE,
): Baloon8ShoeCore {
  const prepared = prepareBlueprint(blueprint);
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];

  const L = scaledDim(BALOON8_DIMS.length, scale);
  const W = scaledDim(BALOON8_DIMS.width, scale);
  const H = scaledDim(BALOON8_DIMS.height, scale);

  const body = new THREE.Group();
  body.position.set(0, 0, 0);

  const sideH = H;
  const sideW = L;
  const sidePanel = alphaPanel(prepared.side, sideW, sideH);
  sidePanel.position.set(0, sideH / 2, W / 2 + 0.004);
  body.add(sidePanel);

  const sidePanelBack = alphaPanel(prepared.side, sideW, sideH);
  sidePanelBack.position.set(0, sideH / 2, -W / 2 - 0.004);
  sidePanelBack.rotation.y = Math.PI;
  body.add(sidePanelBack);

  const frontPanel = alphaPanel(prepared.front, W, H, {
    emissive: 0x1a5030,
    emissiveIntensity: 0.25,
  });
  frontPanel.position.set(L / 2 + 0.004, H / 2, 0);
  frontPanel.rotation.y = Math.PI / 2;
  body.add(frontPanel);

  const rearPanel = alphaPanel(prepared.rear, W, H);
  rearPanel.position.set(-L / 2 - 0.004, H / 2, 0);
  rearPanel.rotation.y = -Math.PI / 2;
  body.add(rearPanel);

  const topPanel = alphaPanel(prepared.top, L, W);
  topPanel.position.set(0, H + 0.004, 0);
  topPanel.rotation.x = -Math.PI / 2;
  body.add(topPanel);

  body.add(buildInteriorVolume(L, H, W));
  body.add(buildFootwellCollar(L, W, H));
  body.add(buildSole(L, W));

  root.add(body);

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a6080,
    metalness: 0.5,
    roughness: 0.35,
    envMapIntensity: 1,
  });
  disposables.push(hullMat);

  const bubbles = createBubbleRim(L, H, W, bubbleCount, scale);
  if (bubbles) {
    root.add(bubbles);
    disposables.push(bubbles.geometry, bubbles.material as THREE.Material);
  }

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity && mat.emissiveIntensity > 0.2) glowMeshes.push(obj);
    }
  });

  return { root, bubbles, hullMat, glowMeshes, wheels: [], disposables };
}

/** Homepage / orbit viewer — user's four-view mockup as a 3D sneaker. */
export function buildBaloon8Shoe(blueprint: THREE.Texture, bubbleCount = 0): Baloon8ShoeModel {
  const core = assembleFromBlueprint(blueprint, bubbleCount);
  core.root.position.y = scaledDim(0.02);

  return {
    root: core.root,
    bubbles: core.bubbles,
    glowMeshes: core.glowMeshes,
    dispose: () => {
      core.disposables.forEach((d) => d.dispose());
      core.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            const std = m as THREE.MeshStandardMaterial;
            if (std.map && std.map !== blueprint) std.map.dispose();
            if (std.alphaMap) std.alphaMap.dispose();
            m.dispose();
          });
          obj.geometry.dispose();
        }
      });
    },
  };
}

/** Keep blueprint panels readable on dark asphalt (especially mobile). */
export function ensureBaloon8RunnerVisible(shoe: Baloon8WalkerShoe, mobile: boolean): void {
  shoe.root.frustumCulled = false;
  if (shoe.bubbles) shoe.bubbles.frustumCulled = false;

  shoe.hullMat.emissive = new THREE.Color(0x1a3040);
  shoe.hullMat.emissiveIntensity = mobile ? 0.35 : 0.2;

  shoe.root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshPhysicalMaterial;
    if (!mat.map) return;
    mat.envMapIntensity = mobile ? 1.05 : 1.25;
    mat.emissive = mat.emissive ?? new THREE.Color(0x0a1820);
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, mobile ? 0.2 : 0.12);
  });

  for (const mesh of shoe.glowMeshes) {
    mesh.frustumCulled = false;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 0.85);
  }
}

/** In-game Temple Run player — same Baloon8 blueprint, scaled for sideline camera. */
export function buildBaloon8RunnerShoe(
  blueprint: THREE.Texture,
  bubbleCount = 0,
  opts?: { mobile?: boolean },
): Baloon8WalkerShoe {
  const mobile = opts?.mobile ?? false;
  const scale = mobile ? BALOON8_WALKER_SCALE_MOBILE : BALOON8_WALKER_SCALE;
  const core = assembleFromBlueprint(blueprint, mobile ? Math.min(bubbleCount, 40) : bubbleCount, scale);
  core.root.rotation.y = -Math.PI / 2;

  const mount = new THREE.Group();
  mount.add(core.root);
  mount.position.y = scaledDim(0.02, scale);
  mount.frustumCulled = false;

  const shoe: Baloon8WalkerShoe = {
    root: mount,
    bubbles: core.bubbles,
    hullMat: core.hullMat,
    glowMeshes: core.glowMeshes,
    wheels: core.wheels,
  };
  ensureBaloon8RunnerVisible(shoe, mobile);
  return shoe;
}

/** @deprecated */
export function buildBaloon8WalkerShoe(
  blueprint: THREE.Texture,
  _side: -1 | 1,
  bubbleCount = 0,
): Baloon8WalkerShoe {
  return buildBaloon8RunnerShoe(blueprint, bubbleCount);
}

export { BALOON8_BLUEPRINT_URL, type PreparedBlueprint };
