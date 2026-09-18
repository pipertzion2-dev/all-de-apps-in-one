import * as THREE from "three";
import type { CleanPathOption } from "./sneak-vision";
import { laneWorldX } from "./run-engine";

const PRINTS_PER_PATH = 5;

export type CleanPathFootprintPool = {
  group: THREE.Group;
  /** Shared geometry — one PlaneGeometry for all prints. */
  geometry: THREE.PlaneGeometry;
  meshes: THREE.Mesh[];
};

function pathColor(kind: CleanPathOption["kind"]): number {
  if (kind === "safe") return 0x3d9b5f;
  if (kind === "fast") return 0xd4782a;
  return 0x7ec8d9;
}

function makePrint(geometry: THREE.PlaneGeometry): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x3d9b5f,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  mesh.frustumCulled = false;
  return mesh;
}

/** Pool of reusable path-suggestion footprints (no per-frame alloc). */
export function createCleanPathFootprintPool(maxPaths = 3): CleanPathFootprintPool {
  const group = new THREE.Group();
  group.name = "clean-path-footprints";
  const geometry = new THREE.PlaneGeometry(0.22, 0.38);
  const meshes: THREE.Mesh[] = [];
  const capacity = maxPaths * PRINTS_PER_PATH;
  for (let i = 0; i < capacity; i++) {
    const mesh = makePrint(geometry);
    group.add(mesh);
    meshes.push(mesh);
  }
  return { group, geometry, meshes };
}

/**
 * Update pooled footprints in place. Never calls Group.clear() or allocates
 * new geometries/materials — the previous per-frame recreate froze longer runs.
 */
export function syncCleanPathFootprints(
  pool: CleanPathFootprintPool,
  paths: CleanPathOption[] | null | undefined,
  now: number,
  pathsUntil: number,
): void {
  const active = Boolean(paths?.length && now < pathsUntil);
  let slot = 0;

  if (active && paths) {
    for (const p of paths) {
      const color = pathColor(p.kind);
      for (let i = 0; i < PRINTS_PER_PATH; i++) {
        const mesh = pool.meshes[slot++];
        if (!mesh) break;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(color);
        mat.opacity = 0.35 - i * 0.05;
        mesh.position.set(laneWorldX(p.lane) + (i % 2 === 0 ? -0.12 : 0.12), 0.05, -4 - i * 2.2);
        mesh.visible = true;
      }
    }
  }

  for (; slot < pool.meshes.length; slot++) {
    pool.meshes[slot]!.visible = false;
  }
}

export function disposeCleanPathFootprintPool(pool: CleanPathFootprintPool): void {
  for (const mesh of pool.meshes) {
    (mesh.material as THREE.Material).dispose();
  }
  pool.geometry.dispose();
  pool.meshes.length = 0;
  pool.group.clear();
}
