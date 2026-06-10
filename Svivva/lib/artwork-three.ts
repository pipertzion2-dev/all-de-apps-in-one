import * as THREE from "three";
import type { ArtworkCrop, FaceElement, SceneElement } from "@/lib/artwork-atlas";

/** Clone a base texture to show only a normalized crop (top-left origin). */
export function regionTexture(base: THREE.Texture, crop: ArtworkCrop): THREE.Texture {
  const tex = base.clone();
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(crop.w, crop.h);
  tex.offset.set(crop.u, 1 - crop.v - crop.h);
  tex.needsUpdate = true;
  return tex;
}

export function loadArtworkTexture(src: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

export function createRegionPlane(
  base: THREE.Texture,
  crop: ArtworkCrop,
  width: number,
  height: number,
  opacity = 0.92,
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: regionTexture(base, crop),
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}

export function createRegionSprite(
  base: THREE.Texture,
  crop: ArtworkCrop,
  scale: number,
  opacity = 0.88,
): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: regionTexture(base, crop),
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale * crop.w, scale * crop.h, 1);
  return sprite;
}

export type AnimatedFloater = {
  object: THREE.Object3D;
  ox: number;
  oy: number;
  oz: number;
  parallax: number;
  phase: number;
  rotZ: number;
  bob: number;
};

export function addSceneFloaters(
  scene: THREE.Scene,
  base: THREE.Texture,
  elements: SceneElement[],
): AnimatedFloater[] {
  const floaters: AnimatedFloater[] = [];
  for (const el of elements) {
    const sprite = createRegionSprite(base, el, el.scale);
    sprite.position.set(el.x, el.y, el.z);
    scene.add(sprite);
    floaters.push({
      object: sprite,
      ox: el.x,
      oy: el.y,
      oz: el.z,
      parallax: el.parallax ?? 0.8,
      phase: el.phase ?? 0,
      rotZ: el.rotZ ?? 0,
      bob: 0.12 + (el.parallax ?? 0.8) * 0.08,
    });
  }
  return floaters;
}

export function tickFloaters(
  floaters: AnimatedFloater[],
  mouse: { x: number; y: number },
  t: number,
) {
  floaters.forEach((f) => {
    const sway = Math.sin(t * 0.9 + f.phase) * f.bob;
    f.object.position.x = f.ox + mouse.x * f.parallax * 2.2 + sway * 0.3;
    f.object.position.y = f.oy + mouse.y * f.parallax * 1.6 + Math.cos(t * 0.7 + f.phase) * f.bob;
    f.object.position.z = f.oz + Math.sin(t * 0.5 + f.phase) * 0.15;
    f.object.rotation.z = f.rotZ + Math.sin(t * 0.4 + f.phase) * 0.06;
    const mat = (f.object as THREE.Sprite).material as THREE.SpriteMaterial;
    mat.opacity = 0.72 + 0.12 * Math.sin(t * 1.1 + f.phase) + Math.abs(mouse.x) * 0.06;
  });
}

export function orientPlaneToNormal(mesh: THREE.Mesh, norm: THREE.Vector3) {
  if (norm.x > 0.5) mesh.rotation.y = Math.PI / 2;
  else if (norm.x < -0.5) mesh.rotation.y = -Math.PI / 2;
  else if (norm.y > 0.5) mesh.rotation.x = -Math.PI / 2;
  else if (norm.y < -0.5) mesh.rotation.x = Math.PI / 2;
}

export function placeOnFace(
  mesh: THREE.Object3D,
  norm: THREE.Vector3,
  su: number,
  sv: number,
  offset: number,
) {
  let axU: THREE.Vector3;
  let axV: THREE.Vector3;
  if (Math.abs(norm.x) > 0.5) {
    axU = new THREE.Vector3(0, 1, 0);
    axV = new THREE.Vector3(0, 0, 1);
  } else if (Math.abs(norm.y) > 0.5) {
    axU = new THREE.Vector3(1, 0, 0);
    axV = new THREE.Vector3(0, 0, 1);
  } else {
    axU = new THREE.Vector3(0, 1, 0);
    axV = new THREE.Vector3(1, 0, 0);
  }
  mesh.position
    .copy(norm)
    .multiplyScalar(1.0 + offset)
    .addScaledVector(axU, su)
    .addScaledVector(axV, sv);
}
