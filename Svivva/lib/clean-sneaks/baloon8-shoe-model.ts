import * as THREE from "three";
import {
  BALOON8_BLUEPRINT_URL,
  cropBlueprintTexture,
  prepareBlueprint,
  type Baloon8BlueprintQuadrant,
  type PreparedQuadrant,
} from "./baloon8-textures";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

export const BALOON8_SCENE_SCALE = 0.42;
export const BALOON8_WALKER_SCALE = 0.42;
export const BALOON8_WALKER_SCALE_MOBILE = 0.36;
/** Smaller per-foot scale so a left/right pair fits the lane. */
export const BALOON8_PAIR_SCALE = 0.26;
export const BALOON8_PAIR_SCALE_MOBILE = 0.3;

const IRIDESCENCE = [0x2a9d8f, 0x5b8da8, 0x7b4397, 0x3d9970, 0x4cc9c0];

function scaledDim(value: number, scale = BALOON8_SCENE_SCALE): number {
  return value * scale;
}

function legacyPanel(
  blueprint: THREE.Texture,
  quadrant: Baloon8BlueprintQuadrant,
  w: number,
  h: number,
): THREE.Mesh {
  const tex = cropBlueprintTexture(blueprint, quadrant);
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.04,
    metalness: 0.3,
    roughness: 0.42,
    clearcoat: 0.5,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x0a2030),
    emissiveIntensity: 0.18,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 2;
  return mesh;
}

function preparedPanel(
  prep: PreparedQuadrant,
  w: number,
  h: number,
  glow?: { emissive: number; intensity: number },
): THREE.Mesh {
  const mat = new THREE.MeshPhysicalMaterial({
    map: prep.map,
    alphaMap: prep.alphaMap,
    transparent: true,
    alphaTest: 0.12,
    metalness: 0.28,
    roughness: 0.4,
    clearcoat: 0.55,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
    depthWrite: true,
    emissive: new THREE.Color(glow?.emissive ?? 0x0a2030),
    emissiveIntensity: glow?.intensity ?? 0.22,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 2;
  return mesh;
}

function panelForQuadrant(
  blueprint: THREE.Texture,
  prepared: PreparedQuadrant | null,
  quadrant: Baloon8BlueprintQuadrant,
  w: number,
  h: number,
  glow?: { emissive: number; intensity: number },
): THREE.Mesh {
  if (prepared) {
    try {
      return preparedPanel(prepared, w, h, glow);
    } catch {
      /* fall through */
    }
  }
  return legacyPanel(blueprint, quadrant, w, h);
}

/** Soft iridescent rim — low opacity so blueprint art stays visible. */
function createBubbleInstances(
  width: number,
  height: number,
  depth: number,
  count: number,
  scaleMul = 1,
): THREE.InstancedMesh | null {
  if (count <= 0) return null;
  const bubbleGeo = new THREE.SphereGeometry(0.02 * scaleMul, 6, 6);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.15,
    iridescence: 1,
    iridescenceIOR: 1.32,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  for (let i = 0; i < count; i++) {
    const face = i % 6;
    let x = 0;
    let y = 0;
    let z = 0;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    const u = Math.random();
    const v = Math.random();

    switch (face) {
      case 0:
        x = -hw + u * width;
        y = v * height;
        z = hd;
        nz = 1;
        break;
      case 1:
        x = hw - u * width;
        y = v * height;
        z = -hd;
        nz = -1;
        break;
      case 2:
        x = -hw + u * width;
        y = hh;
        z = -hd + v * depth;
        ny = 1;
        break;
      case 3:
        x = -hw + u * width;
        y = 0;
        z = -hd + v * depth;
        ny = -1;
        break;
      case 4:
        x = -hw;
        y = v * height;
        z = -hd + u * depth;
        nx = -1;
        break;
      default:
        x = hw;
        y = v * height;
        z = -hd + u * depth;
        nx = 1;
        break;
    }

    const s = 0.5 + Math.random() * 0.65;
    const push = 0.028 * scaleMul * s;
    dummy.position.set(x + nx * push, y + ny * push + hh * 0.5, z + nz * push);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHex(IRIDESCENCE[i % IRIDESCENCE.length]!);
    mesh.setColorAt(i, color);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.renderOrder = 3;
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

function assembleFromBlueprint(
  blueprint: THREE.Texture,
  bubbleCount: number,
  scale = BALOON8_SCENE_SCALE,
  opts?: { legacyPanels?: boolean },
): Baloon8ShoeCore {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];

  let prepared: ReturnType<typeof prepareBlueprint> | null = null;
  if (!opts?.legacyPanels) {
    try {
      const img = blueprint.image as CanvasImageSource & { width?: number };
      if (img && ("naturalWidth" in img ? img.naturalWidth : img.width)) {
        prepared = prepareBlueprint(blueprint);
      }
    } catch (err) {
      console.warn("[Baloon8] prepareBlueprint failed, using UV crops", err);
    }
  }

  const L = scaledDim(BALOON8_DIMS.length, scale);
  const W = scaledDim(BALOON8_DIMS.width, scale);
  const H = scaledDim(BALOON8_DIMS.height, scale);

  const body = new THREE.Group();

  const side = panelForQuadrant(blueprint, prepared?.side ?? null, "side", L, H);
  side.position.set(0, H / 2, W / 2 + 0.003);
  body.add(side);

  const sideBack = panelForQuadrant(blueprint, prepared?.side ?? null, "side", L, H);
  sideBack.position.set(0, H / 2, -W / 2 - 0.003);
  sideBack.rotation.y = Math.PI;
  body.add(sideBack);

  const front = panelForQuadrant(blueprint, prepared?.front ?? null, "front", W, H, {
    emissive: 0x1a5030,
    intensity: 0.35,
  });
  front.position.set(L / 2 + 0.003, H / 2, 0);
  front.rotation.y = Math.PI / 2;
  body.add(front);

  const rear = panelForQuadrant(blueprint, prepared?.rear ?? null, "rear", W, H);
  rear.position.set(-L / 2 - 0.003, H / 2, 0);
  rear.rotation.y = -Math.PI / 2;
  body.add(rear);

  const top = panelForQuadrant(blueprint, prepared?.top ?? null, "top", L, W);
  top.position.set(0, H + 0.003, 0);
  top.rotation.x = -Math.PI / 2;
  body.add(top);

  root.add(body);

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a6080,
    metalness: 0.55,
    roughness: 0.32,
    iridescence: 0.75,
    iridescenceIOR: 1.28,
    envMapIntensity: 1.2,
  });
  disposables.push(hullMat);

  const bubbles = createBubbleInstances(L, H, W, bubbleCount, scale);
  if (bubbles) {
    root.add(bubbles);
    disposables.push(bubbles.geometry, bubbles.material as THREE.Material);
  }

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = false;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if ((mat.emissiveIntensity ?? 0) > 0.25) glowMeshes.push(obj);
    }
  });

  return { root, bubbles, hullMat, glowMeshes, wheels: [], disposables };
}

export function buildBaloon8Shoe(blueprint: THREE.Texture, bubbleCount = 280): Baloon8ShoeModel {
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

export function ensureBaloon8RunnerVisible(shoe: Baloon8WalkerShoe, mobile: boolean): void {
  shoe.root.frustumCulled = false;
  if (shoe.bubbles) {
    shoe.bubbles.frustumCulled = false;
    const bubbleMat = shoe.bubbles.material as THREE.MeshPhysicalMaterial;
    bubbleMat.opacity = mobile ? 0.28 : 0.3;
  }

  shoe.hullMat.emissive = new THREE.Color(0x1a3040);
  shoe.hullMat.emissiveIntensity = mobile ? 0.65 : 0.3;

  shoe.root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshPhysicalMaterial;
    if (!mat.map) return;
    mat.envMapIntensity = mobile ? 1.55 : 1.45;
    mat.emissive = mat.emissive ?? new THREE.Color(0x0a1820);
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, mobile ? 0.55 : 0.22);
    if (mobile) {
      mat.alphaTest = 0.02;
    }
  });

  for (const mesh of shoe.glowMeshes) {
    mesh.frustumCulled = false;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, mobile ? 1.35 : 1);
  }
}

export function buildBaloon8RunnerShoe(
  blueprint: THREE.Texture,
  bubbleCount = 160,
  opts?: { mobile?: boolean; pair?: boolean; mirror?: boolean },
): Baloon8WalkerShoe {
  const mobile = opts?.mobile ?? false;
  const pair = opts?.pair ?? false;
  const scale = pair
    ? mobile
      ? BALOON8_PAIR_SCALE_MOBILE
      : BALOON8_PAIR_SCALE
    : mobile
      ? BALOON8_WALKER_SCALE_MOBILE
      : BALOON8_WALKER_SCALE;
  const perShoeCap = mobile ? (pair ? 70 : 100) : bubbleCount;
  const count = Math.min(bubbleCount, perShoeCap);
  const core = assembleFromBlueprint(blueprint, count, scale, {
    legacyPanels: mobile,
  });
  core.root.rotation.y = -Math.PI / 2;

  const mount = new THREE.Group();
  mount.add(core.root);
  mount.position.y = scaledDim(0.04, scale);
  mount.frustumCulled = false;
  if (opts?.mirror) {
    mount.scale.x = -1;
  }

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
  bubbleCount = 160,
): Baloon8WalkerShoe {
  return buildBaloon8RunnerShoe(blueprint, bubbleCount);
}

export { BALOON8_BLUEPRINT_URL };
