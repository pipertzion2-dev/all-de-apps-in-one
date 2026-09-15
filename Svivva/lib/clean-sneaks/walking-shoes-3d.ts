import * as THREE from "three";

/**
 * Classic white runner sneakers in real 3D.
 * Toe → −Z (down the road), heel → +Z (toward the camera) — normal third-person
 * runner rear view. Not billboards, not the balloon-car mesh.
 */

export type RunnerShoe3D = {
  root: THREE.Group;
  bodyMats: THREE.MeshStandardMaterial[];
  accentMats: THREE.MeshStandardMaterial[];
  soleMats: THREE.MeshStandardMaterial[];
};

export type WalkingShoes3D = {
  root: THREE.Group;
  shoePivot: THREE.Group;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
  leftShoe: RunnerShoe3D | null;
  rightShoe: RunnerShoe3D | null;
  shieldRing: THREE.Mesh;
  shieldGlow: THREE.PointLight;
  dustEmitter: THREE.Group;
};

const COL = {
  upper: 0xf4f5f7,
  sole: 0xe8e8ec,
  soleEdge: 0xb0b0ba,
  teal: 0x5b8da8,
  magenta: 0xd94f9c,
  lace: 0x8a8a94,
  tongue: 0xffffff,
  collar: 0x2a2a32,
};

/** No texture preload — shoes are fully procedural meshes. */
export function preloadBaloon8RunnerShoe(): Promise<THREE.Texture | null> {
  return Promise.resolve(null);
}

function mat(
  color: number,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.08,
    ...opts,
  });
}

/**
 * One low-poly sneaker. Local space: toe −Z, heel +Z, sole on Y≈0.
 * Camera sits at +Z looking toward −Z, so the heel faces the player.
 */
function buildRunnerSneaker(scale: number, mirror: boolean): RunnerShoe3D {
  const root = new THREE.Group();
  const bodyMats: THREE.MeshStandardMaterial[] = [];
  const accentMats: THREE.MeshStandardMaterial[] = [];
  const soleMats: THREE.MeshStandardMaterial[] = [];

  const upperMat = mat(COL.upper, { roughness: 0.45 });
  const soleMat = mat(COL.sole, { roughness: 0.7 });
  const soleEdgeMat = mat(COL.soleEdge, { roughness: 0.75 });
  const tealMat = mat(COL.teal, { roughness: 0.4, metalness: 0.15 });
  const magentaMat = mat(COL.magenta, {
    roughness: 0.35,
    metalness: 0.2,
    emissive: COL.magenta,
    emissiveIntensity: 0.18,
  });
  const laceMat = mat(COL.lace, { roughness: 0.65 });
  const tongueMat = mat(COL.tongue, { roughness: 0.5 });
  const collarMat = mat(COL.collar, { roughness: 0.8 });

  bodyMats.push(upperMat, tongueMat);
  accentMats.push(tealMat, magentaMat, laceMat);
  soleMats.push(soleMat, soleEdgeMat);

  const L = 0.68 * scale;
  const W = 0.26 * scale;
  const H = 0.24 * scale;

  // Outsole
  const outsole = new THREE.Mesh(
    new THREE.BoxGeometry(W * 1.06, 0.036 * scale, L * 1.02),
    soleEdgeMat,
  );
  outsole.position.set(0, 0.018 * scale, 0);
  outsole.castShadow = true;
  root.add(outsole);

  // Heel lift
  const heelStack = new THREE.Mesh(
    new THREE.BoxGeometry(W * 1.02, 0.042 * scale, L * 0.3),
    soleEdgeMat,
  );
  heelStack.position.set(0, 0.042 * scale, L * 0.34);
  root.add(heelStack);

  // Midsole
  const midsole = new THREE.Mesh(new THREE.BoxGeometry(W, 0.048 * scale, L * 0.98), soleMat);
  midsole.position.set(0, 0.056 * scale, 0);
  midsole.castShadow = true;
  root.add(midsole);

  // Upper
  const upper = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, H, L * 0.7), upperMat);
  upper.position.set(0, 0.08 * scale + H * 0.5, L * 0.04);
  upper.castShadow = true;
  root.add(upper);

  // Toe box
  const toe = new THREE.Mesh(new THREE.SphereGeometry(W * 0.48, 12, 10), upperMat);
  toe.scale.set(1, 0.72, 1.2);
  toe.position.set(0, 0.09 * scale + H * 0.28, -L * 0.34);
  toe.castShadow = true;
  root.add(toe);

  // Teal toe bumper
  const bumper = new THREE.Mesh(new THREE.SphereGeometry(W * 0.42, 10, 8), tealMat);
  bumper.scale.set(1.05, 0.55, 0.72);
  bumper.position.set(0, 0.07 * scale + H * 0.15, -L * 0.4);
  root.add(bumper);

  // Magenta heel counter — faces camera (+Z) but keep it shoe-proportioned
  const heelCounter = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.95, H * 0.9, L * 0.12),
    magentaMat,
  );
  heelCounter.position.set(0, 0.08 * scale + H * 0.48, L * 0.38);
  heelCounter.castShadow = true;
  root.add(heelCounter);

  // Heel logo disc facing +Z
  const heelPlate = new THREE.Mesh(new THREE.CircleGeometry(W * 0.18, 16), tealMat);
  heelPlate.position.set(0, 0.08 * scale + H * 0.5, L * 0.45);
  root.add(heelPlate);

  // Rear sole lip sticking toward camera (classic runner “heel” read)
  const soleLip = new THREE.Mesh(
    new THREE.BoxGeometry(W * 1.02, 0.05 * scale, 0.06 * scale),
    soleMat,
  );
  soleLip.position.set(0, 0.04 * scale, L * 0.5);
  root.add(soleLip);

  // Heel tab
  const heelTab = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.34, H * 0.3, 0.04 * scale),
    magentaMat,
  );
  heelTab.position.set(0, 0.08 * scale + H * 1.02, L * 0.45);
  root.add(heelTab);

  // Collar opening
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(W * 0.28, W * 0.32, H * 0.35, 12),
    collarMat,
  );
  collar.position.set(0, 0.08 * scale + H * 0.88, L * 0.2);
  root.add(collar);

  // Tongue
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(W * 0.4, 0.025 * scale, L * 0.35), tongueMat);
  tongue.position.set(0, 0.08 * scale + H * 0.95, L * 0.0);
  tongue.rotation.x = -0.35;
  root.add(tongue);

  // Laces
  for (let i = 0; i < 3; i++) {
    const lace = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.38, 0.012 * scale, 0.018 * scale),
      laceMat,
    );
    lace.position.set(0, 0.08 * scale + H * 0.8, -L * 0.04 - i * 0.075 * scale);
    root.add(lace);
  }

  // Outer teal stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02 * scale, H * 0.35, L * 0.45), tealMat);
  stripe.position.set(W * 0.47, 0.08 * scale + H * 0.4, -L * 0.05);
  root.add(stripe);

  const stripeIn = new THREE.Mesh(new THREE.BoxGeometry(0.015 * scale, H * 0.28, L * 0.4), tealMat);
  stripeIn.position.set(-W * 0.46, 0.08 * scale + H * 0.38, -L * 0.05);
  root.add(stripeIn);

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.frustumCulled = false;
  });

  if (mirror) root.scale.x = -1;

  return { root, bodyMats, accentMats, soleMats };
}

function runnerScale(mobile: boolean, portrait: boolean): number {
  if (portrait) return 1.0;
  if (mobile) return 1.1;
  return 1.05;
}

export function createWalkingShoes3D(
  _blueprint?: THREE.Texture | null,
  mobile = false,
  portrait = false,
): WalkingShoes3D {
  const root = new THREE.Group();
  const shoePivot = new THREE.Group();
  const leftPivot = new THREE.Group();
  const rightPivot = new THREE.Group();

  const s = runnerScale(mobile, portrait);
  const leftShoe = buildRunnerSneaker(s, true);
  const rightShoe = buildRunnerSneaker(s, false);
  leftPivot.add(leftShoe.root);
  rightPivot.add(rightShoe.root);
  // Mild toe-in — heels toward camera, outer sides readable
  leftPivot.rotation.y = 0.1;
  rightPivot.rotation.y = -0.1;
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
  shieldRing.position.y = 0.28;
  shieldRing.visible = false;

  const shieldGlow = new THREE.PointLight(0x5b8da8, 0, 4);
  shieldGlow.position.y = 0.22;

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

function tintShoe(shoe: RunnerShoe3D | null, dirt: number, freshGlow: boolean): void {
  if (!shoe) return;
  const dirtAmt = dirt > 0.02 ? 0.12 + dirt * 0.55 : 0;
  for (const m of shoe.bodyMats) {
    const c = new THREE.Color(COL.upper);
    if (dirtAmt) c.lerp(new THREE.Color(0x6b5340), dirtAmt);
    if (freshGlow) c.lerp(new THREE.Color(0xe8f6fa), 0.1);
    m.color.copy(c);
  }
  for (const m of shoe.soleMats) {
    const c = new THREE.Color(COL.sole);
    if (dirtAmt) c.lerp(new THREE.Color(0x5c4033), dirtAmt * 0.8);
    m.color.copy(c);
  }
  for (const m of shoe.accentMats) {
    if (m.emissive.getHex() === COL.magenta) {
      m.emissiveIntensity = freshGlow ? 0.35 : Math.max(0.08, 0.2 - dirt * 0.12);
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
  const stride = args.airborne ? 0 : Math.sin(phase);
  const lateral = args.portrait ? 0.2 : 0.26;
  const toeIn = 0.1;

  const bob = args.airborne ? 0.12 : Math.max(0, Math.sin(phase * 2)) * 0.04;
  shoes.shoePivot.rotation.x = Math.sin(phase) * (args.airborne ? 0.05 : 0.08);
  shoes.shoePivot.rotation.z = Math.sin(phase * 0.5) * 0.025;
  shoes.shoePivot.position.y = bob;

  if (args.airborne) {
    shoes.leftPivot.position.set(-lateral * 0.9, 0.08, 0.05);
    shoes.rightPivot.position.set(lateral * 0.9, 0.06, 0.08);
    shoes.leftPivot.rotation.x = -0.22;
    shoes.rightPivot.rotation.x = -0.18;
    shoes.leftPivot.rotation.y = toeIn;
    shoes.rightPivot.rotation.y = -toeIn;
  } else {
    const leadLift = Math.max(0, stride) * 0.09;
    const trailLift = Math.max(0, -stride) * 0.09;
    const leadZ = stride > 0 ? -0.12 : 0.1;
    const trailZ = stride > 0 ? 0.1 : -0.12;
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
    shoes.leftPivot.rotation.x = leftLead ? -0.12 : 0.06;
    shoes.rightPivot.rotation.x = leftLead ? 0.06 : -0.12;
    shoes.leftPivot.rotation.y = toeIn;
    shoes.rightPivot.rotation.y = -toeIn;
  }

  if (!args.airborne && Math.sin(phase * 2) > 0.92) {
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
