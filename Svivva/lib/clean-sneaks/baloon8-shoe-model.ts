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

export const BALOON8_HERO_REFERENCE_URL = "/assets/clean-sneaks/baloon8-hero-reference.jpg";

export const BALOON8_SCENE_SCALE = 0.42;
export const BALOON8_WALKER_SCALE = 0.42;
export const BALOON8_WALKER_SCALE_MOBILE = 0.36;
export const BALOON8_PAIR_SCALE = 0.26;
export const BALOON8_PAIR_SCALE_MOBILE = 0.34;
export const BALOON8_PAIR_SCALE_PORTRAIT = 0.31;

const IRIDESCENCE = [0x1a6650, 0x2a8090, 0x3a5080, 0x5a3888, 0x2a9878, 0x4cc9c0];

function scaledDim(value: number, scale = BALOON8_SCENE_SCALE): number {
  return value * scale;
}

function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Shared abalone PBR — lets the user's mockup art read through unchanged. */
function abalonePanelMaterial(
  map: THREE.Texture,
  alphaMap?: THREE.Texture,
  glow?: { emissive: number; intensity: number },
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map,
    alphaMap,
    transparent: true,
    alphaTest: alphaMap ? 0.08 : 0.04,
    metalness: 0.52,
    roughness: 0.22,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
    iridescence: 0.55,
    iridescenceIOR: 1.33,
    iridescenceThicknessRange: [120, 820],
    envMapIntensity: 1.65,
    side: THREE.DoubleSide,
    depthWrite: true,
    emissive: new THREE.Color(glow?.emissive ?? 0x061018),
    emissiveIntensity: glow?.intensity ?? 0.08,
  });
}

function legacyPanel(
  blueprint: THREE.Texture,
  quadrant: Baloon8BlueprintQuadrant,
  w: number,
  h: number,
): THREE.Mesh {
  const tex = cropBlueprintTexture(blueprint, quadrant);
  const mat = abalonePanelMaterial(tex);
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
  const mat = abalonePanelMaterial(prep.map, prep.alphaMap, glow);
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

function createBubbleInstances(
  width: number,
  height: number,
  depth: number,
  count: number,
  scaleMul = 1,
  overlayOpacity = 0.32,
): THREE.InstancedMesh | null {
  if (count <= 0) return null;
  const bubbleGeo = new THREE.SphereGeometry(0.018 * scaleMul, 6, 6);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.96,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 1,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [100, 900],
    envMapIntensity: 1.75,
    transparent: true,
    opacity: overlayOpacity,
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

    const s = 0.55 + Math.random() * 0.75;
    const push = 0.035 * scaleMul * s;
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

export type Baloon8ReferenceHero = {
  root: THREE.Group;
  dispose: () => void;
};

/** Pixel-exact hero reference on a studio plane (matches baloon8-hero-reference.jpg). */
export function buildBaloon8ReferenceHero(heroTexture: THREE.Texture): Baloon8ReferenceHero {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const img = heroTexture.image as HTMLImageElement | HTMLCanvasElement;
  const iw = "naturalWidth" in img && img.naturalWidth ? img.naturalWidth : img.width;
  const ih = "naturalHeight" in img && img.naturalHeight ? img.naturalHeight : img.height;
  const aspect = iw / ih;
  const width = 2.65;
  const height = width / aspect;

  const car = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: heroTexture,
      toneMapped: false,
      depthWrite: true,
    }),
  );
  car.position.y = height * 0.38;
  root.add(car);
  disposables.push(car.geometry, car.material);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.72, width * 0.14),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  root.add(shadow);
  disposables.push(shadow.geometry, shadow.material);

  root.frustumCulled = false;
  return {
    root,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

function assembleFromBlueprint(
  blueprint: THREE.Texture,
  bubbleCount: number,
  scale = BALOON8_SCENE_SCALE,
  opts?: { legacyPanels?: boolean; mobile?: boolean; bubbleOverlay?: number; authentic?: boolean },
): Baloon8ShoeCore {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];
  const authentic = opts?.authentic ?? true;

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
    emissive: 0x28c060,
    intensity: 0.45,
  });
  front.position.set(L / 2 + 0.003, H / 2, 0);
  front.rotation.y = Math.PI / 2;
  body.add(front);

  const rear = panelForQuadrant(blueprint, prepared?.rear ?? null, "rear", W, H, {
    emissive: 0x1a4030,
    intensity: 0.18,
  });
  rear.position.set(-L / 2 - 0.003, H / 2, 0);
  rear.rotation.y = -Math.PI / 2;
  body.add(rear);

  const top = panelForQuadrant(blueprint, prepared?.top ?? null, "top", L, W);
  top.position.set(0, H + 0.003, 0);
  top.rotation.x = -Math.PI / 2;
  body.add(top);

  root.add(body);

  const mobile = opts?.mobile ?? false;
  const overlayOpacity = authentic ? 0 : (opts?.bubbleOverlay ?? (mobile ? 0.28 : 0.38));
  const effectiveBubbleCount = authentic ? 0 : bubbleCount;

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a6080,
    metalness: 0.82,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.88,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [150, 900],
    envMapIntensity: 1.5,
  });
  disposables.push(hullMat);

  const bubbles = createBubbleInstances(L, H, W, effectiveBubbleCount, scale, overlayOpacity);
  if (bubbles) {
    root.add(bubbles);
    disposables.push(bubbles.geometry, bubbles.material as THREE.Material);
  }

  const wheels: THREE.Group[] = [];

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = false;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if ((mat.emissiveIntensity ?? 0) > 0.35) glowMeshes.push(obj);
    }
  });

  return { root, bubbles, hullMat, glowMeshes, wheels, disposables };
}

export function buildBaloon8Shoe(blueprint: THREE.Texture, bubbleCount = 0): Baloon8ShoeModel {
  const core = assembleFromBlueprint(blueprint, bubbleCount, BALOON8_SCENE_SCALE, {
    authentic: true,
  });
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
    bubbleMat.opacity = mobile ? 0.28 : 0.38;
  }

  shoe.hullMat.emissive = new THREE.Color(0x142830);
  shoe.hullMat.emissiveIntensity = mobile ? 0.18 : 0.22;

  shoe.root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshPhysicalMaterial;
    if (mat.map) {
      mat.envMapIntensity = mobile ? 1.65 : 1.75;
      mat.metalness = Math.min(mat.metalness ?? 0.5, 0.55);
      mat.iridescence = Math.min(mat.iridescence ?? 0.5, 0.58);
    }
    if (mobile && mat.alphaTest !== undefined) {
      mat.alphaTest = 0.06;
    }
  });

  for (const mesh of shoe.glowMeshes) {
    mesh.frustumCulled = false;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, mobile ? 1.05 : 0.95);
  }
}

export function buildBaloon8RunnerShoe(
  blueprint: THREE.Texture,
  bubbleCount = 0,
  opts?: { mobile?: boolean; portrait?: boolean; pair?: boolean; mirror?: boolean },
): Baloon8WalkerShoe {
  const mobile = opts?.mobile ?? false;
  const portrait = opts?.portrait ?? false;
  const pair = opts?.pair ?? false;
  const scale = pair
    ? portrait
      ? BALOON8_PAIR_SCALE_PORTRAIT
      : mobile
        ? BALOON8_PAIR_SCALE_MOBILE
        : BALOON8_PAIR_SCALE
    : mobile
      ? BALOON8_WALKER_SCALE_MOBILE
      : BALOON8_WALKER_SCALE;

  const core = assembleFromBlueprint(blueprint, bubbleCount, scale, {
    mobile,
    authentic: true,
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
  bubbleCount = 0,
): Baloon8WalkerShoe {
  return buildBaloon8RunnerShoe(blueprint, bubbleCount);
}

export { BALOON8_BLUEPRINT_URL };
