import * as THREE from "three";
import { OBSTACLE_META } from "./constants";
import type { ObstacleKind } from "./types";
import { wetAsphaltMaterial } from "./run-textures";

function puddleMaterial(color: string): THREE.MeshPhysicalMaterial {
  const mat = wetAsphaltMaterial().clone();
  mat.color = new THREE.Color(color);
  mat.roughness = 0.15;
  mat.metalness = 0.25;
  mat.clearcoat = 0.9;
  mat.transmission = 0.08;
  return mat;
}

/** Detailed 3D obstacle meshes with PBR materials. */
export function buildObstacle3D(kind: ObstacleKind): THREE.Object3D {
  const meta = OBSTACLE_META[kind];
  const scaleW = meta.w / 40;
  const scaleH = meta.h / 20;
  const root = new THREE.Group();

  const setShadows = (obj: THREE.Object3D) => {
    obj.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  };

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
    const cloth = new THREE.MeshPhysicalMaterial({ color: meta.color, roughness: 0.75, sheen: 0.3, sheenColor: new THREE.Color(0xffffff) });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.75, 8, 12), cloth);
    body.position.y = 1.05;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xc4b8a8, roughness: 0.65 }),
    );
    head.position.y = 1.62;
    root.add(body, head);
  } else if (kind === "bike") {
    const frameMat = new THREE.MeshPhysicalMaterial({ color: meta.color, roughness: 0.35, metalness: 0.4 });
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
    const bagMat = new THREE.MeshPhysicalMaterial({
      color: meta.color,
      roughness: 0.85,
      metalness: 0.05,
      clearcoat: 0.1,
    });
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.35 * scaleW, 12, 10), bagMat);
    bag.scale.set(1, 0.85 + scaleH * 0.2, 0.9);
    bag.position.y = 0.28 * scaleH;
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.02, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
    );
    tie.position.y = 0.5 * scaleH;
    tie.rotation.x = Math.PI / 2;
    root.add(bag, tie);
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
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.75 * scaleW, 0.55 * scaleH, 0.65 * scaleW),
      new THREE.MeshPhysicalMaterial({
        color: meta.color,
        roughness: 0.7,
        metalness: 0.05,
      }),
    );
    mesh.position.y = 0.28 * scaleH;
    root.add(mesh);
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
