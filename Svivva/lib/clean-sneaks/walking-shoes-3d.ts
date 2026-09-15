import * as THREE from "three";
import { loadBaloon8HeroReferenceTexture, prepareSneakerThumbnail } from "./baloon8-textures";

export type WalkingShoes3D = {
  root: THREE.Group;
  shoePivot: THREE.Group;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
  leftMat: THREE.SpriteMaterial | null;
  rightMat: THREE.SpriteMaterial | null;
  shieldRing: THREE.Mesh;
  shieldGlow: THREE.PointLight;
  dustEmitter: THREE.Group;
};

let runnerTexture: THREE.Texture | null = null;

/** Preload the official sneaker thumbnail used as the runner billboards. */
export function preloadBaloon8RunnerShoe(): Promise<THREE.Texture | null> {
  return loadBaloon8HeroReferenceTexture()
    .then((tex) => {
      runnerTexture = tex;
      return tex;
    })
    .catch((err) => {
      console.warn("[walking-shoes-3d] thumbnail preload failed", err);
      runnerTexture = null;
      return null;
    });
}

/** Rotate canvas −90° so a rightward toe becomes an upward (down-the-road) toe. */
function rotateCanvasToeForward(src: HTMLCanvasElement): HTMLCanvasElement {
  const dst = document.createElement("canvas");
  dst.width = src.height;
  dst.height = src.width;
  const ctx = dst.getContext("2d")!;
  ctx.translate(0, dst.height);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return dst;
}

function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Camera-facing sprite with the side-profile art rotated so the toe points
 * toward the horizon (down the road), not across the lanes.
 */
function createShoeBillboard(
  source: THREE.Texture,
  mobile: boolean,
  portrait: boolean,
  mirror: boolean,
): { mount: THREE.Group; mat: THREE.SpriteMaterial } {
  let map: THREE.Texture = source;
  let alphaMap: THREE.Texture | undefined;
  // After −90° rotation the shoe is taller than wide.
  let aspect = 0.55;
  try {
    const img = source.image as CanvasImageSource & { width?: number };
    if (img && ("naturalWidth" in img ? img.naturalWidth : img.width)) {
      const prep = prepareSneakerThumbnail(img);
      const mapCanvas = rotateCanvasToeForward(prep.map.image as HTMLCanvasElement);
      const alphaCanvas = rotateCanvasToeForward(prep.alphaMap.image as HTMLCanvasElement);
      map = canvasToTexture(mapCanvas);
      alphaMap = canvasToTexture(alphaCanvas);
      aspect = mapCanvas.width / mapCanvas.height;
    }
  } catch (err) {
    console.warn("[walking-shoes-3d] thumbnail prep failed, using raw texture", err);
  }

  const mat = new THREE.SpriteMaterial({
    map,
    alphaMap,
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  // Height is the long axis (toe → horizon); width is the shoe thickness on screen.
  const baseH = portrait ? 1.15 : mobile ? 1.25 : 1.1;
  sprite.scale.set(baseH * aspect, baseH, 1);
  sprite.position.y = portrait ? 0.52 : mobile ? 0.58 : 0.55;
  sprite.renderOrder = 8;
  sprite.frustumCulled = false;

  const mount = new THREE.Group();
  mount.add(sprite);
  if (mirror) mount.scale.x = -1;
  mount.frustumCulled = false;
  return { mount, mat };
}

/**
 * Runner pair — official Baloon8 sneaker art, toe pointing down the road.
 */
export function createWalkingShoes3D(
  _blueprint?: THREE.Texture | null,
  mobile = false,
  portrait = false,
): WalkingShoes3D {
  const root = new THREE.Group();
  const shoePivot = new THREE.Group();
  const leftPivot = new THREE.Group();
  const rightPivot = new THREE.Group();

  let leftMat: THREE.SpriteMaterial | null = null;
  let rightMat: THREE.SpriteMaterial | null = null;

  const tex = runnerTexture ?? _blueprint ?? null;
  if (tex) {
    const left = createShoeBillboard(tex, mobile, portrait, false);
    const right = createShoeBillboard(tex, mobile, portrait, true);
    leftPivot.add(left.mount);
    rightPivot.add(right.mount);
    leftMat = left.mat;
    rightMat = right.mat;
  }

  shoePivot.add(leftPivot, rightPivot);

  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.022, 16, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x5b8da8,
      emissive: 0x5b8da8,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.35,
      thickness: 0.2,
    }),
  );
  shieldRing.rotation.x = Math.PI / 2;
  shieldRing.position.y = 0.42;
  shieldRing.visible = false;

  const shieldGlow = new THREE.PointLight(0x5b8da8, 0, 4);
  shieldGlow.position.y = 0.28;

  const dustEmitter = new THREE.Group();
  dustEmitter.position.y = 0.02;

  root.add(shoePivot, shieldRing, shieldGlow, dustEmitter);

  return {
    root,
    shoePivot,
    leftPivot,
    rightPivot,
    leftMat,
    rightMat,
    shieldRing,
    shieldGlow,
    dustEmitter,
  };
}

const dustPool: THREE.Mesh[] = [];

function spawnDust(shoes: WalkingShoes3D, xOffset: number): void {
  if (dustPool.length > 24) return;
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.012 + Math.random() * 0.016, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0x8a8070,
      transparent: true,
      opacity: 0.35,
    }),
  );
  p.position.set(xOffset + (Math.random() - 0.5) * 0.08, 0.02, 0.04);
  p.userData.life = 0.35 + Math.random() * 0.25;
  p.userData.vy = 0.25 + Math.random() * 0.35;
  p.userData.vz = -0.12 - Math.random() * 0.2;
  shoes.dustEmitter.add(p);
  dustPool.push(p);
}

function applyDirtToBillboard(
  mat: THREE.SpriteMaterial | null,
  dirt: number,
  freshGlow: boolean,
): void {
  if (!mat) return;
  const base = new THREE.Color(0xffffff);
  if (dirt > 0.02) base.lerp(new THREE.Color(0x6b5340), 0.15 + dirt * 0.55);
  if (freshGlow) base.lerp(new THREE.Color(0xe8f6fa), 0.12);
  mat.color.copy(base);
  mat.opacity = freshGlow ? 1 : Math.max(0.85, 1 - dirt * 0.12);
}

export function updateWalkingShoes3D(
  shoes: WalkingShoes3D,
  args: {
    walkPhase: number;
    airborne: boolean;
    dirt: number;
    freshGlow: boolean;
    shieldActive: boolean;
    speed?: number;
    portrait?: boolean;
  },
): void {
  const phase = args.walkPhase * Math.PI * 2;
  const dt = 0.016;
  const stride = args.airborne ? 0 : Math.sin(phase);
  const lateral = args.portrait ? 0.32 : 0.4;

  const bob = args.airborne ? 0.14 : Math.max(0, Math.sin(phase * 2)) * 0.05;
  shoes.shoePivot.rotation.x = Math.sin(phase) * (args.airborne ? 0.04 : 0.06);
  shoes.shoePivot.rotation.z = Math.sin(phase * 0.5) * 0.03;
  shoes.shoePivot.position.y = bob;

  if (args.airborne) {
    shoes.leftPivot.position.set(-lateral * 0.85, 0.1, 0.06);
    shoes.rightPivot.position.set(lateral * 0.85, 0.08, 0.1);
    shoes.leftPivot.rotation.x = -0.18;
    shoes.rightPivot.rotation.x = -0.14;
  } else {
    const leadLift = Math.max(0, stride) * 0.1;
    const trailLift = Math.max(0, -stride) * 0.1;
    const leadZ = stride > 0 ? -0.12 : 0.09;
    const trailZ = stride > 0 ? 0.09 : -0.12;
    const leftLead = stride > 0;

    shoes.leftPivot.position.set(
      -lateral,
      leftLead ? leadLift : trailLift,
      leftLead ? leadZ : trailZ,
    );
    shoes.rightPivot.position.set(
      lateral,
      leftLead ? trailLift : leadLift,
      leftLead ? trailZ : leadZ,
    );
    shoes.leftPivot.rotation.x = leftLead ? -0.08 : 0.04;
    shoes.rightPivot.rotation.x = leftLead ? 0.04 : -0.08;
  }

  if (!args.airborne && Math.sin(phase * 2) > 0.92) {
    spawnDust(shoes, stride > 0 ? -lateral : lateral);
  }

  applyDirtToBillboard(shoes.leftMat, args.dirt, args.freshGlow);
  applyDirtToBillboard(shoes.rightMat, args.dirt, args.freshGlow);

  shoes.shieldRing.visible = args.shieldActive;
  shoes.shieldGlow.intensity = args.shieldActive ? 1.2 : 0;
  if (args.shieldActive) {
    shoes.shieldRing.rotation.z += 0.035;
  }

  for (let i = dustPool.length - 1; i >= 0; i--) {
    const p = dustPool[i]!;
    p.userData.life -= dt;
    p.position.y += p.userData.vy * dt;
    p.position.z += p.userData.vz * dt;
    (p.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.userData.life * 0.5);
    if (p.userData.life <= 0) {
      shoes.dustEmitter.remove(p);
      dustPool.splice(i, 1);
    }
  }
}
