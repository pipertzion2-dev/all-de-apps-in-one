import * as THREE from "three";

/** Sticky street hazards that cling to the outsole and briefly stall the runner. */
export type StickyHazardKind = "dirt" | "poop" | "banana" | "gum";

export const STICKY_HAZARD_KINDS: readonly StickyHazardKind[] = [
  "dirt",
  "poop",
  "banana",
  "gum",
] as const;

export function isStickyHazardKind(kind: string): kind is StickyHazardKind {
  return (STICKY_HAZARD_KINDS as readonly string[]).includes(kind);
}

/** How long the shoe stays stuck after stepping in this hazard (ms). */
export const STICKY_STUCK_MS: Record<StickyHazardKind, number> = {
  dirt: 1400,
  poop: 2000,
  banana: 2200,
  gum: 2600,
};

/** Forward speed multiplier while stuck (lower = more stuck). */
export const STICKY_SPEED_MUL: Record<StickyHazardKind, number> = {
  dirt: 0.42,
  poop: 0.32,
  banana: 0.28,
  gum: 0.22,
};

export type StickyAttachment = {
  id: number;
  kind: StickyHazardKind;
  shoe: "left" | "right";
  until: number;
};

function setShadows(obj: THREE.Object3D) {
  obj.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
}

/** Procedural Three.js meshes for sticky street trash. */
export function buildStickyHazard3D(kind: StickyHazardKind, scale = 1): THREE.Group {
  const root = new THREE.Group();
  root.userData.stickyKind = kind;

  if (kind === "dirt") {
    const dirtMat = new THREE.MeshStandardMaterial({
      color: 0x5a4030,
      roughness: 1,
      metalness: 0,
    });
    const clump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 * scale, 0), dirtMat);
    clump.scale.set(1.2, 0.45, 1.0);
    clump.position.y = 0.05 * scale;
    root.add(clump);
    for (let i = 0; i < 5; i++) {
      const speck = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 6, 6),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x3d2a1c : 0x7a5a3a,
          roughness: 1,
        }),
      );
      speck.position.set(
        (Math.random() - 0.5) * 0.35 * scale,
        0.03 * scale,
        (Math.random() - 0.5) * 0.28 * scale,
      );
      root.add(speck);
    }
  } else if (kind === "poop") {
    const brown = new THREE.MeshStandardMaterial({
      color: 0x4a2c14,
      roughness: 0.92,
      metalness: 0.02,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a180c, roughness: 0.95 });
    for (let i = 0; i < 3; i++) {
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.14 - i * 0.02, 12, 10), brown);
      scoop.scale.set(1.15, 0.55, 1.05);
      scoop.position.y = (0.06 + i * 0.09) * scale;
      scoop.rotation.y = i * 0.7;
      scoop.scale.multiplyScalar(scale);
      root.add(scoop);
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06 * scale, 0.1 * scale, 8), dark);
    tip.position.y = 0.34 * scale;
    root.add(tip);
  } else if (kind === "banana") {
    const peelMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0c830,
      roughness: 0.55,
      metalness: 0.05,
      clearcoat: 0.35,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xfff2a8,
      roughness: 0.7,
    });
    // Three peel flaps from a center
    for (let i = 0; i < 3; i++) {
      const flap = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.05 * scale, 0.28 * scale, 4, 8),
        peelMat,
      );
      const angle = (i / 3) * Math.PI * 2;
      flap.position.set(
        Math.cos(angle) * 0.12 * scale,
        0.06 * scale,
        Math.sin(angle) * 0.12 * scale,
      );
      flap.rotation.z = Math.cos(angle) * 0.9;
      flap.rotation.x = Math.sin(angle) * 0.9;
      root.add(flap);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.07 * scale, 10, 8), innerMat);
    core.position.y = 0.05 * scale;
    root.add(core);
  } else {
    // gum — flattened sticky blob with stretch tendrils
    const gumMat = new THREE.MeshPhysicalMaterial({
      color: 0xd94f9c,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.2,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xffb0d8),
    });
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 14, 10), gumMat);
    blob.scale.set(1.35, 0.28, 1.15);
    blob.position.y = 0.04 * scale;
    root.add(blob);
    for (let i = 0; i < 3; i++) {
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012 * scale, 0.008 * scale, 0.14 * scale, 6),
        gumMat,
      );
      strand.position.set((i - 1) * 0.1 * scale, 0.08 * scale, 0.08 * scale);
      strand.rotation.z = (i - 1) * 0.45;
      strand.rotation.x = 0.5;
      root.add(strand);
    }
  }

  setShadows(root);
  return root;
}

/** Tiny cling-on copy for the sole of a shoe. */
export function buildStickyCling3D(kind: StickyHazardKind): THREE.Group {
  const g = buildStickyHazard3D(kind, 0.45);
  g.position.set((Math.random() - 0.5) * 0.12, 0.02, 0.04 + Math.random() * 0.06);
  g.rotation.y = Math.random() * Math.PI;
  return g;
}

export function strongestStickyMul(attachments: StickyAttachment[], now: number): number {
  let mul = 1;
  for (const a of attachments) {
    if (a.until <= now) continue;
    mul = Math.min(mul, STICKY_SPEED_MUL[a.kind]);
  }
  return mul;
}

export function pruneStickyAttachments(
  attachments: StickyAttachment[],
  now: number,
): StickyAttachment[] {
  return attachments.filter((a) => a.until > now);
}
