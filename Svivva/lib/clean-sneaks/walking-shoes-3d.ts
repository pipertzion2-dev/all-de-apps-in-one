import * as THREE from "three";
import { getLeatherTextures, soleTreadTexture } from "./run-textures";

export type WalkingShoes3D = {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  upperMats: THREE.MeshPhysicalMaterial[];
  shieldRing: THREE.Mesh;
  shieldGlow: THREE.PointLight;
  dustEmitter: THREE.Group;
};

let leatherMats: THREE.MeshPhysicalMaterial[] | null = null;
let soleMat: THREE.MeshPhysicalMaterial | null = null;

function getLeatherMaterial(): THREE.MeshPhysicalMaterial {
  if (!leatherMats) {
    const { map, roughnessMap, normalMap } = getLeatherTextures();
    leatherMats = [
      new THREE.MeshPhysicalMaterial({
        map,
        roughnessMap,
        normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        color: 0xffffff,
        roughness: 0.48,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
        sheen: 0.4,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color(0xffffff),
      }),
    ];
  }
  return leatherMats[0]!;
}

function getSoleMaterial(): THREE.MeshPhysicalMaterial {
  soleMat ??= new THREE.MeshPhysicalMaterial({
    map: soleTreadTexture(),
    color: 0x111111,
    roughness: 0.95,
    metalness: 0.02,
    bumpScale: 0.02,
  });
  return soleMat;
}

function roundedBox(w: number, h: number, d: number, radius: number, mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  const r = Math.min(radius, w / 2, h / 2);
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
  geo.center();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildShoe(side: -1 | 1): THREE.Group {
  const g = new THREE.Group();
  const leather = getLeatherMaterial();
  const sole = getSoleMaterial();

  const upper = roundedBox(0.58, 0.32, 1.08, 0.08, leather);
  upper.position.set(0, 0.16, 0.06);
  upper.rotation.x = -0.04;

  const toe = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    leather,
  );
  toe.scale.set(1, 0.55, 1.35);
  toe.position.set(0, 0.12, 0.62);
  toe.castShadow = true;

  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.32), leather);
  heel.position.set(0, 0.2, -0.38);
  heel.castShadow = true;

  const soleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.11, 1.22), sole);
  soleMesh.position.set(0, 0.02, 0.04);
  soleMesh.castShadow = true;

  const midsole = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.06, 1.18),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8e8ec,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.2,
    }),
  );
  midsole.position.set(0, 0.08, 0.04);

  const swoosh = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.025, 8, 24, Math.PI * 1.1),
    new THREE.MeshPhysicalMaterial({
      color: side < 0 ? 0x5b8da8 : 0xd94f9c,
      roughness: 0.35,
      metalness: 0.15,
      emissive: side < 0 ? 0x5b8da8 : 0xd94f9c,
      emissiveIntensity: 0.08,
    }),
  );
  swoosh.position.set(side * 0.24, 0.24, 0.08);
  swoosh.rotation.y = side * 0.35;
  swoosh.rotation.z = -0.25;

  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.06, 0.38),
    leather,
  );
  tongue.position.set(0, 0.32, 0.28);
  tongue.rotation.x = -0.35;

  const laceMat = new THREE.MeshStandardMaterial({ color: 0xf8f8fa, roughness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), laceMat);
    lace.position.set(0, 0.28 - i * 0.04, 0.18 + i * 0.06);
    lace.rotation.x = Math.PI / 2;
    g.add(lace);
  }

  g.add(upper, toe, heel, midsole, soleMesh, swoosh, tongue);
  return g;
}

function buildLeg(): THREE.Group {
  const leg = new THREE.Group();
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xc4b8a8,
    roughness: 0.62,
    metalness: 0,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xffeedd),
  });
  const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.48, 8, 16), skinMat);
  calf.position.y = 0.58;
  calf.castShadow = true;
  const sock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f4, roughness: 0.8 }),
  );
  sock.position.y = 0.22;
  leg.add(calf, sock);
  return leg;
}

/** High-detail procedural 3D walking sneaker pair. */
export function createWalkingShoes3D(): WalkingShoes3D {
  const root = new THREE.Group();

  const leftLeg = buildLeg();
  leftLeg.position.set(-0.35, 0, 0);
  const rightLeg = buildLeg();
  rightLeg.position.set(0.35, 0, 0);

  const leftShoeGroup = buildShoe(-1);
  leftShoeGroup.position.set(0, 0, 0.12);
  const rightShoeGroup = buildShoe(1);
  rightShoeGroup.position.set(0, 0, 0.12);

  leftLeg.add(leftShoeGroup);
  rightLeg.add(rightShoeGroup);

  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.035, 16, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x5b8da8,
      emissive: 0x5b8da8,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.35,
      thickness: 0.2,
    }),
  );
  shieldRing.rotation.x = Math.PI / 2;
  shieldRing.position.y = 0.4;
  shieldRing.visible = false;

  const shieldGlow = new THREE.PointLight(0x5b8da8, 0, 4);
  shieldGlow.position.y = 0.4;

  const dustEmitter = new THREE.Group();
  dustEmitter.position.y = 0.05;

  root.add(leftLeg, rightLeg, shieldRing, shieldGlow, dustEmitter);

  return {
    root,
    leftLeg,
    rightLeg,
    upperMats: [getLeatherMaterial()],
    shieldRing,
    shieldGlow,
    dustEmitter,
  };
}

const dustPool: THREE.Mesh[] = [];

function spawnDust(shoes: WalkingShoes3D, side: number): void {
  if (dustPool.length > 24) return;
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0x8a8070,
      transparent: true,
      opacity: 0.35,
    }),
  );
  p.position.set(side * 0.35, 0.05, 0.1);
  p.userData.life = 0.4 + Math.random() * 0.3;
  p.userData.vy = 0.4 + Math.random() * 0.5;
  p.userData.vz = -0.2 - Math.random() * 0.3;
  shoes.dustEmitter.add(p);
  dustPool.push(p);
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
  const stride = args.airborne ? 0.18 : 0.34;
  const lift = args.airborne ? 0.48 : Math.max(0, Math.sin(phase)) * stride;

  shoes.leftLeg.rotation.x = Math.sin(phase) * stride;
  shoes.rightLeg.rotation.x = Math.sin(phase + Math.PI) * stride;
  shoes.leftLeg.position.y = lift * 0.38;
  shoes.rightLeg.position.y = Math.max(0, Math.sin(phase + Math.PI)) * stride * 0.38;

  if (!args.airborne && Math.sin(phase) > 0.92) spawnDust(shoes, -1);
  if (!args.airborne && Math.sin(phase + Math.PI) > 0.92) spawnDust(shoes, 1);

  for (const mat of shoes.upperMats) {
    const color = new THREE.Color(0xf2f2f6);
    if (args.dirt > 0.02) color.lerp(new THREE.Color(0x5c4033), 0.12 + args.dirt * 0.6);
    mat.color.copy(color);
    mat.emissive.set(args.freshGlow ? 0x7ec8d9 : 0x000000);
    mat.emissiveIntensity = args.freshGlow ? 0.06 : 0;
    mat.clearcoat = args.freshGlow ? 0.55 : 0.35;
  }

  shoes.shieldRing.visible = args.shieldActive;
  shoes.shieldGlow.intensity = args.shieldActive ? 1.2 : 0;
  if (args.shieldActive) {
    shoes.shieldRing.rotation.z += 0.035;
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
