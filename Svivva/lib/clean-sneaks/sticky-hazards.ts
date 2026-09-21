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

const STAIN_COLOR: Record<StickyHazardKind, number> = {
  dirt: 0xc48a4a,
  poop: 0x8b4a20,
  banana: 0xffe566,
  gum: 0xff7ec4,
};

/** Colored blotch under the mesh so it reads on dark asphalt. */
function addFloorStain(root: THREE.Group, kind: StickyHazardKind, radius: number) {
  const stain = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 24),
    new THREE.MeshBasicMaterial({
      color: STAIN_COLOR[kind],
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  stain.rotation.x = -Math.PI / 2;
  stain.position.y = 0.02;
  stain.userData.floorMarker = true;
  root.add(stain);
}

/** Procedural Three.js meshes for sticky street trash. */
export function buildStickyHazard3D(kind: StickyHazardKind, scale = 1): THREE.Group {
  const root = new THREE.Group();
  root.userData.stickyKind = kind;

  if (kind === "dirt") {
    addFloorStain(root, kind, 0.45 * scale);
    const dirtMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a32,
      roughness: 0.95,
      metalness: 0,
    });
    const clump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26 * scale, 0), dirtMat);
    clump.scale.set(1.3, 0.5, 1.1);
    clump.position.y = 0.09 * scale;
    root.add(clump);
    for (let i = 0; i < 6; i++) {
      const speck = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 6, 6),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x5c3a22 : 0xb07a48,
          roughness: 1,
        }),
      );
      speck.position.set(
        (Math.random() - 0.5) * 0.5 * scale,
        0.05 * scale,
        (Math.random() - 0.5) * 0.4 * scale,
      );
      root.add(speck);
    }
  } else if (kind === "poop") {
    addFloorStain(root, kind, 0.4 * scale);
    const brown = new THREE.MeshStandardMaterial({
      color: 0x6b3a18,
      roughness: 0.9,
      metalness: 0.02,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a200c, roughness: 0.92 });
    for (let i = 0; i < 3; i++) {
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.2 - i * 0.025, 12, 10), brown);
      scoop.scale.set(1.2 * scale, 0.58 * scale, 1.1 * scale);
      scoop.position.y = (0.09 + i * 0.12) * scale;
      scoop.rotation.y = i * 0.7;
      root.add(scoop);
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08 * scale, 0.14 * scale, 8), dark);
    tip.position.y = 0.46 * scale;
    root.add(tip);
  } else if (kind === "banana") {
    addFloorStain(root, kind, 0.5 * scale);
    const peelMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd84a,
      roughness: 0.4,
      metalness: 0.08,
      clearcoat: 0.5,
      emissive: 0xb8860b,
      emissiveIntensity: 0.28,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xfff6b0,
      roughness: 0.55,
    });
    for (let i = 0; i < 3; i++) {
      const flap = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.075 * scale, 0.4 * scale, 4, 8),
        peelMat,
      );
      const angle = (i / 3) * Math.PI * 2;
      flap.position.set(
        Math.cos(angle) * 0.16 * scale,
        0.09 * scale,
        Math.sin(angle) * 0.16 * scale,
      );
      flap.rotation.z = Math.cos(angle) * 0.95;
      flap.rotation.x = Math.sin(angle) * 0.95;
      root.add(flap);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1 * scale, 10, 8), innerMat);
    core.position.y = 0.07 * scale;
    root.add(core);
  } else {
    addFloorStain(root, kind, 0.46 * scale);
    const gumMat = new THREE.MeshPhysicalMaterial({
      color: 0xff5aaa,
      roughness: 0.15,
      metalness: 0,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      sheen: 0.5,
      sheenColor: new THREE.Color(0xffc0e0),
      emissive: 0xc2185b,
      emissiveIntensity: 0.32,
    });
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.26 * scale, 16, 12), gumMat);
    blob.scale.set(1.5, 0.3, 1.3);
    blob.position.y = 0.06 * scale;
    root.add(blob);
    for (let i = 0; i < 3; i++) {
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018 * scale, 0.01 * scale, 0.2 * scale, 6),
        gumMat,
      );
      strand.position.set((i - 1) * 0.11 * scale, 0.1 * scale, 0.1 * scale);
      strand.rotation.z = (i - 1) * 0.4;
      strand.rotation.x = 0.5;
      root.add(strand);
    }
  }

  setShadows(root);
  return root;
}

/** Cling-on on the sole — no pavement stain. */
export function buildStickyCling3D(kind: StickyHazardKind): THREE.Group {
  const g = buildStickyHazard3D(kind, 0.4);
  for (let i = g.children.length - 1; i >= 0; i--) {
    const child = g.children[i]!;
    if (child.userData.floorMarker) g.remove(child);
  }
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
