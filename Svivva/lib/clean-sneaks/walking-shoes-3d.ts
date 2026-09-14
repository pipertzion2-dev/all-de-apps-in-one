import * as THREE from "three";

export type WalkingShoes3D = {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShoe: THREE.Mesh;
  rightShoe: THREE.Mesh;
  shieldRing: THREE.Mesh;
};

function shoeMaterial(dirt: number, fresh: boolean): THREE.MeshStandardMaterial {
  const base = new THREE.Color(0xf4f4f6);
  if (dirt > 0.02) {
    base.lerp(new THREE.Color(0x5c4033), 0.15 + dirt * 0.55);
  }
  return new THREE.MeshStandardMaterial({
    color: base,
    roughness: 0.55,
    metalness: fresh ? 0.12 : 0.04,
    emissive: fresh ? new THREE.Color(0x7ec8d9) : new THREE.Color(0x000000),
    emissiveIntensity: fresh ? 0.08 : 0,
  });
}

function soleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.05,
  });
}

function buildShoe(side: -1 | 1): THREE.Group {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.28, 1.05),
    shoeMaterial(0, false),
  );
  upper.position.set(0, 0.14, 0.08);
  upper.castShadow = true;

  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.35), upper.material);
  toe.position.set(0, 0.12, 0.62);
  toe.rotation.x = -0.12;
  toe.castShadow = true;

  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 1.15), soleMaterial());
  sole.position.set(0, 0.02, 0.06);
  sole.castShadow = true;

  const swoosh = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.42),
    new THREE.MeshStandardMaterial({ color: side < 0 ? 0x5b8da8 : 0xd94f9c, roughness: 0.4 }),
  );
  swoosh.position.set(side * 0.22, 0.22, 0.1);
  swoosh.rotation.y = side * 0.15;

  g.add(upper, toe, sole, swoosh);
  return g;
}

function buildLeg(): THREE.Group {
  const leg = new THREE.Group();
  const calf = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0xc4b8a8, roughness: 0.7 }),
  );
  calf.position.y = 0.55;
  calf.castShadow = true;
  leg.add(calf);
  return leg;
}

/** Procedural 3D walking sneaker pair for Temple Run gameplay. */
export function createWalkingShoes3D(): WalkingShoes3D {
  const root = new THREE.Group();

  const leftLeg = buildLeg();
  leftLeg.position.set(-0.35, 0, 0);
  const rightLeg = buildLeg();
  rightLeg.position.set(0.35, 0, 0);

  const leftShoeGroup = buildShoe(-1);
  leftShoeGroup.position.set(-0.35, 0, 0.15);
  const rightShoeGroup = buildShoe(1);
  rightShoeGroup.position.set(0.35, 0, 0.15);

  leftLeg.add(leftShoeGroup);
  rightLeg.add(rightShoeGroup);

  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.04, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0x5b8da8,
      transparent: true,
      opacity: 0.55,
    }),
  );
  shieldRing.rotation.x = Math.PI / 2;
  shieldRing.position.y = 0.35;
  shieldRing.visible = false;

  root.add(leftLeg, rightLeg, shieldRing);

  return {
    root,
    leftLeg,
    rightLeg,
    leftShoe: leftShoeGroup.children[0] as THREE.Mesh,
    rightShoe: rightShoeGroup.children[0] as THREE.Mesh,
    shieldRing,
  };
}

export function updateWalkingShoes3D(
  shoes: WalkingShoes3D,
  args: {
    walkPhase: number;
    airborne: boolean;
    dirt: number;
    freshGlow: boolean;
    shieldActive: boolean;
  },
): void {
  const phase = args.walkPhase * Math.PI * 2;
  const stride = args.airborne ? 0.18 : 0.32;
  const lift = args.airborne ? 0.45 : Math.max(0, Math.sin(phase)) * stride;

  shoes.leftLeg.rotation.x = Math.sin(phase) * stride;
  shoes.rightLeg.rotation.x = Math.sin(phase + Math.PI) * stride;
  shoes.leftLeg.position.y = lift * 0.35;
  shoes.rightLeg.position.y = Math.max(0, Math.sin(phase + Math.PI)) * stride * 0.35;

  const matL = shoes.leftShoe.material as THREE.MeshStandardMaterial;
  const matR = shoes.rightShoe.material as THREE.MeshStandardMaterial;
  const color = new THREE.Color(0xf4f4f6);
  if (args.dirt > 0.02) color.lerp(new THREE.Color(0x5c4033), 0.15 + args.dirt * 0.55);
  matL.color.copy(color);
  matR.color.copy(color);
  matL.emissive.set(args.freshGlow ? 0x7ec8d9 : 0x000000);
  matR.emissive.set(args.freshGlow ? 0x7ec8d9 : 0x000000);
  matL.emissiveIntensity = args.freshGlow ? 0.1 : 0;
  matR.emissiveIntensity = args.freshGlow ? 0.1 : 0;

  shoes.shieldRing.visible = args.shieldActive;
  if (args.shieldActive) {
    shoes.shieldRing.rotation.z += 0.04;
  }
}
