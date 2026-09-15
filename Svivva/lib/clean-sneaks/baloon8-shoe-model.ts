/**
 * Baloon8 car-shoe — thin API over the procedural 3D car model.
 * One volumetric car asset, mirrored for left/right runner pair.
 */
import * as THREE from "three";
import {
  BALOON8_DIMS,
  buildBaloon8Car,
  disposeBaloon8Car,
  type Baloon8CarBuild,
} from "./baloon8-car-model";
import { BALOON8_BLUEPRINT_URL } from "./baloon8-textures";

export { BALOON8_DIMS, BALOON8_BLUEPRINT_URL };

export const BALOON8_SCENE_SCALE = 0.42;
export const BALOON8_WALKER_SCALE = 0.42;
export const BALOON8_WALKER_SCALE_MOBILE = 0.36;
export const BALOON8_PAIR_SCALE = 0.26;
export const BALOON8_PAIR_SCALE_MOBILE = 0.34;
export const BALOON8_PAIR_SCALE_PORTRAIT = 0.31;

export type Baloon8WalkerShoe = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
  _build?: Baloon8CarBuild;
};

export type Baloon8ShoeModel = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  glowMeshes: THREE.Mesh[];
  dispose: () => void;
};

function scaledDim(value: number, scale: number): number {
  return value * scale;
}

function runnerScale(opts: { mobile?: boolean; portrait?: boolean; pair?: boolean }): number {
  const { mobile = false, portrait = false, pair = false } = opts;
  if (pair) {
    return portrait
      ? BALOON8_PAIR_SCALE_PORTRAIT
      : mobile
        ? BALOON8_PAIR_SCALE_MOBILE
        : BALOON8_PAIR_SCALE;
  }
  return mobile ? BALOON8_WALKER_SCALE_MOBILE : BALOON8_WALKER_SCALE;
}

function podBudgetFor(mobile: boolean, portrait: boolean, pair: boolean, cap: number): number {
  const base = mobile ? (portrait ? 320 : 420) : pair ? 700 : 900;
  return Math.min(cap, base);
}

function toWalkerShoe(build: Baloon8CarBuild): Baloon8WalkerShoe {
  return {
    root: build.root,
    bubbles: build.puffer,
    hullMat: build.hullMat,
    glowMeshes: build.glowMeshes,
    wheels: build.wheels,
    _build: build,
  };
}

export function ensureBaloon8RunnerVisible(shoe: Baloon8WalkerShoe, mobile: boolean): void {
  shoe.root.frustumCulled = false;
  if (shoe.bubbles) {
    shoe.bubbles.frustumCulled = false;
  }
  shoe.hullMat.emissive = new THREE.Color(0x142830);
  shoe.hullMat.emissiveIntensity = mobile ? 0.18 : 0.24;

  shoe.root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshPhysicalMaterial;
    if (mat.metalness !== undefined) {
      mat.envMapIntensity = mobile ? 1.65 : 1.85;
    }
  });

  for (const mesh of shoe.glowMeshes) {
    mesh.frustumCulled = false;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, mobile ? 1.15 : 1.35);
  }
}

/** Homepage / orbit viewer — full-scale procedural car. */
export function buildBaloon8Shoe(
  _blueprint?: THREE.Texture,
  _bubbleCount = 1200,
): Baloon8ShoeModel {
  const build = buildBaloon8Car({
    scale: BALOON8_SCENE_SCALE,
    mobile: false,
    podBudget: 1200,
  });
  build.root.position.y = scaledDim(0.02, BALOON8_SCENE_SCALE);

  return {
    root: build.root,
    bubbles: build.puffer,
    glowMeshes: build.glowMeshes,
    dispose: () => disposeBaloon8Car(build),
  };
}

/** Runner shoe — one procedural car, optionally mirrored for right foot. */
export function buildBaloon8RunnerShoe(
  _blueprint?: THREE.Texture,
  bubbleCount = 160,
  opts?: { mobile?: boolean; portrait?: boolean; pair?: boolean; mirror?: boolean },
): Baloon8WalkerShoe {
  const mobile = opts?.mobile ?? false;
  const portrait = opts?.portrait ?? false;
  const pair = opts?.pair ?? false;
  const scale = runnerScale({ mobile, portrait, pair });
  const perShoeCap = mobile ? (pair ? 480 : 600) : bubbleCount;
  const budget = podBudgetFor(mobile, portrait, pair, perShoeCap);

  const build = buildBaloon8Car({ scale, mobile, portrait, podBudget: budget });
  build.root.rotation.y = -Math.PI / 2;

  const mount = new THREE.Group();
  mount.add(build.root);
  mount.position.y = scaledDim(0.04, scale);
  mount.frustumCulled = false;
  if (opts?.mirror) {
    mount.scale.x = -1;
  }

  const shoe = toWalkerShoe(build);
  shoe.root = mount;
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
