import * as THREE from "three";
import {
  loadBaloon8BlueprintTexture,
  prepareBlueprint,
  type PreparedBlueprint,
  type PreparedQuadrant,
} from "./baloon8-textures";
import { getColorway } from "./sneaker-catalog";

/**
 * YOUR Baloon8 sneakers from the orthographic blueprint (rear view toward the
 * follow camera). Walk cycle is bipedal — left/right stride, not wheel drive.
 */

export type Baloon8OrthoShoe = {
  root: THREE.Group;
  mats: THREE.MeshBasicMaterial[];
};

export type WalkingShoes3D = {
  root: THREE.Group;
  shoePivot: THREE.Group;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
  leftShoe: Baloon8OrthoShoe | null;
  rightShoe: Baloon8OrthoShoe | null;
  shieldRing: THREE.Mesh;
  shieldGlow: THREE.PointLight;
  dustEmitter: THREE.Group;
};

let blueprintTex: THREE.Texture | null = null;
let preparedCache: PreparedBlueprint | null = null;

export function preloadBaloon8RunnerShoe(): Promise<THREE.Texture | null> {
  return loadBaloon8BlueprintTexture()
    .then((tex) => {
      blueprintTex = tex;
      try {
        preparedCache = prepareBlueprint(tex);
      } catch (err) {
        console.warn("[walking-shoes-3d] blueprint prepare failed", err);
        preparedCache = null;
      }
      return tex;
    })
    .catch((err) => {
      console.warn("[walking-shoes-3d] blueprint preload failed", err);
      blueprintTex = null;
      preparedCache = null;
      return null;
    });
}

function panelMat(q: PreparedQuadrant): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map: q.map,
    alphaMap: q.alphaMap,
    transparent: true,
    alphaTest: 0.1,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Baloon8 from the orthographic REAR VIEW — heel / BALOON8 plate toward camera.
 * One clean rear panel per foot.
 */
function buildOrthoShoe(
  prepared: PreparedBlueprint,
  scale: number,
  mirror: boolean,
): Baloon8OrthoShoe {
  const root = new THREE.Group();
  const mats: THREE.MeshBasicMaterial[] = [];

  const rearH = 0.64 * scale;
  const rearW = rearH * Math.max(0.95, Math.min(1.5, prepared.rear.aspect));

  const rearMat = panelMat(prepared.rear);
  mats.push(rearMat);
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(rearW, rearH), rearMat);
  rear.position.set(0, rearH * 0.5, 0.06);
  rear.renderOrder = 9;
  rear.frustumCulled = false;
  root.add(rear);

  if (mirror) root.scale.x = -1;

  return { root, mats };
}

function shoeScale(mobile: boolean, portrait: boolean): number {
  if (portrait) return 1.1;
  if (mobile) return 1.2;
  return 1.15;
}

export function createWalkingShoes3D(
  _blueprint?: THREE.Texture | null,
  mobile = false,
  portrait = false,
  colorwayId?: string | null,
): WalkingShoes3D {
  const root = new THREE.Group();
  const shoePivot = new THREE.Group();
  const leftPivot = new THREE.Group();
  const rightPivot = new THREE.Group();

  let leftShoe: Baloon8OrthoShoe | null = null;
  let rightShoe: Baloon8OrthoShoe | null = null;

  let prepared = preparedCache;
  if (!prepared && blueprintTex) {
    try {
      prepared = prepareBlueprint(blueprintTex);
    } catch {
      prepared = null;
    }
  }

  if (prepared) {
    const s = shoeScale(mobile, portrait);
    leftShoe = buildOrthoShoe(prepared, s, false);
    rightShoe = buildOrthoShoe(prepared, s, true);
    leftPivot.add(leftShoe.root);
    rightPivot.add(rightShoe.root);
    leftPivot.rotation.y = 0.06;
    rightPivot.rotation.y = -0.06;
  }

  const tintHex = getColorway(colorwayId).tint;
  const tint = new THREE.Color(tintHex);
  for (const shoe of [leftShoe, rightShoe]) {
    if (!shoe) continue;
    for (const m of shoe.mats) {
      m.color.copy(tint);
      m.userData.baseTint = tint.clone();
    }
  }

  shoePivot.add(leftPivot, rightPivot);

  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.022, 16, 64),
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
    leftShoe,
    rightShoe,
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
    new THREE.MeshBasicMaterial({ color: 0x8a8070, transparent: true, opacity: 0.35 }),
  );
  p.position.set(xOffset + (Math.random() - 0.5) * 0.08, 0.02, 0.04);
  p.userData.life = 0.35 + Math.random() * 0.25;
  p.userData.vy = 0.25 + Math.random() * 0.35;
  p.userData.vz = -0.12 - Math.random() * 0.2;
  shoes.dustEmitter.add(p);
  dustPool.push(p);
}

function tintShoe(shoe: Baloon8OrthoShoe | null, dirt: number, freshGlow: boolean): void {
  if (!shoe) return;
  for (const m of shoe.mats) {
    const base =
      (m.userData.baseTint as THREE.Color | undefined)?.clone() ?? new THREE.Color(0xffffff);
    if (dirt > 0.02) base.lerp(new THREE.Color(0x6b5340), 0.15 + dirt * 0.55);
    if (freshGlow) base.lerp(new THREE.Color(0xe8f6fa), 0.08);
    m.color.copy(base);
    m.opacity = freshGlow ? 1 : Math.max(0.85, 1 - dirt * 0.12);
  }
}

/**
 * Bipedal walk — left and right feet alternate lift / plant.
 * Visuals stay Baloon8; motion is walking, not driving.
 */
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
  const lateral = args.portrait ? 0.28 : 0.4;
  const toeIn = 0.06;

  const bob = args.airborne ? 0.14 : Math.max(0, Math.sin(phase * 2)) * 0.07;
  shoes.shoePivot.rotation.x = Math.sin(phase) * (args.airborne ? 0.06 : 0.12);
  shoes.shoePivot.rotation.z = Math.sin(phase * 0.5) * 0.04;
  shoes.shoePivot.position.y = bob;

  if (args.airborne) {
    shoes.leftPivot.position.set(-lateral * 0.85, 0.1, 0.06);
    shoes.rightPivot.position.set(lateral * 0.85, 0.08, 0.1);
    shoes.leftPivot.rotation.x = -0.28;
    shoes.rightPivot.rotation.x = -0.22;
    shoes.leftPivot.rotation.y = toeIn;
    shoes.rightPivot.rotation.y = -toeIn;
  } else {
    // +stride → left lead, −stride → right lead
    const leftLift = Math.max(0, stride) * 0.18;
    const rightLift = Math.max(0, -stride) * 0.18;
    const leftZ = -stride * 0.18;
    const rightZ = stride * 0.18;

    shoes.leftPivot.position.set(-lateral, leftLift, leftZ);
    shoes.rightPivot.position.set(lateral, rightLift, rightZ);
    shoes.leftPivot.rotation.x = -stride * 0.22;
    shoes.rightPivot.rotation.x = stride * 0.22;
    shoes.leftPivot.rotation.y = toeIn;
    shoes.rightPivot.rotation.y = -toeIn;
  }

  if (!args.airborne && Math.sin(phase * 2) > 0.88) {
    spawnDust(shoes, stride > 0 ? -lateral : lateral);
  }

  tintShoe(shoes.leftShoe, args.dirt, args.freshGlow);
  tintShoe(shoes.rightShoe, args.dirt, args.freshGlow);

  shoes.shieldRing.visible = args.shieldActive;
  shoes.shieldGlow.intensity = args.shieldActive ? 1.2 : 0;
  if (args.shieldActive) shoes.shieldRing.rotation.z += 0.035;

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
