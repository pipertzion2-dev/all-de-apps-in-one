import * as THREE from "three";
import { buildBaloon8RunnerShoe, type Baloon8WalkerShoe } from "./baloon8-shoe-model";
import { detectRunQuality, runQualityFlags } from "./run-quality";

export type WalkingShoes3D = {
  root: THREE.Group;
  shoePivot: THREE.Group;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
  leftShoe: Baloon8WalkerShoe | null;
  rightShoe: Baloon8WalkerShoe | null;
  shieldRing: THREE.Mesh;
  shieldGlow: THREE.PointLight;
  dustEmitter: THREE.Group;
};

function runnerBubbleCount(): number {
  if (typeof window === "undefined") return 1400;
  const flags = runQualityFlags(detectRunQuality());
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return flags.bubbleCountReduced;
  return flags.bubbleCount;
}

/** Preload is a no-op resolve — the Tripo coupe is fully procedural (no GLB yet). */
export function preloadBaloon8RunnerShoe(): Promise<THREE.Texture | null> {
  return Promise.resolve(null);
}

function buildRunnerShoe(mobile: boolean, portrait: boolean, mirror: boolean): Baloon8WalkerShoe {
  const preferred = mobile
    ? Math.max(portrait ? 1600 : 2000, Math.floor(runnerBubbleCount() / (portrait ? 1.4 : 1.2)))
    : Math.max(2800, Math.floor(runnerBubbleCount() / 1.2));
  return buildBaloon8RunnerShoe(undefined, preferred, {
    mobile,
    portrait,
    pair: true,
    mirror,
  });
}

/** Baloon8 Tripo coupe pair — left + right with light stride. */
export function createWalkingShoes3D(
  _blueprint?: THREE.Texture | null,
  mobile = false,
  portrait = false,
): WalkingShoes3D {
  const root = new THREE.Group();
  const shoePivot = new THREE.Group();
  const leftPivot = new THREE.Group();
  const rightPivot = new THREE.Group();

  const leftShoe = buildRunnerShoe(mobile, portrait, false);
  const rightShoe = buildRunnerShoe(mobile, portrait, true);
  leftPivot.add(leftShoe.root);
  rightPivot.add(rightShoe.root);
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

function applyDirtToShoe(shoe: Baloon8WalkerShoe | null, dirt: number, freshGlow: boolean): void {
  if (!shoe) return;
  const base = new THREE.Color(0x2a6080);
  if (dirt > 0.02) base.lerp(new THREE.Color(0x4a3828), 0.2 + dirt * 0.65);
  shoe.hullMat.color.copy(base);
  if ("iridescence" in shoe.hullMat) {
    shoe.hullMat.iridescence = Math.max(0.35, 0.95 - dirt * 0.5);
  }
  shoe.hullMat.metalness = Math.max(0.45, 0.92 - dirt * 0.3);
  shoe.hullMat.envMapIntensity = freshGlow ? 2.0 : 1.55 - dirt * 0.35;

  if (shoe.bubbles?.instanceColor) {
    const c = new THREE.Color();
    for (let i = 0; i < shoe.bubbles.count; i++) {
      shoe.bubbles.getColorAt(i, c);
      if (dirt > 0.02) c.lerp(new THREE.Color(0x5c4033), dirt * 0.35);
      shoe.bubbles.setColorAt(i, c);
    }
    shoe.bubbles.instanceColor.needsUpdate = true;
  }

  for (const mesh of shoe.glowMeshes) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = freshGlow ? 1.6 : Math.max(0.65, 1.25 - dirt * 0.45);
  }
}

function spinWheels(shoe: Baloon8WalkerShoe | null, speed: number, dt: number): void {
  if (!shoe) return;
  const spin = speed * 0.0004 * dt;
  for (const wheel of shoe.wheels) {
    wheel.rotation.x += spin;
  }
}

function pulseGlow(shoes: WalkingShoes3D, t: number, freshGlow: boolean): void {
  const pulse = 0.85 + Math.sin(t * 2.2) * 0.15;
  for (const shoe of [shoes.leftShoe, shoes.rightShoe]) {
    if (!shoe) continue;
    for (const mesh of shoe.glowMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (freshGlow ? 1.2 : 0.95) * pulse;
    }
  }
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
  const t = performance.now() / 1000;
  const stride = args.airborne ? 0 : Math.sin(phase);
  // Keep the coupe pair close so it reads as one vehicle formation, not floating blobs
  const lateral = args.portrait ? 0.38 : 0.48;

  const bob = args.airborne ? 0.1 : Math.max(0, Math.sin(phase * 2)) * 0.03;
  shoes.shoePivot.rotation.x = Math.sin(phase) * (args.airborne ? 0.03 : 0.035);
  shoes.shoePivot.rotation.z = Math.sin(phase * 0.5) * 0.015;
  shoes.shoePivot.position.y = bob;

  if (args.airborne) {
    shoes.leftPivot.position.set(-lateral * 0.92, 0.08, 0.04);
    shoes.rightPivot.position.set(lateral * 0.92, 0.06, 0.06);
    shoes.leftPivot.rotation.x = -0.1;
    shoes.rightPivot.rotation.x = -0.08;
  } else {
    const leadLift = Math.max(0, stride) * 0.04;
    const trailLift = Math.max(0, -stride) * 0.04;
    const leadZ = stride > 0 ? -0.04 : 0.03;
    const trailZ = stride > 0 ? 0.03 : -0.04;
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
    shoes.leftPivot.rotation.x = leftLead ? -0.04 : 0.02;
    shoes.rightPivot.rotation.x = leftLead ? 0.02 : -0.04;
  }

  if (!args.airborne && Math.sin(phase * 2) > 0.92) {
    spawnDust(shoes, stride > 0 ? -lateral : lateral);
  }

  applyDirtToShoe(shoes.leftShoe, args.dirt, args.freshGlow);
  applyDirtToShoe(shoes.rightShoe, args.dirt, args.freshGlow);
  if (!args.airborne && args.speed) {
    spinWheels(shoes.leftShoe, args.speed, dt);
    spinWheels(shoes.rightShoe, args.speed, dt);
  }
  pulseGlow(shoes, t, args.freshGlow);

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
