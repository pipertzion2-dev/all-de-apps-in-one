import * as THREE from "three";
import { buildBaloon8WalkerShoe, type Baloon8WalkerShoe } from "./baloon8-shoe-model";

export type WalkingShoes3D = {
  root: THREE.Group;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
  leftShoe: Baloon8WalkerShoe;
  rightShoe: Baloon8WalkerShoe;
  shieldRing: THREE.Mesh;
  shieldGlow: THREE.PointLight;
  dustEmitter: THREE.Group;
};

function walkerBubbleCount(): number {
  if (typeof window === "undefined") return 420;
  const mobile = window.innerWidth < 768;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return 280;
  return mobile ? 320 : 480;
}

/** Baloon8 blueprint sneaker pair — iridescent bubbles, green B grille, mandala insole. */
export function createWalkingShoes3D(): WalkingShoes3D {
  const root = new THREE.Group();
  const count = walkerBubbleCount();

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-0.12, 0, 0);
  const rightPivot = new THREE.Group();
  rightPivot.position.set(0.12, 0, 0);

  const leftShoe = buildBaloon8WalkerShoe(-1, count);
  const rightShoe = buildBaloon8WalkerShoe(1, count);

  leftPivot.add(leftShoe.root);
  rightPivot.add(rightShoe.root);

  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.014, 16, 64),
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
  shieldRing.position.y = 0.14;
  shieldRing.visible = false;

  const shieldGlow = new THREE.PointLight(0x5b8da8, 0, 2.5);
  shieldGlow.position.y = 0.14;

  const dustEmitter = new THREE.Group();
  dustEmitter.position.y = 0.02;

  root.add(leftPivot, rightPivot, shieldRing, shieldGlow, dustEmitter);

  return {
    root,
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

function spawnDust(shoes: WalkingShoes3D, side: number): void {
  if (dustPool.length > 20) return;
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.012 + Math.random() * 0.016, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0x8a8070,
      transparent: true,
      opacity: 0.35,
    }),
  );
  p.position.set(side * 0.12, 0.02, 0.04);
  p.userData.life = 0.35 + Math.random() * 0.25;
  p.userData.vy = 0.25 + Math.random() * 0.35;
  p.userData.vz = -0.12 - Math.random() * 0.2;
  shoes.dustEmitter.add(p);
  dustPool.push(p);
}

function applyDirtToShoe(shoe: Baloon8WalkerShoe, dirt: number, freshGlow: boolean): void {
  const base = new THREE.Color(0x2a6080);
  if (dirt > 0.02) base.lerp(new THREE.Color(0x4a3828), 0.2 + dirt * 0.65);
  shoe.hullMat.color.copy(base);
  shoe.hullMat.iridescence = Math.max(0.25, 0.9 - dirt * 0.55);
  shoe.hullMat.metalness = Math.max(0.35, 0.88 - dirt * 0.35);
  shoe.hullMat.envMapIntensity = freshGlow ? 1.8 : 1.55 - dirt * 0.4;

  if (shoe.bubbles.instanceColor) {
    const c = new THREE.Color();
    for (let i = 0; i < shoe.bubbles.count; i++) {
      shoe.bubbles.getColorAt(i, c);
      if (dirt > 0.02) c.lerp(new THREE.Color(0x5c4033), dirt * 0.45);
      shoe.bubbles.setColorAt(i, c);
    }
    shoe.bubbles.instanceColor.needsUpdate = true;
  }

  for (const mesh of shoe.glowMeshes) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = freshGlow ? 1.6 : Math.max(0.5, 1.2 - dirt * 0.5);
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
  },
): void {
  const phase = args.walkPhase * Math.PI * 2;
  const stride = args.airborne ? 0.22 : 0.38;
  const lift = args.airborne ? 0.22 : Math.max(0, Math.sin(phase)) * stride;

  shoes.leftPivot.rotation.x = Math.sin(phase) * stride;
  shoes.rightPivot.rotation.x = Math.sin(phase + Math.PI) * stride;
  shoes.leftPivot.position.y = lift * 0.22;
  shoes.rightPivot.position.y = Math.max(0, Math.sin(phase + Math.PI)) * stride * 0.22;

  if (!args.airborne && Math.sin(phase) > 0.92) spawnDust(shoes, -1);
  if (!args.airborne && Math.sin(phase + Math.PI) > 0.92) spawnDust(shoes, 1);

  applyDirtToShoe(shoes.leftShoe, args.dirt, args.freshGlow);
  applyDirtToShoe(shoes.rightShoe, args.dirt, args.freshGlow);

  shoes.shieldRing.visible = args.shieldActive;
  shoes.shieldGlow.intensity = args.shieldActive ? 1.2 : 0;
  if (args.shieldActive) {
    shoes.shieldRing.rotation.z += 0.035;
  }

  if (args.freshGlow) {
    const pulse = 0.88 + Math.sin((performance.now() / 1000) * 2.4) * 0.12;
    for (const shoe of [shoes.leftShoe, shoes.rightShoe]) {
      for (const mesh of shoe.glowMeshes) {
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.45 * pulse;
      }
    }
  }

  const dt = 0.016;
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
